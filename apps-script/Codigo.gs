/**
 * Cabañas Cielo Azul · Sistema de reservas
 * Backend en Google Apps Script: lee y escribe la planilla de Google Sheets.
 *
 * La pestaña BD_RESERVAS es el registro principal (una fila por reserva, con ID único RES-000001).
 * BD_PAGOS guarda cada pago/seña (PAG-000001), BD_RECIBOS cada recibo emitido (REC-000001) y BD_TARIFAS el precio por noche.
 * Las hojas mensuales (ENERO 2027, etc.) se reescriben solas en el bloque de cada cabaña: una "x" por noche,
 * "?" si está por confirmar, teléfono, valor, seña, total, ocupantes y notas. La columna "A cobrar" conserva su fórmula.
 * Antes de cada cambio se incorpora lo que se haya escrito a mano en esas hojas, para no perderlo.
 */

/* ===== Lector de la planilla mensual (una hoja por mes, bloques por cabaña, "x" por noche) ===== */
var MESES = {ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,set:9,oct:10,nov:11,dic:12};
function hojaMes(nombre) {
  var n = String(nombre).toLowerCase().replace(/\s+/g, ' ').trim();
  if (n.indexOf('gasto') >= 0) return null;
  var m = n.match(/^(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-zñ]*[\s\-]*(\d{2,4})$/);
  if (!m) return null;
  var y = parseInt(m[2], 10); if (y < 100) y += 2000;
  return { y: y, m: MESES[m[1]] };
}
function aNum(v) {
  if (typeof v === 'number') return isFinite(v) ? Math.round(v) : 0;
  if (typeof v !== 'string') return 0;
  var t = v.replace(/[$\s]/g, '');
  if (!/^-?[\d.,]+$/.test(t)) return 0;
  t = t.replace(/,/g, '');
  var n = parseFloat(t); return isFinite(n) ? Math.round(n) : 0;
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function isoDe(y, m, d) { return y + '-' + pad2(m) + '-' + pad2(d); }
function sumarDias(iso, k) { var t = Date.parse(iso + 'T00:00:00Z') + k * 86400000; return new Date(t).toISOString().slice(0, 10); }
function limpiarNombre(g) {
  var nota = [], origen = 'Directo';
  if (/air/i.test(g)) origen = 'Airbnb';
  if (/\(laly\)/i.test(g)) origen = 'Laly';
  if (/a confirmar/i.test(g)) nota.push('a confirmar');
  var sm = g.match(/sumar\s*\d+.*$/i); if (sm) nota.push(sm[0].trim());
  var dni = g.match(/\d{7,}/); if (dni) nota.push('N° ' + dni[0]);
  var n = g.replace(/sumar\s*\d+.*$/i, '').replace(/\(laly\)|airbnb|\bairb\b|a confirmar|\d{7,}/gi, '').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  n = n.split(' ').map(function (w) { var l = w.toLowerCase(); return (l === 'y' || l === 'de' || l === 'del') ? l : l.charAt(0).toUpperCase() + l.slice(1); }).join(' ');
  return { nombre: n || 'Sin nombre', origen: origen, nota: nota.join(' · ') };
}
function slug(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'x'; }

/* filas: matriz de la hoja (fila 0 = fila 1 de Excel). Devuelve estadías {cabin, from, to, ...} */
function leerHoja(filas, y, m, hoja) {
  var nd = new Date(Date.UTC(y, m, 0)).getUTCDate(), cab = null, out = [];
  var COL = { tel: 34, valor: 35, sena: 36, total: 37, cobrar: 38, ocup: 40, notas: -1 };
  for (var r = 0; r < filas.length; r++) {
    var row = filas[r]; if (!row) continue;
    var a = row[0], as = typeof a === 'string' ? a.trim() : '';
    if (/^CABA/i.test(as)) {
      var mm = as.match(/CABA\S*\s+(\d+)/i); cab = mm ? parseInt(mm[1], 10) : null;
      for (var ci = 32; ci < row.length; ci++) { var hv = String(row[ci] == null ? '' : row[ci]).toLowerCase().trim();
        if (hv.indexOf('tel') === 0) COL.tel = ci; else if (hv.indexOf('valor') === 0) COL.valor = ci; else if (hv.indexOf('se') === 0 && hv.indexOf('a') > 0 && hv.length <= 5) COL.sena = ci;
        else if (hv.indexOf('venta') === 0) COL.total = ci; else if (hv.indexOf('a cobrar') === 0) COL.cobrar = ci; else if (hv.indexOf('ocupantes') >= 0 || hv.indexOf('0cupantes') >= 0) COL.ocup = ci; else if (hv.indexOf('nota') === 0) COL.notas = ci; }
      continue; }
    if (cab === null) continue;
    var marcas = [];
    for (var d = 1; d <= nd; d++) { var v = row[d]; marcas.push(v == null ? '' : String(v).trim().toLowerCase()); }
    var dias = []; marcas.forEach(function (v, i) { if (v === 'x' || v === '?') dias.push(i + 1); });
    if (!dias.length) continue;
    var crudo = as || 'Sin nombre';
    var tramos = [], s = dias[0], p = dias[0];
    for (var i = 1; i < dias.length; i++) { if (dias[i] === p + 1) p = dias[i]; else { tramos.push([s, p]); s = p = dias[i]; } }
    tramos.push([s, p]);
    tramos.forEach(function (t) {
      out.push({ cabin: cab, crudo: crudo, from: isoDe(y, m, t[0]), to: sumarDias(isoDe(y, m, t[1]), 1),
        duda: marcas.slice(t[0] - 1, t[1]).indexOf('?') >= 0,
        tel: row[COL.tel] != null ? String(row[COL.tel]).trim() : '', valor: row[COL.valor] != null ? String(row[COL.valor]).trim() : '',
        sena: aNum(row[COL.sena]), total: aNum(row[COL.total]), cobrar: aNum(row[COL.cobrar]), ocup: aNum(row[COL.ocup]),
        notas: COL.notas >= 0 && row[COL.notas] != null ? String(row[COL.notas]).trim() : '', hoja: hoja });
    });
  }
  return out;
}

/* wbLeer(nombres) -> {nombre: filas}. desdeISO: primer día a importar */
function estadiasDeLibro(nombresHojas, leerFilas, desdeISO) {
  var dy = parseInt(desdeISO.slice(0, 4), 10), dm = parseInt(desdeISO.slice(5, 7), 10);
  var elegidas = [];
  nombresHojas.forEach(function (n) { var hm = hojaMes(n); if (hm && (hm.y > dy || (hm.y === dy && hm.m >= dm))) elegidas.push({ n: n, y: hm.y, m: hm.m }); });
  var todas = [];
  elegidas.forEach(function (h) { todas = todas.concat(leerHoja(leerFilas(h.n), h.y, h.m, h.n.trim())); });
  todas.sort(function (a, b) { return a.cabin - b.cabin || (a.from < b.from ? -1 : a.from > b.from ? 1 : 0); });
  var unidas = [];
  todas.forEach(function (s) {
    var u = unidas[unidas.length - 1];
    var ln = limpiarNombre(s.crudo).nombre.toLowerCase();
    if (u && u.cabin === s.cabin && u.to === s.from && u.hoja !== s.hoja) {
      var un = limpiarNombre(u.crudo).nombre.toLowerCase();
      if (un.slice(0, 4) === ln.slice(0, 4) || un === 'sin nombre' || ln === 'sin nombre') {
        u.to = s.to; if (!u.total && s.total) { u.sena = s.sena; u.total = s.total; u.cobrar = s.cobrar; } return;
      }
    }
    unidas.push(Object.assign({}, s));
  });
  return unidas.map(function (s) {
    var ln = limpiarNombre(s.crudo);
    var notas = [ln.nota, s.valor && aNum(s.valor) === 0 ? s.valor : '', s.notas].filter(Boolean).join(' · ');
    var estado0 = 0; var estado = (s.duda || /a confirmar/i.test(s.crudo)) ? 'porconfirmar' : (s.total > 0 && s.cobrar <= 0) ? 'pagada' : s.sena > 0 ? 'sena' : 'sinpago';
    return { id: 'x_' + s.cabin + '_' + s.from + '_' + slug(ln.nombre), cabin: s.cabin, huesped: ln.nombre, from: s.from, to: s.to,
      origen: ln.origen, estado: estado, sena: s.sena, total: s.total, cobrar: estado === 'pagada' ? 0 : (s.cobrar || Math.max(s.total - s.sena, 0)),
      tel: /\d{6,}/.test(s.tel) ? s.tel : '', personas: s.ocup || 0, nota: notas, textoExcel: s.crudo, hoja: s.hoja, fuente: 'excel' };
  });
}


/* =====================================================================
   NÚCLEO DEL SISTEMA (no depende de Google: trabaja sobre un "adaptador")
   ===================================================================== */
var VERSION = '1.0.0';
var CABANAS = [
  { id: 1, nombre: 'Luna', capacidad: 3, precio: 70000 },
  { id: 2, nombre: 'Marte', capacidad: 10, precio: 215000 },
  { id: 3, nombre: 'Júpiter', capacidad: 6, precio: 125000 },
  { id: 4, nombre: 'Tierra', capacidad: 6, precio: 125000 },
  { id: 5, nombre: 'Sol', capacidad: 5, precio: 115000 },
  { id: 6, nombre: 'Saturno', capacidad: 5, precio: 115000 },
  { id: 7, nombre: 'Escorpio', capacidad: 12, precio: 225000 },
  { id: 0, nombre: 'Cabaña 0', capacidad: 4, precio: 0 }
];
var ESTADOS = ['porconfirmar', 'sinpago', 'sena', 'pagada', 'cancelada'];
var ESTADO_TXT = { porconfirmar: 'Por confirmar', sinpago: 'Confirmada sin pago', sena: 'Con seña', pagada: 'Pagada', cancelada: 'Cancelada' };

var H_RES = 'BD_RESERVAS', H_PAG = 'BD_PAGOS', H_REC = 'BD_RECIBOS', H_TAR = 'BD_TARIFAS';
var ENC_RES = ['ID', 'Cabaña', 'Huésped', 'Teléfono', 'Personas', 'Llegada', 'Salida', 'Origen', 'Estado', 'Total', 'Pagado', 'Saldo', 'Notas', 'Creada', 'Editada', 'Fuente', 'Clave'];
var ENC_PAG = ['ID', 'Reserva', 'Fecha', 'Monto', 'Medio', 'Concepto', 'Notas', 'Recibo', 'Estado', 'Creado', 'Clave'];
var ENC_REC = ['N°', 'Fecha', 'Reserva', 'Pago', 'Huésped', 'Cabaña', 'Concepto', 'Medio', 'Monto', 'Total estadía', 'Pagado a la fecha', 'Saldo', 'Notas', 'Creado', 'Clave'];
var ENC_TAR = ['Cabaña', 'Nombre', 'Capacidad', 'Precio por noche'];
// columnas que deben quedar como texto (fechas, IDs, teléfonos) para que Sheets no las convierta
var TEXTO_RES = [1, 4, 6, 7, 14, 15, 17], TEXTO_PAG = [1, 2, 3, 8, 10, 11], TEXTO_REC = [1, 2, 3, 4, 14, 15];

function SysError(msg, code) { var e = new Error(msg); e.code = code || 'error'; return e; }
function p2(n) { return (n < 10 ? '0' : '') + n; }
function dnum(s) { return Math.round(Date.parse(s + 'T00:00:00Z') / 86400000); }
function isoN(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
function entero(v) { var n = Number(String(v == null ? '' : v).replace(/[$\s.]/g, '').replace(',', '.')); if (typeof v === 'number') n = v; return isFinite(n) ? Math.round(n) : 0; }
function txt(v) { return v == null ? '' : String(v).trim(); }
function ahoraISO() { return new Date().toISOString(); }
function mesesDe(from, to) { var out = [], a = dnum(from), b = dnum(to); for (var d = a; d < b; d++) { var k = isoN(d).slice(0, 7); if (out.indexOf(k) < 0) out.push(k); } return out; }
function sigId(prefijo, lista, campo) {
  var mx = 0; lista.forEach(function (o) { var m = String(o[campo] || '').match(/(\d+)$/); if (m && String(o[campo]).indexOf(prefijo) === 0) mx = Math.max(mx, parseInt(m[1], 10)); });
  return prefijo + String(mx + 1).padStart(6, '0');
}

function Sistema(A) {
  this.A = A;
}

/* ---------- estructura ---------- */
Sistema.prototype.asegurar = function () {
  var A = this.A, creadas = [];
  [[H_RES, ENC_RES, TEXTO_RES], [H_PAG, ENC_PAG, TEXTO_PAG], [H_REC, ENC_REC, TEXTO_REC], [H_TAR, ENC_TAR, []]].forEach(function (h) {
    if (!A.existe(h[0])) { A.crear(h[0], h[1], h[2]); creadas.push(h[0]); }
  });
  if (creadas.indexOf(H_TAR) >= 0) A.agregar(H_TAR, CABANAS.map(function (c) { return [c.id, c.nombre, c.capacidad, c.precio]; }));
  if (creadas.indexOf(H_RES) >= 0) this.importar('2000-01-01');
  return creadas;
};

/* ---------- lectura ---------- */
Sistema.prototype._tabla = function (hoja, n) {
  var A = this.A, ult = A.ultimaFila(hoja);
  if (ult < 2) return [];
  return A.leer(hoja, 2, 1, ult - 1, n).map(function (f, i) { f._fila = i + 2; return f; });
};
Sistema.prototype.leer = function () {
  var A = this.A, iso = A.aISO;
  var reservas = this._tabla(H_RES, ENC_RES.length).filter(function (f) { return txt(f[0]); }).map(function (f) {
    var r = { id: txt(f[0]), cabin: entero(f[1]), huesped: txt(f[2]) || 'Sin nombre', tel: txt(f[3]), personas: entero(f[4]), from: iso(f[5]), to: iso(f[6]),
      origen: txt(f[7]) || 'Directo', estado: ESTADOS.indexOf(txt(f[8])) >= 0 ? txt(f[8]) : 'sinpago', total: entero(f[9]), sena: entero(f[10]),
      nota: txt(f[12]), creada: txt(f[13]), editada: txt(f[14]), fuente: txt(f[15]) || 'app', clave: txt(f[16]), _fila: f._fila };
    r.cobrar = r.estado === 'pagada' ? 0 : Math.max(r.total - r.sena, 0);
    return r;
  }).filter(function (r) { return r.from && r.to; });
  var pagos = this._tabla(H_PAG, ENC_PAG.length).filter(function (f) { return txt(f[0]); }).map(function (f) {
    return { id: txt(f[0]), reserva: txt(f[1]), fecha: iso(f[2]), monto: entero(f[3]), medio: txt(f[4]), concepto: txt(f[5]), nota: txt(f[6]), recibo: txt(f[7]), estado: txt(f[8]) || 'activo', creado: txt(f[9]), clave: txt(f[10]), _fila: f._fila };
  });
  var recibos = this._tabla(H_REC, ENC_REC.length).filter(function (f) { return txt(f[0]); }).map(function (f) {
    return { nro: txt(f[0]), fecha: iso(f[1]), reserva: txt(f[2]), pago: txt(f[3]), huesped: txt(f[4]), cabin: entero(f[5]), concepto: txt(f[6]), medio: txt(f[7]), monto: entero(f[8]), total: entero(f[9]), pagado: entero(f[10]), saldo: entero(f[11]), nota: txt(f[12]), creado: txt(f[13]), clave: txt(f[14]), _fila: f._fila };
  });
  var tarifas = {};
  this._tabla(H_TAR, 4).forEach(function (f) { if (txt(f[0]) !== '') tarifas[entero(f[0])] = entero(f[3]); });
  return { reservas: reservas, pagos: pagos, recibos: recibos, tarifas: tarifas };
};
Sistema.prototype.publico = function (d) {
  var limpio = function (o) { var x = {}; for (var k in o) if (k !== '_fila') x[k] = o[k]; return x; };
  return { reservas: d.reservas.map(limpio), pagos: d.pagos.map(limpio), recibos: d.recibos.map(limpio), tarifas: d.tarifas,
    hoja: { id: this.A.id(), titulo: this.A.titulo(), url: 'https://docs.google.com/spreadsheets/d/' + this.A.id() + '/edit' }, leido: ahoraISO(), version: VERSION };
};

/* ---------- reservas ---------- */
function filaRes(r) {
  var saldo = r.estado === 'pagada' ? 0 : Math.max((r.total || 0) - (r.sena || 0), 0);
  return [r.id, r.cabin, r.huesped, r.tel || '', r.personas || '', r.from, r.to, r.origen || '', r.estado, r.total || 0, r.sena || 0, saldo, r.nota || '', r.creada || '', r.editada || '', r.fuente || 'app', r.clave || ''];
}
Sistema.prototype._validar = function (r, d) {
  if (!r.huesped) throw SysError('Falta el nombre del huésped.', 'datos');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.from) || !/^\d{4}-\d{2}-\d{2}$/.test(r.to) || r.to <= r.from) throw SysError('Revisá las fechas: la salida tiene que ser después de la llegada.', 'datos');
  if (!CABANAS.some(function (c) { return c.id === r.cabin; })) throw SysError('Cabaña desconocida.', 'datos');
  if (ESTADOS.indexOf(r.estado) < 0) r.estado = 'porconfirmar';
  if (r.estado !== 'cancelada') {
    var cx = d.reservas.filter(function (o) { return o.id !== r.id && o.estado !== 'cancelada' && o.cabin === r.cabin && o.from < r.to && o.to > r.from; })[0];
    if (cx) throw SysError('La cabaña ya está ocupada por ' + cx.huesped + ' del ' + cx.from + ' al ' + cx.to + '.', 'cruce');
  }
};
function normalizar(b, prev) {
  var r = {}, k; prev = prev || {};
  for (k in prev) r[k] = prev[k];
  ['cabin', 'huesped', 'tel', 'personas', 'from', 'to', 'origen', 'estado', 'total', 'nota'].forEach(function (c) { if (b && b[c] !== undefined) r[c] = b[c]; });
  r.cabin = entero(r.cabin); r.personas = entero(r.personas); r.total = entero(r.total); r.sena = entero(r.sena);
  r.huesped = txt(r.huesped); r.tel = txt(r.tel); r.nota = txt(r.nota); r.origen = txt(r.origen) || 'Directo';
  r.from = txt(r.from).slice(0, 10); r.to = txt(r.to).slice(0, 10); r.estado = txt(r.estado) || 'porconfirmar';
  return r;
}
Sistema.prototype.crearReserva = function (b) {
  var d = this.leer(), clave = txt(b.clave);
  if (clave) { var ya = d.reservas.filter(function (o) { return o.clave === clave; })[0]; if (ya) return { reserva: ya, repetida: true }; }
  var r = normalizar(b.reserva || b);
  if (r.from && r.to > r.from) this._importarMeses(d, mesesDe(r.from, r.to));
  r.id = sigId('RES-', d.reservas, 'id'); r.sena = 0; r.fuente = 'app'; r.clave = clave; r.creada = ahoraISO(); r.editada = r.creada;
  this._validar(r, d);
  this.A.agregar(H_RES, [filaRes(r)]);
  r._fila = this.A.ultimaFila(H_RES);
  d.reservas.push(r);
  var sena = entero((b.reserva || b).sena);
  if (sena > 0) this._pago(d, { reserva: r.id, monto: sena, medio: txt((b.reserva || b).medio) || 'Sin especificar', concepto: 'Seña', fecha: txt((b.reserva || b).fechaSena).slice(0, 10) || r.creada.slice(0, 10), nota: 'Registrada al crear la reserva', clave: clave ? clave + '-sena' : '' });
  this.reescribirMeses(mesesDe(r.from, r.to), d);
  return { reserva: r };
};
Sistema.prototype.actualizarReserva = function (id, cambios) {
  var d = this.leer();
  var prev = d.reservas.filter(function (o) { return o.id === id; })[0];
  if (!prev) throw SysError('No encontré la reserva ' + id + '. Puede que se haya borrado.', 'no_existe');
  var r = normalizar(cambios, prev); r.id = prev.id; r.sena = prev.sena; r.fuente = prev.fuente; r.clave = prev.clave; r.creada = prev.creada; r.editada = ahoraISO(); r._fila = prev._fila;
  if (r.to > r.from) this._importarMeses(d, mesesDe(prev.from, prev.to).concat(mesesDe(r.from, r.to)));
  var pedirPagada = r.estado === 'pagada' && r.total > r.sena;
  if (r.estado !== 'cancelada' && r.estado !== 'porconfirmar' && !pedirPagada) r.estado = estadoPorPago(r);
  this._validar(r, d);
  this.A.escribir(H_RES, prev._fila, 1, [filaRes(r)]);
  d.reservas[d.reservas.indexOf(prev)] = r;
  // "Pagada" con saldo pendiente: se registra el pago del saldo para que la caja cierre
  if (pedirPagada) this._pago(d, { reserva: r.id, monto: r.total - r.sena, medio: txt(cambios.medio) || 'Sin especificar', concepto: 'Saldo', fecha: txt(cambios.fecha).slice(0, 10) || ahoraISO().slice(0, 10), nota: 'Registrado al marcar la reserva como pagada' });
  this.reescribirMeses(mesesDe(prev.from, prev.to).concat(mesesDe(r.from, r.to)), d);
  return { reserva: r };
};
function estadoPorPago(r) {
  if (r.total > 0 && r.sena >= r.total) return 'pagada';
  if (r.sena > 0 && (r.estado === 'sinpago' || r.estado === 'porconfirmar')) return 'sena';
  if (r.sena === 0 && (r.estado === 'sena' || r.estado === 'pagada') && !(r.total === 0 && r.estado === 'pagada')) return 'sinpago';
  return r.estado;
}
Sistema.prototype.cancelarReserva = function (id) { return this.actualizarReserva(id, { estado: 'cancelada' }); };
Sistema.prototype.eliminarReserva = function (id) {
  var d = this.leer(), A = this.A;
  var prev = d.reservas.filter(function (o) { return o.id === id; })[0];
  if (!prev) throw SysError('No encontré la reserva ' + id + '. Puede que ya se haya borrado.', 'no_existe');
  this._importarMeses(d, mesesDe(prev.from, prev.to));
  d.pagos.filter(function (p) { return p.reserva === id && p.estado === 'activo'; }).forEach(function (p) { A.escribir(H_PAG, p._fila, 9, [['anulado (reserva eliminada)']]); });
  A.borrarFila(H_RES, prev._fila);
  d.reservas = d.reservas.filter(function (o) { return o.id !== id; });
  this.reescribirMeses(mesesDe(prev.from, prev.to), d);
  return { ok: true };
};

/* ---------- pagos e ingresos ---------- */
Sistema.prototype._recalcular = function (d, idRes) {
  var r = d.reservas.filter(function (o) { return o.id === idRes; })[0]; if (!r) return null;
  r.sena = d.pagos.filter(function (p) { return p.reserva === idRes && p.estado === 'activo'; }).reduce(function (a, p) { return a + p.monto; }, 0);
  if (r.estado !== 'cancelada') r.estado = estadoPorPago(r);
  r.editada = ahoraISO();
  this.A.escribir(H_RES, r._fila, 1, [filaRes(r)]);
  return r;
};
Sistema.prototype._pago = function (d, b) {
  var monto = entero(b.monto);
  if (monto <= 0) throw SysError('El monto del pago tiene que ser mayor a cero.', 'datos');
  var p = { id: sigId('PAG-', d.pagos, 'id'), reserva: txt(b.reserva), fecha: txt(b.fecha).slice(0, 10) || ahoraISO().slice(0, 10), monto: monto, medio: txt(b.medio) || 'Efectivo', concepto: txt(b.concepto) || 'Pago', nota: txt(b.nota), recibo: '', estado: 'activo', creado: ahoraISO(), clave: txt(b.clave) };
  this.A.agregar(H_PAG, [[p.id, p.reserva, p.fecha, p.monto, p.medio, p.concepto, p.nota, p.recibo, p.estado, p.creado, p.clave]]);
  p._fila = this.A.ultimaFila(H_PAG);
  d.pagos.push(p);
  this._recalcular(d, p.reserva);
  return p;
};
Sistema.prototype.registrarPago = function (b) {
  var d = this.leer(), clave = txt(b.clave), self = this;
  if (clave) { var ya = d.pagos.filter(function (o) { return o.clave === clave; })[0]; if (ya) return { pago: ya, recibo: d.recibos.filter(function (x) { return x.nro === ya.recibo; })[0] || null, repetida: true }; }
  var r = d.reservas.filter(function (o) { return o.id === txt(b.reserva); })[0];
  if (!r) throw SysError('No encontré la reserva para registrar el pago.', 'no_existe');
  var p = this._pago(d, b), rec = null;
  if (b.conRecibo) {
    rec = this._recibo(d, { reserva: r.id, pago: p.id, monto: p.monto, medio: p.medio, concepto: p.concepto, fecha: p.fecha, nota: p.nota, de: b.de, clave: clave ? clave + '-rec' : '' });
    this.A.escribir(H_PAG, p._fila, 8, [[rec.nro]]); p.recibo = rec.nro;
  }
  this.reescribirMeses(mesesDe(r.from, r.to), d);
  return { pago: p, recibo: rec };
};
Sistema.prototype.anularPago = function (id) {
  var d = this.leer();
  var p = d.pagos.filter(function (o) { return o.id === id; })[0];
  if (!p) throw SysError('No encontré el pago ' + id + '.', 'no_existe');
  if (p.estado !== 'activo') return { pago: p };
  this.A.escribir(H_PAG, p._fila, 9, [['anulado']]); p.estado = 'anulado';
  var r = this._recalcular(d, p.reserva);
  if (r) this.reescribirMeses(mesesDe(r.from, r.to), d);
  return { pago: p };
};

/* ---------- recibos ---------- */
Sistema.prototype._recibo = function (d, b) {
  var r = d.reservas.filter(function (o) { return o.id === txt(b.reserva); })[0];
  if (!r) throw SysError('No encontré la reserva del recibo.', 'no_existe');
  var x = { nro: sigId('REC-', d.recibos, 'nro'), fecha: txt(b.fecha).slice(0, 10) || ahoraISO().slice(0, 10), reserva: r.id, pago: txt(b.pago), huesped: txt(b.de) || r.huesped, cabin: r.cabin,
    concepto: txt(b.concepto) || 'Pago', medio: txt(b.medio), monto: entero(b.monto), total: r.total, pagado: r.sena, saldo: r.estado === 'pagada' ? 0 : Math.max(r.total - r.sena, 0), nota: txt(b.nota), creado: ahoraISO(), clave: txt(b.clave) };
  this.A.agregar(H_REC, [[x.nro, x.fecha, x.reserva, x.pago, x.huesped, x.cabin, x.concepto, x.medio, x.monto, x.total, x.pagado, x.saldo, x.nota, x.creado, x.clave]]);
  d.recibos.push(x);
  return x;
};
Sistema.prototype.registrarRecibo = function (b) {
  var d = this.leer(), clave = txt(b.clave);
  if (clave) { var ya = d.recibos.filter(function (o) { return o.clave === clave; })[0]; if (ya) return { recibo: ya, repetida: true }; }
  return { recibo: this._recibo(d, b) };
};

/* ---------- tarifas ---------- */
Sistema.prototype.guardarTarifa = function (cabin, precio) {
  var A = this.A, id = entero(cabin), c = CABANAS.filter(function (k) { return k.id === id; })[0];
  if (!c) throw SysError('Cabaña desconocida.', 'datos');
  var filas = this._tabla(H_TAR, 4), f = filas.filter(function (x) { return entero(x[0]) === id && txt(x[0]) !== ''; })[0];
  var v = [[id, c.nombre, c.capacidad, entero(precio)]];
  if (f) A.escribir(H_TAR, f._fila, 1, v); else A.agregar(H_TAR, v);
  return { ok: true };
};

/* ---------- hojas mensuales ---------- */
Sistema.prototype._titulosMes = function () {
  var out = {}; this.A.titulos().forEach(function (t) { var h = hojaMes(t); if (h) out[h.y + '-' + p2(h.m)] = t; }); return out;
};
Sistema.prototype.reescribirMeses = function (claves, d) {
  var A = this.A, porClave = this._titulosMes(), uniq = [];
  (claves || []).forEach(function (k) { if (k && uniq.indexOf(k) < 0) uniq.push(k); });
  var faltan = uniq.filter(function (k) { return !porClave[k]; }), hechas = [];
  d = d || this.leer();
  uniq.filter(function (k) { return porClave[k]; }).forEach(function (k) {
    var titulo = porClave[k], colA = A.leer(titulo, 1, 1, 140, 1).map(function (f) { return f[0] == null ? '' : String(f[0]); });
    var y = +k.slice(0, 4), m = +k.slice(5, 7), nd = new Date(Date.UTC(y, m, 0)).getUTCDate(), ini = k + '-01', fin = isoN(dnum(ini) + nd);
    for (var r = 0; r < colA.length; r++) {
      var mm = colA[r].match(/^\s*CABA\S*\s+(\d+)/i); if (!mm) continue;
      var cab = +mm[1], sub = r + 2;
      while (sub < colA.length && !/^\s*subtotal/i.test(colA[sub]) && !/^\s*CABA/i.test(colA[sub])) sub++;
      var nFilas = sub - (r + 2); if (nFilas <= 0) continue;
      var lista = d.reservas.filter(function (o) { return o.cabin === cab && o.estado !== 'cancelada' && o.from < fin && o.to > ini; }).sort(function (a, b) { return a.from < b.from ? -1 : 1; });
      var izq = [], der = [];
      for (var j = 0; j < nFilas; j++) {
        var o = lista[j], fi = [], fd = ['', '', ''];
        for (var c = 0; c < 37; c++) fi.push('');
        if (o) {
          fi[0] = o.huesped;
          for (var dd = 1; dd <= nd; dd++) { var di = k + '-' + p2(dd); if (di >= o.from && di < o.to) fi[dd] = o.estado === 'porconfirmar' ? '?' : 'x'; }
          fi[33] = o.tel || ''; fi[34] = d.tarifas[o.cabin] || ''; fi[35] = o.sena || ''; fi[36] = o.total || '';
          fd[1] = o.personas || '';
          var extra = (j === nFilas - 1 && lista.length > nFilas) ? ' · +' + (lista.length - nFilas) + ' reservas más en el sistema' : '';
          fd[2] = [o.id, ESTADO_TXT[o.estado], (o.origen && o.origen !== 'Directo') ? o.origen : '', o.nota].filter(Boolean).join(' · ') + extra;
        }
        izq.push(fi); der.push(fd);
      }
      A.escribir(titulo, r + 3, 1, izq);   // columnas A..AK (nombre, días, teléfono, valor, seña, total)
      A.escribir(titulo, r + 3, 39, der);  // columnas AM..AO (mail, ocupantes, notas) · AL (A cobrar) conserva su fórmula
    }
    hechas.push(titulo);
  });
  return { meses: hechas, faltan: faltan };
};
Sistema.prototype.reconstruir = function () {
  var d = this.leer(), claves = [];
  d.reservas.forEach(function (o) { mesesDe(o.from, o.to).forEach(function (k) { claves.push(k); }); });
  return this.reescribirMeses(claves, d);
};

/* ---------- importar lo escrito a mano en las hojas mensuales ---------- */
Sistema.prototype._importarTitulos = function (d, titulos, desde) {
  var A = this.A, self = this;
  if (!titulos.length) return 0;
  var filas = {}; titulos.forEach(function (t) { filas[t] = A.leer(t, 1, 1, 140, 41); });
  var est = estadiasDeLibro(titulos, function (n) { return filas[n] || []; }, desde || '2000-01-01');
  var nuevas = est.filter(function (s) {
    var limpio = String(s.huesped || '');
    return !d.reservas.some(function (o) { return o.cabin === s.cabin && (o.from === s.from || (o.estado !== 'cancelada' && o.from < s.to && o.to > s.from)); }) && !/^RES-\d+/.test(limpio);
  });
  nuevas.forEach(function (s) {
    var r = { id: sigId('RES-', d.reservas, 'id'), cabin: s.cabin, huesped: s.huesped, tel: s.tel, personas: s.personas, from: s.from, to: s.to, origen: s.origen, estado: s.estado, total: s.total, sena: 0, nota: s.nota, creada: ahoraISO(), editada: ahoraISO(), fuente: 'planilla', clave: '' };
    A.agregar(H_RES, [filaRes(r)]); r._fila = A.ultimaFila(H_RES); d.reservas.push(r);
    if (s.sena > 0) self._pago(d, { reserva: r.id, monto: s.sena, medio: 'Sin especificar', concepto: 'Seña', fecha: s.from, nota: 'Importada de la hoja ' + s.hoja });
  });
  return nuevas.length;
};
Sistema.prototype._importarMeses = function (d, claves) {
  var porClave = this._titulosMes(), ts = [];
  claves.forEach(function (k) { if (porClave[k] && ts.indexOf(porClave[k]) < 0) ts.push(porClave[k]); });
  return this._importarTitulos(d, ts);
};
Sistema.prototype.importar = function (desde) {
  if (!this.A.existe(H_RES)) { this.asegurar(); return { agregadas: 'inicial' }; }
  var d = this.leer(), hoy = new Date();
  desde = txt(desde) || (hoy.getUTCMonth() === 0 ? (hoy.getUTCFullYear() - 1) + '-12-01' : hoy.getUTCFullYear() + '-' + p2(hoy.getUTCMonth()) + '-01');
  var porClave = this._titulosMes();
  var ts = Object.keys(porClave).filter(function (k) { return k >= desde.slice(0, 7); }).sort().map(function (k) { return porClave[k]; });
  return { agregadas: this._importarTitulos(d, ts, desde), hojas: ts.length, desde: desde };
};

/* ---------- enrutador de acciones ---------- */
Sistema.prototype.ejecutar = function (accion, b) {
  b = b || {};
  var res;
  switch (accion) {
    case 'ping': this.asegurar(); return { ok: true, hoja: { id: this.A.id(), titulo: this.A.titulo() }, version: VERSION };
    case 'datos': this.asegurar(); return { ok: true, datos: this.publico(this.leer()) };
    case 'crearReserva': res = this.crearReserva(b); break;
    case 'actualizarReserva': res = this.actualizarReserva(txt(b.id), b.cambios || {}); break;
    case 'cancelarReserva': res = this.cancelarReserva(txt(b.id)); break;
    case 'eliminarReserva': res = this.eliminarReserva(txt(b.id)); break;
    case 'registrarPago': res = this.registrarPago(b); break;
    case 'anularPago': res = this.anularPago(txt(b.id)); break;
    case 'registrarRecibo': res = this.registrarRecibo(b); break;
    case 'guardarTarifa': res = this.guardarTarifa(b.cabin, b.precio); break;
    case 'importar': res = this.importar(b.desde); break;
    case 'reconstruir': res = this.reconstruir(); break;
    default: throw SysError('Acción desconocida: ' + accion, 'accion');
  }
  var out = { ok: true, resultado: limpiarFila(res), datos: this.publico(this.leer()) };
  return out;
};
function limpiarFila(o) {
  if (!o || typeof o !== 'object') return o;
  var x = Array.isArray(o) ? [] : {};
  for (var k in o) if (k !== '_fila') x[k] = (o[k] && typeof o[k] === 'object') ? limpiarFila(o[k]) : o[k];
  return x;
}

/* =====================================================================
   CONEXIÓN CON GOOGLE SHEETS (Apps Script)
   ===================================================================== */

// Adaptador real: traduce las operaciones del núcleo a SpreadsheetApp.
function adaptadorSheets(ss) {
  var tz = ss.getSpreadsheetTimeZone();
  function hoja(t) { var h = ss.getSheetByName(t); if (!h) throw SysError('No existe la pestaña "' + t + '" en la planilla.', 'estructura'); return h; }
  return {
    id: function () { return ss.getId(); },
    titulo: function () { return ss.getName(); },
    titulos: function () { return ss.getSheets().map(function (h) { return h.getName(); }); },
    existe: function (t) { return !!ss.getSheetByName(t); },
    crear: function (t, enc, colsTexto) {
      var h = ss.insertSheet(t, ss.getSheets().length);
      h.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold').setBackground('#0F2237').setFontColor('#FFFFFF');
      h.setFrozenRows(1);
      (colsTexto || []).forEach(function (c) { h.getRange(1, c, h.getMaxRows(), 1).setNumberFormat('@'); });
      h.setTabColor('#1F5FAA');
    },
    ultimaFila: function (t) { return hoja(t).getLastRow(); },
    leer: function (t, fila, col, nf, nc) {
      var h = hoja(t), maxF = h.getMaxRows(), maxC = h.getMaxColumns();
      var f2 = Math.min(nf, maxF - fila + 1), c2 = Math.min(nc, maxC - col + 1);
      var out = (f2 > 0 && c2 > 0) ? h.getRange(fila, col, f2, c2).getValues() : [];
      return out.map(function (r) { while (r.length < nc) r.push(''); return r; });
    },
    escribir: function (t, fila, col, vals) {
      if (!vals.length) return;
      var h = hoja(t), nc = vals[0].length;
      if (h.getMaxColumns() < col + nc - 1) h.insertColumnsAfter(h.getMaxColumns(), col + nc - 1 - h.getMaxColumns());
      h.getRange(fila, col, vals.length, nc).setValues(vals);
    },
    agregar: function (t, vals) {
      if (!vals.length) return;
      var h = hoja(t), ini = h.getLastRow() + 1;
      if (h.getMaxRows() < ini + vals.length - 1) h.insertRowsAfter(h.getMaxRows(), vals.length + 50);
      h.getRange(ini, 1, vals.length, vals[0].length).setValues(vals);
    },
    borrarFila: function (t, fila) { hoja(t).deleteRow(fila); },
    aISO: function (v) {
      if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      var s = v == null ? '' : String(v).trim();
      var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0];
      m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return m[3] + '-' + p2(+m[2]) + '-' + p2(+m[1]);
      return s;
    }
  };
}

function abrirPlanilla(id) {
  var props = PropertiesService.getScriptProperties();
  var elegido = String(id || '').trim() || props.getProperty('SHEET_ID') || '';
  if (elegido) {
    try { return SpreadsheetApp.openById(elegido); }
    catch (e) { throw SysError('No puedo abrir esa planilla. Revisá el enlace y que la cuenta que publicó este script tenga permiso de edición.', 'sin_permiso'); }
  }
  var activa = SpreadsheetApp.getActiveSpreadsheet();
  if (activa) return activa;
  throw SysError('No hay planilla configurada. Pegá el enlace de la hoja en Configuración del sistema.', 'config');
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Contraseña para entrar al sistema. Para cambiarla, editá este valor (o definí la propiedad API_TOKEN
// en Configuración del proyecto › Propiedades del script, que tiene prioridad) y creá una nueva versión de la implementación.
var CLAVE_ACCESO = '21311719';

function atender(accion, body) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('API_TOKEN') || CLAVE_ACCESO;
  if (String(body.token || '') !== String(token)) return { ok: false, error: 'Contraseña incorrecta.', code: 'token' };
  var esLectura = accion === 'datos' || accion === 'ping';
  var lock = LockService.getScriptLock();
  try {
    if (!esLectura || accion === 'datos') lock.waitLock(25000);
    var sistema = new Sistema(adaptadorSheets(abrirPlanilla(body.hoja)));
    var out = sistema.ejecutar(accion, body);
    SpreadsheetApp.flush();
    return out;
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e), code: (e && e.code) || 'error' };
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// GET ?accion=datos&hoja=ID&token=...
function doGet(e) {
  var p = (e && e.parameter) || {};
  return responder(atender(p.accion || 'datos', p));
}

// POST con cuerpo JSON (enviado como text/plain para evitar bloqueos CORS): { accion, hoja, token, ... }
function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return responder({ ok: false, error: 'Pedido inválido.', code: 'pedido' }); }
  return responder(atender(body.accion, body));
}

// Ejecutá esta función una vez desde el editor para autorizar los permisos y crear las pestañas BD_*
function configurarPorPrimeraVez() {
  var sistema = new Sistema(adaptadorSheets(abrirPlanilla('')));
  var creadas = sistema.asegurar();
  Logger.log('Pestañas creadas: ' + (creadas.join(', ') || 'ninguna (ya existían)'));
  Logger.log('Reservas en BD_RESERVAS: ' + sistema.leer().reservas.length);
}
