/* Cabañas Cielo Azul · sistema de reservas (frontend)
   Todos los datos se leen y escriben en Google Sheets a través del Apps Script configurado (ver README). */

(function(){
'use strict';
var DRIVE_FILE = '1BjmyM7fHC6nOWI0z3AB0s3kEesXsRpRNT6MRz6Qogx4';
var WA_PROPIO = '5491138167697';
var CAB = [
  {id:1,n:'Luna',cap:'2–3',max:3,p:70000,col:'#4F5F86',tint:'#E6EAF4',fg:'#FFFFFF'},
  {id:2,n:'Marte',cap:'9–10',max:10,p:215000,col:'#B03F22',tint:'#F9E4DD',fg:'#FFFFFF'},
  {id:3,n:'Júpiter',cap:'6',max:6,p:125000,col:'#9A5B1E',tint:'#F6E8D8',fg:'#FFFFFF'},
  {id:4,n:'Tierra',cap:'6',max:6,p:125000,col:'#17705F',tint:'#DDF1EC',fg:'#FFFFFF'},
  {id:5,n:'Sol',cap:'5',max:5,p:115000,col:'#E0A100',tint:'#FFF3CF',fg:'#2A1C00'},
  {id:6,n:'Saturno',cap:'5',max:5,p:115000,col:'#6E4FA0',tint:'#ECE5F6',fg:'#FFFFFF'},
  {id:7,n:'Escorpio',cap:'12',max:12,p:225000,col:'#962858',tint:'#F6E0EA',fg:'#FFFFFF'},
  {id:0,n:'',cap:'4',max:4,p:0,col:'#55712A',tint:'#E7EFDA',fg:'#FFFFFF'}
];
/* Ilustraciones vectoriales por cabaña (viewBox 320x200) */
function ilu(c){
  /* Escena pulida por cabaña (viewBox 320x200): cielo, astro con luz y volumen, tres capas de cerros con bosque, cabaña de ladrillo con chimenea de piedra */
  var T = {
    1: { s:['#0E1631','#25356A','#5468A3'], m:['#3E4F86','#2B3A68','#18223F'], g:'#141C34', tree:'#16233A', noche:true,  glow:'#F6EFD6' },
    2: { s:['#3A0E0A','#9C3520','#F08A54'], m:['#B4502E','#7E2E1A','#4A1A10'], g:'#3A140C', tree:'#3B1A10', noche:false, glow:'#FFC09A' },
    3: { s:['#2A1C0E','#8A5A28','#E8B66C'], m:['#A97B45','#7A5427','#4A3214'], g:'#3A2810', tree:'#3C2A12', noche:false, glow:'#FBE0B0' },
    4: { s:['#3E8FD0','#8CC4EA','#E3F3FA'], m:['#9CC7B6','#5E9F84','#2C6E52'], g:'#2E6B47', tree:'#24583B', noche:false, glow:'#FFFFFF' },
    5: { s:['#F08A1C','#F7BE45','#FFF0C2'], m:['#E6B061','#C58B33','#8E5E14'], g:'#7C5414', tree:'#6B4A12', noche:false, glow:'#FFFBEA' },
    6: { s:['#120B24','#3A2965','#7A62B0'], m:['#4E3C80','#33275C','#1D1636'], g:'#171129', tree:'#1E1834', noche:true,  glow:'#E9D6F7' },
    7: { s:['#14060F','#4A1438','#8E3266'], m:['#5E1E46','#40142F','#260B1C'], g:'#1E0815', tree:'#25101D', noche:true,  glow:'#FFB3A6' },
    0: { s:['#1F2E10','#4F6E2A','#C7DB98'], m:['#7F9C4C','#55732E','#33491A'], g:'#2C4016', tree:'#253813', noche:false, glow:'#FFF8D6' }
  }[c.id] || { s:['#33475E','#6A7D93','#CAD6E4'], m:['#8A9BAE','#5D6E82','#33475E'], g:'#2A3A4C', tree:'#22303F', noche:false, glow:'#FFFFFF' };
  var p = 'k' + c.id + '_', D = '', B = '', A = '', F = '';
  function rnd(seed){ var x = seed; return function(){ x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
  function radial(id, stops, cx, cy, r){ return '<radialGradient id="' + p + id + '"' + (cx != null ? ' cx="' + cx + '" cy="' + cy + '" r="' + r + '"' : '') + '>' + stops.map(function(s){ return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>'; }
  function linear(id, stops, x2, y2){ return '<linearGradient id="' + p + id + '" x1="0" y1="0" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 1 : y2) + '">' + stops.map(function(s){ return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>'; }
  function u(id){ return 'url(#' + p + id + ')'; }
  /* cielo */
  D += linear('sky', [[0, T.s[0]], [0.55, T.s[1]], [1, T.s[2]]]);
  D += radial('glow', [[0, T.glow, 0.75], [0.35, T.glow, 0.25], [1, T.glow, 0]]);
  D += radial('shade', [[0, '#000', 0], [0.62, '#000', 0], [1, '#000', 0.55]], '0.32', '0.3', '0.85');
  D += radial('hl', [[0, '#FFF', 0.55], [0.5, '#FFF', 0.08], [1, '#FFF', 0]], '0.3', '0.28', '0.6');
  D += linear('vig', [[0, '#000', 0], [0.75, '#000', 0], [1, '#000', 0.28]]);
  B += '<rect width="320" height="200" fill="' + u('sky') + '"/>';
  var r = rnd(c.id * 97 + 13);
  if (T.noche) {
    var st = '';
    for (var i = 0; i < 70; i++) { var sx = r() * 320, sy = r() * 118, sr = r() < 0.12 ? 1.5 : r() < 0.5 ? 0.9 : 0.55; st += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="' + sr + '" fill="#FFFFFF" opacity="' + (0.35 + r() * 0.6).toFixed(2) + '"/>'; }
    for (var j = 0; j < 4; j++) { var bx = 20 + r() * 280, by = 10 + r() * 70; st += '<path d="M' + bx.toFixed(1) + ' ' + (by - 4) + ' L' + (bx + 0.8).toFixed(1) + ' ' + (by - 0.8) + ' L' + (bx + 4).toFixed(1) + ' ' + by + ' L' + (bx + 0.8).toFixed(1) + ' ' + (by + 0.8) + ' L' + bx.toFixed(1) + ' ' + (by + 4) + ' L' + (bx - 0.8).toFixed(1) + ' ' + (by + 0.8) + ' L' + (bx - 4).toFixed(1) + ' ' + by + ' L' + (bx - 0.8).toFixed(1) + ' ' + (by - 0.8) + 'Z" fill="#FFFFFF" opacity=".85"/>'; }
    B += st;
  }
  /* astro (centrado en 206,70) */
  var X = 206, Y = 70;
  B += '<circle cx="' + X + '" cy="' + Y + '" r="95" fill="' + u('glow') + '"/>';
  if (c.id === 1) {
    D += radial('moon', [[0, '#FFFBEA'], [0.7, '#F1E7C6'], [1, '#D8CBA0']], '0.35', '0.35', '0.8');
    D += '<mask id="' + p + 'cres"><rect width="320" height="200" fill="#fff"/><circle cx="' + (X + 17) + '" cy="' + (Y - 11) + '" r="31" fill="#000"/></mask>';
    A += '<g mask="url(#' + p + 'cres)"><circle cx="' + X + '" cy="' + Y + '" r="36" fill="' + u('moon') + '"/><circle cx="' + (X - 18) + '" cy="' + (Y + 8) + '" r="5" fill="#CDBF92" opacity=".7"/><circle cx="' + (X - 9) + '" cy="' + (Y + 22) + '" r="3.5" fill="#CDBF92" opacity=".6"/><circle cx="' + (X - 26) + '" cy="' + (Y - 6) + '" r="2.6" fill="#CDBF92" opacity=".6"/><circle cx="' + (X - 4) + '" cy="' + (Y + 30) + '" r="2" fill="#CDBF92" opacity=".5"/></g>';
    A += '<circle cx="' + X + '" cy="' + Y + '" r="46" fill="none" stroke="#F6EFD6" stroke-opacity=".12" stroke-width="6"/>';
  } else if (c.id === 2) {
    D += radial('mars', [[0, '#F7A57A'], [0.55, '#D9653A'], [1, '#8E2E16']], '0.35', '0.3', '0.85');
    A += '<circle cx="' + X + '" cy="' + Y + '" r="36" fill="' + u('mars') + '"/>';
    [[-12,-10,7],[10,8,9],[14,-14,4],[-16,14,5],[2,24,3.5],[-24,0,3]].forEach(function(k){ A += '<circle cx="' + (X + k[0]) + '" cy="' + (Y + k[1]) + '" r="' + k[2] + '" fill="#9C3A1C" opacity=".55"/><path d="M' + (X + k[0] - k[2]) + ' ' + (Y + k[1]) + ' a' + k[2] + ' ' + k[2] + ' 0 0 1 ' + (k[2] * 2) + ' 0" fill="none" stroke="#FFC7A6" stroke-width="1" opacity=".55"/>'; });
    A += '<path d="M' + (X - 30) + ' ' + (Y - 6) + ' q30 -10 60 4" fill="none" stroke="#F2B08A" stroke-width="2.5" opacity=".35"/>';
    A += '<circle cx="' + X + '" cy="' + Y + '" r="36" fill="' + u('shade') + '"/><circle cx="' + X + '" cy="' + Y + '" r="36" fill="' + u('hl') + '"/>';
    A += '<circle cx="' + (X + 60) + '" cy="' + (Y - 34) + '" r="5" fill="#E9A07C"/><circle cx="' + (X + 58) + '" cy="' + (Y - 36) + '" r="1.6" fill="#FFF" opacity=".5"/><circle cx="' + (X - 66) + '" cy="' + (Y - 22) + '" r="3" fill="#E9A07C" opacity=".9"/>';
  } else if (c.id === 3) {
    D += '<clipPath id="' + p + 'jc"><circle cx="' + X + '" cy="' + Y + '" r="38"/></clipPath>';
    A += '<g clip-path="url(#' + p + 'jc)"><rect x="' + (X - 40) + '" y="' + (Y - 40) + '" width="80" height="80" fill="#EBC795"/>';
    [[-30,6,'#C98B4E'],[-20,4,'#F6DDB6'],[-12,7,'#B2723A'],[-2,3,'#F3D3A2'],[4,8,'#C27F43'],[14,4,'#F6DDB6'],[20,7,'#A9652F'],[30,5,'#E2B57E']].forEach(function(b){ A += '<path d="M' + (X - 40) + ' ' + (Y + b[0]) + ' q20 -3 40 0 t40 0 v' + b[1] + ' q-20 3 -40 0 t-40 0z" fill="' + b[2] + '"/>'; });
    A += '<ellipse cx="' + (X + 14) + '" cy="' + (Y + 14) + '" rx="10" ry="5.5" fill="#B5432A"/><ellipse cx="' + (X + 14) + '" cy="' + (Y + 14) + '" rx="10" ry="5.5" fill="none" stroke="#F3D3A2" stroke-width="1.2"/>';
    A += '<circle cx="' + X + '" cy="' + Y + '" r="38" fill="' + u('shade') + '"/><circle cx="' + X + '" cy="' + Y + '" r="38" fill="' + u('hl') + '"/></g>';
    A += '<circle cx="' + (X - 58) + '" cy="' + (Y + 6) + '" r="2.6" fill="#FBE6C4"/><circle cx="' + (X + 62) + '" cy="' + (Y - 14) + '" r="2" fill="#FBE6C4"/><circle cx="' + (X + 70) + '" cy="' + (Y + 10) + '" r="1.6" fill="#FBE6C4"/>';
  } else if (c.id === 4) {
    D += radial('sea', [[0, '#5FB3EE'], [0.6, '#2378C2'], [1, '#13467F']], '0.35', '0.3', '0.85');
    D += '<clipPath id="' + p + 'ec"><circle cx="' + X + '" cy="' + Y + '" r="37"/></clipPath>';
    A += '<circle cx="' + X + '" cy="' + Y + '" r="42" fill="#BFE6FF" opacity=".35"/>';
    A += '<g clip-path="url(#' + p + 'ec)"><circle cx="' + X + '" cy="' + Y + '" r="37" fill="' + u('sea') + '"/>' +
      '<path d="M' + (X - 30) + ' ' + (Y - 18) + 'c8-8 22-8 26 0s-4 12 2 18-2 18-12 16-6-12-14-14-12-12-2-20z" fill="#5DAE5F"/>' +
      '<path d="M' + (X + 4) + ' ' + (Y - 26) + 'c10-4 24 2 26 12s-8 8-10 16 6 16-4 20-14-8-12-18-12-26 0-30z" fill="#6DBA62"/>' +
      '<path d="M' + (X - 8) + ' ' + (Y + 18) + 'c6-2 12 0 12 6s-8 6-12 4-4-8 0-10z" fill="#5DAE5F"/>' +
      '<path d="M' + (X - 36) + ' ' + (Y + 4) + ' q20 -8 42 0 t36 -4" fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M' + (X - 20) + ' ' + (Y - 30) + ' q14 -5 30 0" fill="none" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".75"/>' +
      '<path d="M' + (X - 4) + ' ' + (Y + 28) + ' q16 -4 30 2" fill="none" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
      '<circle cx="' + X + '" cy="' + Y + '" r="37" fill="' + u('shade') + '"/><circle cx="' + X + '" cy="' + Y + '" r="37" fill="' + u('hl') + '"/></g>';
    F += '<g fill="#FFFFFF"><ellipse cx="70" cy="44" rx="26" ry="8" opacity=".95"/><ellipse cx="86" cy="37" rx="15" ry="10" opacity=".95"/><ellipse cx="58" cy="40" rx="10" ry="7" opacity=".95"/><ellipse cx="282" cy="30" rx="18" ry="5" opacity=".8"/><ellipse cx="292" cy="26" rx="9" ry="6" opacity=".8"/></g>';
  } else if (c.id === 5) {
    D += radial('sun', [[0, '#FFFFFF'], [0.45, '#FFF6CF'], [0.8, '#FFD866'], [1, '#F7B731']]);
    var rays = '';
    for (var q = 0; q < 18; q++) { var a = q * Math.PI / 9, a1 = a - 0.07, a2 = a + 0.07, R1 = 40, R2 = q % 2 ? 64 : 78;
      rays += '<path d="M' + (X + Math.cos(a1) * R1).toFixed(1) + ' ' + (Y + Math.sin(a1) * R1).toFixed(1) + ' L' + (X + Math.cos(a) * R2).toFixed(1) + ' ' + (Y + Math.sin(a) * R2).toFixed(1) + ' L' + (X + Math.cos(a2) * R1).toFixed(1) + ' ' + (Y + Math.sin(a2) * R1).toFixed(1) + 'Z" fill="#FFF3C4" opacity="' + (q % 2 ? 0.55 : 0.8) + '"/>'; }
    A += '<g opacity=".25">' + [0, 1, 2].map(function(k){ return '<path d="M' + X + ' ' + Y + ' L' + (X - 220 + k * 70) + ' 200 L' + (X - 180 + k * 70) + ' 200Z" fill="#FFF8DC"/>'; }).join('') + '</g>';
    A += rays + '<circle cx="' + X + '" cy="' + Y + '" r="40" fill="#FFE07A" opacity=".45"/><circle cx="' + X + '" cy="' + Y + '" r="33" fill="' + u('sun') + '"/>';
    F += '<g fill="none" stroke="#6B4308" stroke-width="1.6" stroke-linecap="round"><path d="M60 46 q5 -5 10 0 q5 -5 10 0"/><path d="M84 60 q4 -4 8 0 q4 -4 8 0"/><path d="M46 66 q3 -3 6 0 q3 -3 6 0"/></g>';
  } else if (c.id === 6) {
    D += radial('sat', [[0, '#F5E6FB'], [0.6, '#D6B8EC'], [1, '#8C6BB8']], '0.35', '0.3', '0.85');
    D += '<clipPath id="' + p + 'sc"><circle cx="' + X + '" cy="' + Y + '" r="30"/></clipPath>';
    var ring = function(front){ return '<g transform="rotate(-18 ' + X + ' ' + Y + ')">' + [[74, 17, '#CBB0E8', 5], [66, 15, '#E8D8F6', 3], [58, 13, '#B897DD', 3]].map(function(rg){ return '<path d="M' + (X - rg[0]) + ' ' + Y + ' a' + rg[0] + ' ' + rg[1] + ' 0 0 ' + (front ? 0 : 1) + ' ' + (rg[0] * 2) + ' 0" fill="none" stroke="' + rg[2] + '" stroke-width="' + rg[3] + '"/>'; }).join('') + '</g>'; };
    A += ring(false) + '<g clip-path="url(#' + p + 'sc)"><circle cx="' + X + '" cy="' + Y + '" r="30" fill="' + u('sat') + '"/><path d="M' + (X - 32) + ' ' + (Y - 8) + ' h64" stroke="#E9D6F7" stroke-width="5"/><path d="M' + (X - 32) + ' ' + (Y + 4) + ' h64" stroke="#B994DA" stroke-width="4"/><path d="M' + (X - 32) + ' ' + (Y + 14) + ' h64" stroke="#C9A9E6" stroke-width="3"/><circle cx="' + X + '" cy="' + Y + '" r="30" fill="' + u('shade') + '"/><circle cx="' + X + '" cy="' + Y + '" r="30" fill="' + u('hl') + '"/></g>' + ring(true);
  } else if (c.id === 7) {
    D += radial('star', [[0, '#FFFFFF'], [0.3, '#FFFFFF', 0.9], [1, '#FFFFFF', 0]]);
    D += radial('ant', [[0, '#FFE4DC'], [0.3, '#FF6F5A'], [1, '#FF6F5A', 0]]);
    D += linear('milky', [[0, '#FFFFFF', 0], [0.5, '#F4C9E3', 0.22], [1, '#FFFFFF', 0]], 1, 1);
    B += '<path d="M-20 150 Q120 40 340 10 L340 50 Q140 80 -20 190Z" fill="' + u('milky') + '"/>';
    var Q = [[128,36],[146,46],[164,58],[184,66],[206,70],[228,80],[244,96],[252,116],[242,132],[226,130]];
    A += '<path d="M' + Q.map(function(k){ return k.join(' '); }).join(' L') + '" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-opacity=".55" stroke-dasharray="3 3"/><path d="M146 46 L136 20 M146 46 L164 24" stroke="#FFFFFF" stroke-width="1.2" stroke-opacity=".55" stroke-dasharray="3 3"/>';
    Q.concat([[136,20],[164,24]]).forEach(function(k, i){ if (i === 4) return; A += '<circle cx="' + k[0] + '" cy="' + k[1] + '" r="7" fill="' + u('star') + '" opacity=".6"/><circle cx="' + k[0] + '" cy="' + k[1] + '" r="2.2" fill="#FFFFFF"/>'; });
    A += '<circle cx="206" cy="70" r="22" fill="' + u('ant') + '"/><circle cx="206" cy="70" r="5.5" fill="#FFD2C6"/><path d="M206 52 V88 M188 70 H224" stroke="#FFD2C6" stroke-width="1" opacity=".7"/>';
  } else {
    D += linear('tail', [[0, '#FFF8D6', 0], [1, '#FFF8D6', 0.85]], 1, 0.4);
    A += '<path d="M60 22 L' + (X - 24) + ' ' + (Y - 16) + ' L' + (X - 18) + ' ' + (Y + 4) + ' Z" fill="' + u('tail') + '"/>';
    A += '<path d="M' + X + ' ' + (Y - 40) + ' l11.8 24 26.4 3.8 -19.1 18.6 4.5 26.3 -23.6 -12.4 -23.6 12.4 4.5 -26.3 -19.1 -18.6 26.4 -3.8z" fill="#FFF3B8" stroke="#E7C866" stroke-width="2" stroke-linejoin="round"/>';
    A += '<path d="M' + X + ' ' + (Y - 30) + ' l8 16 18 2.6" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".8"/>';
    A += '<text x="' + X + '" y="' + (Y + 16) + '" text-anchor="middle" font-family="Familjen Grotesk, Helvetica, Arial, sans-serif" font-weight="700" font-size="34" fill="#2F4615">0</text>';
    [[X + 52, Y - 30], [X - 60, Y + 30], [X + 64, Y + 22]].forEach(function(k){ A += '<path d="M' + k[0] + ' ' + (k[1] - 5) + ' L' + (k[0] + 1.2) + ' ' + (k[1] - 1.2) + ' L' + (k[0] + 5) + ' ' + k[1] + ' L' + (k[0] + 1.2) + ' ' + (k[1] + 1.2) + ' L' + k[0] + ' ' + (k[1] + 5) + ' L' + (k[0] - 1.2) + ' ' + (k[1] + 1.2) + ' L' + (k[0] - 5) + ' ' + k[1] + ' L' + (k[0] - 1.2) + ' ' + (k[1] - 1.2) + 'Z" fill="#FFF8D6"/>'; });
  }
  /* cerros: tres capas con luz en las crestas */
  var far = 'M0 128 L22 116 L40 122 L64 100 L88 112 L110 96 L136 114 L160 104 L182 116 L210 98 L236 112 L262 102 L290 116 L320 106 L320 200 L0 200Z';
  var mid = 'M0 146 C24 136 40 128 62 132 C86 136 100 122 124 124 C150 126 166 140 192 136 C220 132 238 120 262 124 C286 128 302 138 320 134 L320 200 L0 200Z';
  var near = 'M0 166 C40 154 76 160 112 156 C150 152 186 162 224 158 C262 154 292 160 320 156 L320 200 L0 200Z';
  F += '<path d="' + far + '" fill="' + T.m[0] + '"/><path d="M64 100 L88 112 M110 96 L136 114 M210 98 L236 112" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="2"/>';
  F += '<rect x="0" y="100" width="320" height="40" fill="' + T.s[2] + '" opacity=".12"/>';
  F += '<path d="' + mid + '" fill="' + T.m[1] + '"/>';
  var tr = rnd(c.id * 31 + 7), trees = '', RP = [[0,146],[62,132],[124,124],[192,136],[262,124],[320,134]];
  var ry = function(xx){ for (var z = 1; z < RP.length; z++) if (xx <= RP[z][0]) { var a0 = RP[z - 1], a1 = RP[z]; return a0[1] + (a1[1] - a0[1]) * (xx - a0[0]) / (a1[0] - a0[0]); } return 134; };
  for (var tx = -4; tx < 326; tx += 5 + tr() * 4) { var rr2 = 3.5 + tr() * 3.5; trees += '<circle cx="' + tx.toFixed(1) + '" cy="' + (ry(tx) + 3 - rr2 * 0.3).toFixed(1) + '" r="' + rr2.toFixed(1) + '" fill="' + T.tree + '"/>'; }
  for (var tx2 = 150; tx2 < 326; tx2 += 9 + tr() * 8) { var r3 = 2 + tr() * 2; trees += '<circle cx="' + tx2.toFixed(1) + '" cy="' + (ry(tx2) + 1 - r3).toFixed(1) + '" r="' + r3.toFixed(1) + '" fill="#FFFFFF" opacity=".07"/>'; }
  F += trees + '<path d="' + near + '" fill="' + T.m[2] + '"/>';
  F += '<path d="M0 188 C80 180 160 186 320 180 L320 200 L0 200Z" fill="' + T.g + '"/>';
  /* cabaña */
  var lit = '#FFD36B', wall = '#C9714A', wallD = '#A9583A', roof = '#C4552C', roofD = '#8E3A1C', stone = '#C9BFAE', stoneD = '#9C917F', wood = '#7A4A26';
  var k = '<g transform="translate(36 120)">';
  k += '<ellipse cx="40" cy="58" rx="52" ry="5" fill="#000" opacity=".25"/>';
  if (T.noche) k += '<circle cx="22" cy="40" r="22" fill="' + lit + '" opacity=".16"/><circle cx="58" cy="44" r="16" fill="' + lit + '" opacity=".12"/>';
  if (T.noche) k += '<path d="M33 -8 q-6 -8 0 -14 q6 -6 0 -14" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>';
  k += '<rect x="4" y="30" width="44" height="26" fill="' + wall + '"/>';
  for (var b = 0; b < 6; b++) k += '<path d="M4 ' + (34 + b * 4) + ' H48" stroke="' + wallD + '" stroke-width=".7" opacity=".7"/>';
  k += '<path d="M2 32 L26 10 L50 32 Z" fill="' + wall + '"/>';
  k += '<path d="M-2 33 L26 6 L54 33" fill="none" stroke="' + roof + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/><path d="M-2 33 L26 6 L54 33" fill="none" stroke="' + roofD + '" stroke-width="1.2" stroke-linejoin="round" opacity=".8" transform="translate(0 3)"/>';
  k += '<path d="M48 30 L78 30 L84 40 L48 40 Z" fill="' + roof + '"/><path d="M48 40 H84" stroke="' + roofD + '" stroke-width="1.4"/>';
  k += '<rect x="48" y="40" width="30" height="16" fill="' + wallD + '"/><rect x="76" y="40" width="3" height="16" fill="' + wood + '"/><rect x="62" y="40" width="2.4" height="16" fill="' + wood + '" opacity=".8"/>';
  k += '<rect x="52" y="44" width="7" height="12" fill="' + wood + '"/><circle cx="57.5" cy="50.5" r=".7" fill="#E8C27A"/>';
  k += '<rect x="66" y="44" width="8" height="6" fill="' + lit + '"/><path d="M70 44 v6 M66 47 h8" stroke="' + wood + '" stroke-width=".8"/>';
  k += '<rect x="28" y="2" width="9" height="54" fill="' + stone + '"/>';
  for (var s2 = 0; s2 < 9; s2++) k += '<ellipse cx="' + (30.5 + (s2 % 2) * 4) + '" cy="' + (6 + s2 * 5.6) + '" rx="2.2" ry="1.7" fill="' + stoneD + '" opacity=".7"/>';
  k += '<rect x="27" y="0" width="11" height="3" fill="' + stoneD + '"/>';
  k += '<rect x="9" y="36" width="12" height="10" fill="' + lit + '"/><path d="M15 36 v10 M9 41 h12" stroke="' + wood + '" stroke-width="1"/><rect x="8.5" y="35.5" width="13" height="11" fill="none" stroke="' + wood + '" stroke-width="1.2"/>';
  k += '<rect x="20" y="18" width="7" height="7" fill="' + lit + '" opacity=".9"/><path d="M23.5 18 v7 M20 21.5 h7" stroke="' + wood + '" stroke-width=".8"/>';
  var bush = T.noche ? '#1F3A2A' : '#4E8A3C', bushL = T.noche ? '#2C4E39' : '#6BAA4F';
  k += '<circle cx="-2" cy="54" r="7" fill="' + bush + '"/><circle cx="6" cy="55" r="5.5" fill="' + bushL + '"/><circle cx="86" cy="54" r="6" fill="' + bush + '"/><circle cx="92" cy="55" r="4.5" fill="' + bushL + '"/>';
  k += '</g>';
  F += k + '<rect width="320" height="200" fill="' + u('vig') + '"/>';
  return '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + D + '</defs>' + B + A + F + '</svg>';
}

function chipCab(id, txt){ var c = cabC(id); return '<span class="cb" style="background:' + c.col + ';color:' + c.fg + '">' + c.id + '</span>' + (txt ? '<span>' + txt + '</span>' : ''); }
var ST = {porconfirmar:'Por confirmar', sinpago:'Confirmada sin pago', sena:'Con seña', pagada:'Pagada', cancelada:'Cancelada'};
var MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var MC = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var DIA = ['D','L','M','M','J','V','S'];
var DIAL = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

var S = { pagos: [], hoja: null, conexion: 'cargando', errorConexion: '', ultimaSync: null, ocupado: false, curClave: null, res: [], precios: {}, edit: false, loaded: false,
  view: 'hoy', cal: null, filtro: 'proximas', q: '', cur: null, curSt: 'porconfirmar' };

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function slug(s){ return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'x'; }
function p2(n){ return (n < 10 ? '0' : '') + n; }
function hoy(){ var d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
function dn(s){ return Math.round(Date.parse(s + 'T00:00:00Z') / 86400000); }
function iso(n){ return new Date(n * 86400000).toISOString().slice(0, 10); }
function corto(s){ var p = s.split('-'); return parseInt(p[2], 10) + ' ' + MC[parseInt(p[1], 10) - 1]; }
function plata(n){ return '$' + (Number(n) || 0).toLocaleString('es-AR'); }
function cabN(id){ var c = CAB.filter(function(x){ return x.id === id; })[0]; return c ? (c.n ? 'Cabaña ' + c.id + ' · ' + c.n : 'Cabaña 0') : 'Cabaña ' + id; }
function precio(id){ var v = S.precios[id]; if (typeof v === 'number') return v; var c = CAB.filter(function(x){ return x.id === id; })[0]; return c ? c.p : 0; }
function cabC(id){ return CAB.filter(function(x){ return x.id === id; })[0] || {id:id,n:'',cap:'?',max:99,p:0,col:'#4D5E72',tint:'#E8EEF5',fg:'#FFFFFF'}; }
function noches(r){ return dn(r.to) - dn(r.from); }
function activas(){ return S.res.filter(function(r){ return r.estado !== 'cancelada'; }); }
function cruces(cab, from, to, salvo){ return activas().filter(function(r){ return r.cabin === cab && r.id !== salvo && r.from < to && r.to > from; }); }
function dispo(from, to, pers, salvo){ var ok = from && to && to > from; return CAB.map(function(c){ var busy = ok ? cruces(c.id, from, to, salvo).length > 0 : false; return { c: c, busy: busy, chica: pers > c.max, libre: ok && !busy && !(pers > c.max) }; }); }
function chipDisp(d, sel, accion){
  var c = d.c, nom = c.n || 'Cabaña 0';
  if (d.libre) return '<button type="button" class="dchip" ' + accion + '="' + c.id + '" aria-pressed="' + (sel === c.id) + '">' + chipCab(c.id) + nom + '<small>hasta ' + c.max + '</small></button>';
  return '<span class="dchip no">' + chipCab(c.id) + nom + '<small>' + (d.busy ? 'ocupada' : 'hasta ' + c.max + ' pers.') + '</small></span>';
}
function saldo(r){ return r.estado === 'pagada' ? 0 : Math.max((r.total || 0) - (r.sena || 0), 0); }
function toast(t){ var el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function(){ el.hidden = true; }, 3800); }
function banner(t, warn){ var b = $('banner'); if (!t) { b.hidden = true; return; } b.textContent = t; b.className = 'banner' + (warn ? ' warn' : ''); b.hidden = false; }

/* ---------- Conexión con Google Sheets (Apps Script) ---------- */
var CFG_KEY = 'cieloazul.config', CACHE_KEY = 'cieloazul.cache', CLAVE_KEY = 'cieloazul.clave';
function claveSesion(){ try { return sessionStorage.getItem(CLAVE_KEY) || localStorage.getItem(CLAVE_KEY) || ''; } catch (e) { return ''; } }
function guardarClave(v, recordar){ try { sessionStorage.setItem(CLAVE_KEY, v); if (recordar) localStorage.setItem(CLAVE_KEY, v); else localStorage.removeItem(CLAVE_KEY); } catch (e) {} }
function borrarClave(){ try { sessionStorage.removeItem(CLAVE_KEY); localStorage.removeItem(CLAVE_KEY); localStorage.removeItem(CACHE_KEY); } catch (e) {} }
function bloquear_pantalla(msg){
  document.body.classList.add('bloqueado'); S.res = []; S.pagos = []; S.recibos = []; S.loaded = false; S.edit = false;
  var e = $('gate-err'); if (msg) { e.textContent = msg; e.hidden = false; } else e.hidden = true;
  setTimeout(function(){ try { $('gate-pass').focus(); } catch (x) {} }, 50);
}
function cfg(){
  var base = window.CIELO_CONFIG || {}, loc = {};
  try { loc = JSON.parse(localStorage.getItem(CFG_KEY) || '{}') || {}; } catch (e) {}
  var c = {}; [base, loc].forEach(function(o){ for (var k in o) if (o[k] !== '' && o[k] != null) c[k] = o[k]; });
  return c;
}
function guardarCfg(c){ try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }
function idDeHoja(txt){ var m = String(txt || '').match(/\/d\/([a-zA-Z0-9_-]{20,})/); if (m) return m[1]; m = String(txt || '').trim().match(/^[a-zA-Z0-9_-]{20,}$/); return m ? m[0] : ''; }
function nuevaClave(){ try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {} return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }

async function api(accion, datos){
  var c = cfg();
  if (!c.endpoint) { var e0 = new Error('Falta configurar la conexión con Google Sheets (sección Excel vinculado).'); e0.code = 'config'; throw e0; }
  var body = Object.assign({ accion: accion, hoja: c.sheetId || '', token: claveSesion() }, datos || {});
  var ctrl = new AbortController(), t = setTimeout(function(){ ctrl.abort(); }, 45000);
  var r;
  try {
    // text/plain evita la verificación CORS previa; Apps Script responde JSON
    r = await fetch(c.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow', signal: ctrl.signal });
  } catch (err) {
    var e1 = new Error(err && err.name === 'AbortError' ? 'Google Sheets tardó demasiado en responder.' : 'No hay conexión con Google Sheets. Revisá internet o la URL del Apps Script.'); e1.code = 'red'; throw e1;
  } finally { clearTimeout(t); }
  var j = null;
  if (!r.ok) { var e4 = new Error('Google Sheets no respondió (error ' + r.status + '). Probá de nuevo en unos segundos.'); e4.code = 'http'; throw e4; }
  try { j = await r.json(); } catch (err) { var e2 = new Error('La URL configurada no respondió como el Apps Script del sistema. Revisá que sea la URL de la implementación (termina en /exec).'); e2.code = 'respuesta'; throw e2; }
  if (!j || !j.ok) {
    if (j && j.code === 'token' && accion !== 'ping') { borrarClave(); bloquear_pantalla('La sesión ya no es válida. Volvé a ingresar la contraseña.'); }
    var e3 = new Error((j && j.error) || 'Google Sheets rechazó la operación.'); e3.code = (j && j.code) || 'error'; throw e3;
  }
  return j;
}

function aplicar(d){
  S.res = (d.reservas || []).map(function(x){ if (!ST[x.estado]) x.estado = 'sinpago'; return x; });
  S.pagos = d.pagos || [];
  S.recibos = d.recibos || [];
  S.precios = {}; for (var k in (d.tarifas || {})) S.precios[+k] = +d.tarifas[k];
  S.hoja = d.hoja || null;
  S.ultimaSync = d.leido || new Date().toISOString();
  S.loaded = true;
  if (S.cur) { var nr = S.res.filter(function(x){ return x.id === S.cur.id; })[0]; S.cur = nr || S.cur; }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ datos: d, guardado: new Date().toISOString(), hoja: cfg().sheetId || '' })); } catch (e) {}
  render();
}

function estadoSync(tipo, texto, reintentar){
  var b = $('sync'), t = $('sync-t'), r = $('sync-r');
  b.className = 'sync ' + tipo; t.textContent = texto; b.hidden = false;
  r.hidden = !reintentar; r.onclick = reintentar || null;
  // dentro de los diálogos abiertos se muestra el mismo estado (la barra queda detrás del fondo oscuro)
  document.querySelectorAll('.sync-inline').forEach(function(x){
    x.className = 'sync-inline ' + tipo; x.hidden = tipo === 'ok';
    x.querySelector('.si-t').textContent = texto;
    var br = x.querySelector('.si-r'); br.hidden = !reintentar; br.onclick = reintentar || null;
  });
  clearTimeout(estadoSync._t);
  if (tipo === 'ok') estadoSync._t = setTimeout(function(){ b.hidden = true; }, 3500);
}
function bloquear(si){
  S.ocupado = si;
  document.querySelectorAll('[data-critico], #d-save, #rc-anotar, #rc-dl, #b-drive, #b-reconstruir, #cf-guardar').forEach(function(b){ if (si) { b.dataset.prev = b.disabled ? '1' : ''; b.disabled = true; } else { b.disabled = b.dataset.prev === '1'; delete b.dataset.prev; } });
}

// Toda escritura pasa por acá: muestra "Guardando…", bloquea botones y solo confirma si Google Sheets respondió bien.
async function escribir(accion, datos, msgOk){
  if (S.ocupado) throw new Error('ocupado');
  bloquear(true);
  estadoSync('saving', 'Guardando en Google Sheets…');
  try {
    var j = await api(accion, datos);
    if (j.datos) aplicar(j.datos);
    S.conexion = 'ok'; S.errorConexion = ''; S.edit = true;
    estadoSync('ok', 'Guardado correctamente');
    if (msgOk) toast(msgOk);
    return j.resultado || {};
  } catch (e) {
    S.errorConexion = e.message;
    estadoSync('err', 'Error al sincronizar: ' + e.message, function(){ escribir(accion, datos, msgOk).catch(function(){}); });
    throw e;
  } finally { bloquear(false); if (S.view === 'excel') renderExcel(); }
}

async function cargar(silencioso){
  if (!cfg().endpoint) { S.conexion = 'config'; S.edit = false; usarCache(); banner('Para empezar, conectá tu planilla en la sección Excel vinculado.', true); if (!silencioso && location.hash !== '#excel') location.hash = 'excel'; render(); return; }
  if (!silencioso) { S.conexion = 'cargando'; estadoSync('saving', 'Cargando datos de Google Sheets…'); }
  try {
    var j = await api('datos', {});
    aplicar(j.datos);
    S.conexion = 'ok'; S.errorConexion = ''; S.edit = true; banner('');
    if (!silencioso) estadoSync('ok', 'Datos actualizados desde Google Sheets');
  } catch (e) {
    S.errorConexion = e.message; S.edit = false;
    var hay = usarCache();
    S.conexion = hay ? 'cache' : 'error';
    banner(hay ? 'Sin conexión con Google Sheets. Estás viendo la última copia guardada; no se pueden hacer cambios hasta reconectar.' : 'No se pudieron cargar los datos de Google Sheets: ' + e.message, true);
    estadoSync('err', 'Error al conectar: ' + e.message, function(){ cargar(); });
  }
  render();
}
function usarCache(){
  try {
    var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (c && c.datos && !S.loaded) { aplicar(c.datos); S.ultimaSync = c.datos.leido; return true; }
    return !!(c && c.datos);
  } catch (e) { return false; }
}

function initConexion(){
  $('cf-form').addEventListener('submit', async function(e){
    e.preventDefault();
    var endpoint = $('cf-endpoint').value.trim(), hojaTxt = $('cf-hoja').value.trim();
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(endpoint)) { S.errorConexion = 'La URL del Apps Script tiene que empezar con https://script.google.com/…/exec'; renderExcel(); return; }
    var id = idDeHoja(hojaTxt);
    if (hojaTxt && !id) { S.errorConexion = 'No reconozco ese enlace de Google Sheets. Copiá el enlace completo de la hoja.'; renderExcel(); return; }
    var anterior = cfg();
    guardarCfg({ endpoint: endpoint, sheetId: id, sheetUrl: hojaTxt });
    bloquear(true); estadoSync('saving', 'Probando conexión…');
    try {
      var j = await api('ping', {});
      S.conexion = 'ok'; S.errorConexion = '';
      estadoSync('ok', 'Conectado a “' + j.hoja.titulo + '”');
      if (anterior.sheetId && id && anterior.sheetId !== id) { try { localStorage.removeItem(CACHE_KEY); } catch (x) {} S.loaded = false; }
      bloquear(false);
      await cargar();
    } catch (err) {
      S.conexion = 'error'; S.errorConexion = err.message;
      estadoSync('err', 'No se pudo conectar: ' + err.message, function(){ $('cf-form').requestSubmit(); });
      bloquear(false);
    }
    renderExcel();
  });
  $('b-salir').addEventListener('click', function(){ borrarClave(); location.hash = 'hoy'; bloquear_pantalla(''); render(); });
  $('gate-form').addEventListener('submit', async function(e){
    e.preventDefault();
    var v = $('gate-pass').value.trim(); if (!v) return;
    var btn = $('gate-btn'); btn.disabled = true; btn.textContent = 'Verificando…'; $('gate-err').hidden = true;
    guardarClave(v, $('gate-rem').checked);
    try {
      if (!cfg().endpoint) throw Object.assign(new Error('config'), { code: 'config' });
      await api('ping', {});
      document.body.classList.remove('bloqueado'); $('gate-pass').value = '';
      await cargar();
    } catch (err) {
      if (err.code === 'config') { document.body.classList.remove('bloqueado'); await cargar(); return; }
      borrarClave();
      $('gate-err').textContent = err.code === 'token' ? 'Contraseña incorrecta.' : 'No se pudo verificar con Google Sheets: ' + err.message; $('gate-err').hidden = false;
    } finally { btn.disabled = false; btn.textContent = 'Entrar'; }
  });
  $('b-drive').addEventListener('click', async function(){
    try { var r = await escribir('importar', {}, null); toast(r.agregadas ? 'Se agregaron ' + r.agregadas + ' reservas escritas a mano en la planilla.' : 'Todo al día: los datos vienen de la planilla.'); } catch (e) {}
  });
  $('b-reconstruir').addEventListener('click', async function(){
    try { var r = await escribir('reconstruir', {}, null); toast('Hojas mensuales reescritas: ' + ((r.meses || []).length) + ' meses.' + ((r.faltan || []).length ? ' Faltan pestañas para: ' + r.faltan.join(', ') : '')); } catch (e) {}
  });
}

/* ---------- Navegación ---------- */
function irA(v){
  if (['hoy','calendario','reservas','recibos','excel'].indexOf(v) < 0) v = 'hoy';
  S.view = v;
  ['hoy','calendario','reservas','recibos','excel'].forEach(function(k){ $('v-' + k).hidden = k !== v; });
  document.querySelectorAll('[data-v]').forEach(function(a){ if (a.getAttribute('data-v') === v) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  render();
}
window.addEventListener('hashchange', function(){ irA(location.hash.slice(1)); });

/* ---------- Render ---------- */
function render(){
  if (S.view === 'hoy') renderHoy();
  if (S.view === 'calendario') renderCal();
  if (S.view === 'reservas') renderLista();
  if (S.view === 'excel') renderExcel();
  if (S.view === 'recibos') renderRecibos();
}

function renderHoy(){
  var t = hoy(), tn = dn(t), act = activas();
  var d = new Date();
  $('hoy-fecha').textContent = DIAL[d.getDay()] + ' ' + d.getDate() + ' de ' + MES[d.getMonth()] + ' de ' + d.getFullYear();
  var ocup = act.filter(function(r){ return dn(r.from) <= tn && dn(r.to) > tn; });
  var entran = act.filter(function(r){ return r.from === t; });
  var salen = act.filter(function(r){ return r.to === t; });
  var fut = act.filter(function(r){ return dn(r.to) > tn; });
  var pend = fut.filter(function(r){ return r.estado === 'porconfirmar'; });
  var cobrar = fut.reduce(function(a, r){ return a + saldo(r); }, 0);
  $('kpis').innerHTML =
    kpi(ocup.length + '<small class="muted" style="font-size:16px"> / ' + CAB.length + '</small>', 'Ocupadas esta noche', 'calendario') +
    kpi(entran.length, 'Entran hoy', 'reservas') + kpi(salen.length, 'Salen hoy', 'reservas') +
    kpi(pend.length, 'Por confirmar', 'reservas:porconfirmar', pend.length > 0) +
    kpi('<span class="num" style="font-size:clamp(20px,2.2vw,26px)">' + plata(cobrar) + '</span>', 'Saldo a cobrar', 'reservas:saldo');
  // disponibilidad
  if (!$('c-in').value) { $('c-in').value = t; $('c-out').value = iso(tn + 2); }
  var ci = $('c-in').value, co = $('c-out').value, pers = parseInt($('c-p').value, 10);
  var ok = ci && co && co > ci;
  var libres = 0;
  var html = CAB.map(function(c){
    var busy = ok ? cruces(c.id, ci, co).length > 0 : false;
    var chica = pers > c.max;
    if (ok && !busy && !chica) libres++;
    var tag = !ok ? '' : busy ? '<span class="tag s-ocupada">Ocupada esas fechas</span>' : chica ? '<span class="tag s-chica">Hasta ' + c.max + ' pers.</span>' : '<span class="tag s-libre">Libre esas fechas</span>';
    var esta = act.filter(function(r){ return r.cabin === c.id && dn(r.from) <= tn && dn(r.to) > tn; })[0];
    var prox = act.filter(function(r){ return r.cabin === c.id && dn(r.from) > tn; }).sort(function(a,b){ return a.from < b.from ? -1 : 1; })[0];
    var now = esta ? '<span class="pill s-ocupada">Ocupada</span> <strong>' + esc(esta.huesped) + '</strong> hasta el ' + corto(esta.to)
      : '<span class="pill s-libre">Libre hoy</span>' + (prox ? ' · próxima: ' + corto(prox.from) : ' · sin reservas próximas');
    var strip = '';
    for (var k = 0; k < 14; k++) {
      var dd = tn + k, r = act.filter(function(x){ return x.cabin === c.id && dn(x.from) <= dd && dn(x.to) > dd; })[0];
      strip += '<i class="' + (r ? (r.estado === 'porconfirmar' ? 'p' : 'o') : '') + (k === 0 ? ' t' : '') + '" title="' + corto(iso(dd)) + (r ? ' · ' + esc(r.huesped) : ' · libre') + '">' + parseInt(iso(dd).slice(8), 10) + '</i>';
    }
    var ph = ilu(c);
    return '<article class="cab' + (ok && (busy || chica) ? ' dim' : '') + '">' +
      '<div class="ph" style="background:' + c.tint + ';border-bottom:6px solid ' + c.col + '">' + ph + '<span class="cn">' + chipCab(c.id) + esc(c.n || 'Cabaña 0') + '</span>' + tag + '</div>' +
      '<div class="cab-b"><div class="cab-t"><h3 class="cabh">' + chipCab(c.id, esc(c.n || 'Cabaña 0')) + '</h3><span class="cap"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c3 .2 5.5 2.3 5.5 5.8"/></svg>' + c.cap + ' pers.</span></div>' +
      '<div class="now">' + now + '</div>' +
      '<div><div class="strip">' + strip + '</div><div class="strip-l"><span>hoy</span><span>14 días</span></div></div>' +
      '<div class="tarifa"><span class="muted">' + (precio(c.id) ? 'Tarifa por noche: <b class="num" style="color:var(--ink)">' + plata(precio(c.id)) + '</b>' : 'Tarifa sin cargar') + '</span>' + (S.edit ? '<button type="button" class="btn sm" data-precio="' + c.id + '">Cambiar tarifa</button>' : '') + '</div>' +
      (S.edit ? '<div class="cab-a"><button class="btn sm pri" type="button" data-newcab="' + c.id + '">Anotar reserva</button></div>' : '') +
      '</div></article>';
  }).join('');
  $('cabins').innerHTML = S.loaded ? html : '<div class="empty">Cargando cabañas…</div>';
  var dsh = dispo(ci, co, pers), nn = ok ? dn(co) - dn(ci) : 0;
  var cr = $('chk-res');
  if (!ok) { cr.className = 'chk-res warn'; cr.innerHTML = '<b>Elegí la llegada y la salida</b><span>La salida tiene que ser después de la llegada.</span>'; $('chk-disp').innerHTML = ''; }
  else {
    cr.className = 'chk-res ' + (libres ? 'ok' : 'bad');
    cr.innerHTML = '<b>' + (libres ? libres + (libres === 1 ? ' cabaña libre' : ' cabañas libres') : 'Ninguna cabaña libre') + '</b><span>para ' + pers + (pers === 1 ? ' persona' : ' personas') + ' · ' + nn + (nn === 1 ? ' noche' : ' noches') + ' · ' + largo(ci) + ' → ' + largo(co) + '</span>';
    var ls = dsh.filter(function(d){ return d.libre; }), no = dsh.filter(function(d){ return !d.libre; });
    $('chk-disp').innerHTML = (ls.length ? '<div class="dcards">' + ls.map(function(d){ var c = d.c, pr = precio(c.id);
      return '<div class="dcard" style="--cc:' + c.col + ';--ct:' + c.tint + '"><div class="dc-top">' + chipCab(c.id) + '<b>' + esc(c.n || 'Cabaña 0') + '</b><span class="pill s-libre">Libre</span></div><div class="dc-mid"><span>Hasta ' + c.max + ' personas</span>' + (pr ? '<span><b class="num">' + plata(pr * nn) + '</b> total · ' + plata(pr) + ' x noche</span>' : '<span>Tarifa sin cargar</span>') + '</div>' + (S.edit ? '<button type="button" class="btn pri sm" data-hoydisp="' + c.id + '">Anotar reserva</button>' : '') + '</div>'; }).join('') + '</div>' : '') +
      (no.length ? '<p class="dno"><b>No disponibles:</b> ' + no.map(function(d){ return '<span>' + chipCab(d.c.id) + esc(d.c.n || 'Cabaña 0') + ' <em>' + (d.busy ? 'ocupada' : 'hasta ' + d.c.max + ' pers.') + '</em></span>'; }).join('') + '</p>' : '');
  }
  var nx = act.filter(function(r){ return dn(r.from) >= tn; }).sort(function(a,b){ return a.from < b.from ? -1 : a.from > b.from ? 1 : a.cabin - b.cabin; }).slice(0, 6);
  $('proximas').innerHTML = !S.loaded ? '<div class="empty">Cargando…</div>' : nx.length ? nx.map(fila).join('') : '<div class="empty">No hay llegadas próximas. Tocá “Nueva” para anotar una reserva.</div>';
}
function kpi(v, l, go, alert){ return '<button type="button" class="kpi' + (alert ? ' alert' : '') + '" data-go="' + go + '"><b>' + v + '</b><span>' + l + '</span></button>'; }

function fila(r){
  var p = r.from.split('-');
  var flag = r.fuente === 'app' ? '<span class="flag">Falta en Excel</span>' : r.editadaApp ? '<span class="flag">Editada aquí</span>' : '';
  return '<button type="button" class="row" data-id="' + esc(r.id) + '">' +
    '<span class="date" style="box-shadow:inset 0 -5px 0 ' + cabC(r.cabin).col + '"><b>' + parseInt(p[2], 10) + '</b><span>' + MC[parseInt(p[1], 10) - 1] + '</span></span>' +
    '<span class="who"><strong>' + esc(r.huesped) + '</strong><span class="cabl">' + chipCab(r.cabin) + esc(cabN(r.cabin)) + ' · ' + noches(r) + ' noche' + (noches(r) === 1 ? '' : 's') + ' · sale ' + corto(r.to) + (r.personas ? ' · ' + r.personas + ' pers.' : '') + '</span>' +
    (r.nota ? '<span>' + esc(r.nota) + '</span>' : '') + '</span>' +
    '<span class="rt"><span class="pill s-' + r.estado + '">' + ST[r.estado] + '</span><span class="num">' + (r.estado === 'cancelada' ? '' : saldo(r) ? 'Saldo ' + plata(saldo(r)) : r.total ? 'Pagado' : '') + '</span>' + flag + '</span>' +
    '</button>';
}

function renderCal(){
  if (!S.cal) { var d = new Date(); S.cal = { y: d.getFullYear(), m: d.getMonth() + 1 }; }
  var y = S.cal.y, m = S.cal.m, first = dn(y + '-' + p2(m) + '-01'), nd = new Date(Date.UTC(y, m, 0)).getUTCDate(), last = first + nd, tn = dn(hoy());
  $('m-lab').textContent = MES[m - 1] + ' ' + y;
  $('legend').innerHTML = ['porconfirmar','sinpago','sena','pagada'].map(function(k){ return '<span class="lg"><i class="s-' + k + '"></i>' + ST[k] + '</span>'; }).join('') + '<span class="lg"><i class="lg-libre"></i>Libre · tocá para anotar</span>';
  var act = activas();
  var ocupadas = 0, libresDia = [], porCab = {};
  CAB.forEach(function(c){ porCab[c.id] = 0; });
  for (var q = 0; q < nd; q++) {
    var dq = first + q, oc = 0;
    CAB.forEach(function(c){ if (act.some(function(r){ return r.cabin === c.id && dn(r.from) <= dq && dn(r.to) > dq; })) { oc++; porCab[c.id]++; } });
    ocupadas += oc; libresDia.push(CAB.length - oc);
  }
  var pct = Math.round(ocupadas * 100 / (nd * CAB.length));
  var enMes = act.filter(function(r){ return r.from < iso(last) && r.to > iso(first); });
  var llegan = act.filter(function(r){ return dn(r.from) >= first && dn(r.from) < last; }).length;
  var ingreso = enMes.reduce(function(a, r){ return a + (r.total || 0); }, 0);
  $('cal-sum').innerHTML =
    '<div class="cs"><b class="num">' + llegan + '</b><span>llegadas en el mes</span></div>' +
    '<div class="cs"><b class="num">' + ocupadas + '<small>/' + (nd * CAB.length) + '</small></b><span>noches ocupadas</span></div>' +
    '<div class="cs"><b class="num">' + pct + '%</b><span>ocupación</span><i class="meter"><i style="width:' + pct + '%"></i></i></div>' +
    '<div class="cs"><b class="num" style="font-size:22px">' + plata(ingreso) + '</b><span>total de las estadías del mes</span></div>';
  var COLW = 48, cal = $('cal');
  cal.style.gridTemplateColumns = '188px repeat(' + nd + ', ' + COLW + 'px)';
  var h = '<div class="lab corner"><span>Cabaña</span><small>' + MES[m - 1].slice(0, 3) + ' ' + y + '</small></div>';
  for (var i = 0; i < nd; i++) {
    var wd = new Date((first + i) * 86400000).getUTCDay();
    h += '<div class="dh' + (first + i === tn ? ' td' : '') + ((wd === 0 || wd === 6) ? ' we' : '') + (wd === 1 ? ' lun' : '') + '"><small>' + DIA[wd] + '</small><b>' + (i + 1) + '</b></div>';
  }
  h += '<div class="lab libres-l"><b>Libres por noche</b><span>de ' + CAB.length + ' cabañas</span></div>';
  libresDia.forEach(function(n, i){ var wd = new Date((first + i) * 86400000).getUTCDay(); var nivel = n === 0 ? 'full' : n <= 2 ? 'low' : ''; h += '<div class="fr ' + nivel + (wd === 1 ? ' lun' : '') + (first + i === tn ? ' tdc' : '') + '" title="' + n + ' cabañas libres el ' + corto(iso(first + i)) + '"><span>' + n + '</span></div>'; });
  CAB.forEach(function(c){
    h += '<div class="lab" style="--cc:' + c.col + ';--ct:' + c.tint + '"><b class="cabh">' + chipCab(c.id, esc(c.n || 'Cabaña 0')) + '</b><span>' + c.cap + ' pers. · <b class="num" style="font-size:12px">' + porCab[c.id] + '</b> noches</span></div>';
    var bk = act.filter(function(r){ return r.cabin === c.id && dn(r.from) < last && dn(r.to) > first; });
    var dd = 0;
    while (dd < nd) {
      var day = first + dd, hit = null;
      for (var j = 0; j < bk.length; j++) { if (Math.max(dn(bk[j].from), first) === day) { hit = bk[j]; break; } }
      var wdd = new Date(day * 86400000).getUTCDay();
      if (hit) {
        var span = Math.max(1, Math.min(dn(hit.to), last) - day), n = noches(hit);
        var antes = dn(hit.from) < first, despues = dn(hit.to) > last;
        var ini = (hit.huesped || '?').trim().charAt(0).toUpperCase();
        var det = n + (n === 1 ? ' noche' : ' noches') + ' · sale ' + corto(hit.to) + (saldo(hit) ? ' · saldo ' + plata(saldo(hit)) : '');
        h += '<button type="button" class="bar s-' + hit.estado + (span === 1 ? ' one' : '') + (antes ? ' cont-l' : '') + (despues ? ' cont-r' : '') + '" style="grid-column:span ' + span + ';--cc:' + c.col + '" data-id="' + esc(hit.id) + '" title="' + esc(hit.huesped + ' · ' + cabN(hit.cabin) + ' · llega ' + corto(hit.from) + ', sale ' + corto(hit.to) + ' · ' + ST[hit.estado]) + '">' +
          (antes ? '<span class="arr">‹</span>' : (span >= 2 ? '<span class="av">' + esc(ini) + '</span>' : '')) + '<span class="bt"><b>' + esc(span === 1 ? hit.huesped.split(' ')[0] : hit.huesped) + '</b>' + (span >= 3 ? '<small>' + esc(det) + '</small>' : '') + '</span>' + (despues ? '<span class="arr">›</span>' : '') + '</button>';
        dd += span;
      } else {
        h += '<button type="button" class="c' + (day === tn ? ' tc' : '') + ((wdd === 0 || wdd === 6) ? ' we' : '') + (wdd === 1 ? ' lun' : '') + '" data-cab="' + c.id + '" data-day="' + iso(day) + '" aria-label="' + esc(cabN(c.id)) + ', ' + corto(iso(day)) + ', libre"' + (S.edit ? '' : ' disabled') + '><span>+</span></button>';
        dd++;
      }
    }
  });
  cal.innerHTML = h;
  if (tn >= first && tn < last) { var w = $('calwrap'); w.scrollLeft = Math.max(0, (tn - first) * COLW - 40); }
}

var FILTROS = [['proximas','Próximas'],['porconfirmar','Por confirmar'],['saldo','Con saldo'],['sinpago','Sin pago'],['sena','Con seña'],['pagada','Pagadas'],['cancelada','Canceladas'],['todas','Todas']];
function renderLista(){
  var tn = dn(hoy()), q = S.q.trim().toLowerCase();
  var fut = function(r){ return dn(r.to) >= tn; };
  var tests = {
    proximas: function(r){ return fut(r) && r.estado !== 'cancelada'; },
    porconfirmar: function(r){ return fut(r) && r.estado === 'porconfirmar'; },
    saldo: function(r){ return fut(r) && r.estado !== 'cancelada' && saldo(r) > 0; },
    sinpago: function(r){ return fut(r) && r.estado === 'sinpago'; },
    sena: function(r){ return fut(r) && r.estado === 'sena'; },
    pagada: function(r){ return fut(r) && r.estado === 'pagada'; },
    cancelada: function(r){ return r.estado === 'cancelada'; },
    todas: function(){ return true; }
  };
  $('chips').innerHTML = FILTROS.map(function(f){ var n = S.res.filter(tests[f[0]]).length; return '<button type="button" class="chip" data-f="' + f[0] + '" aria-pressed="' + (S.filtro === f[0]) + '">' + f[1] + ' · ' + n + '</button>'; }).join('');
  var l = S.res.filter(tests[S.filtro]).filter(function(r){ return !q || (r.huesped + ' ' + (r.tel || '') + ' ' + (r.nota || '')).toLowerCase().indexOf(q) >= 0; });
  l.sort(S.filtro === 'todas' ? function(a,b){ return a.from > b.from ? -1 : 1; } : function(a,b){ return a.from < b.from ? -1 : a.from > b.from ? 1 : a.cabin - b.cabin; });
  $('lista').innerHTML = !S.loaded ? '<div class="empty">Cargando reservas…</div>' : l.length ? l.map(fila).join('') : '<div class="empty">No hay reservas en este filtro.</div>';
}

function renderExcel(){
  var c = cfg(), h = S.hoja;
  $('cf-endpoint').value = $('cf-endpoint').value || c.endpoint || '';
  $('cf-hoja').value = $('cf-hoja').value || c.sheetUrl || (c.sheetId ? 'https://docs.google.com/spreadsheets/d/' + c.sheetId + '/edit' : '');
  var est = S.conexion;
  var txtEst = est === 'ok' ? 'Conectado' : est === 'cache' ? 'Sin conexión · mostrando copia guardada' : est === 'config' ? 'Falta configurar' : est === 'cargando' ? 'Conectando…' : 'Error de conexión';
  $('cf-estado').textContent = txtEst;
  $('cf-estado').className = 'pill ' + (est === 'ok' ? 's-libre' : est === 'cargando' ? 's-sinpago' : 's-ocupada');
  $('cf-hoja-nombre').textContent = h ? h.titulo : '—';
  $('cf-hoja-id').textContent = h ? h.id : (c.sheetId || '—');
  $('cf-abrir').href = h ? h.url : (c.sheetId ? 'https://docs.google.com/spreadsheets/d/' + c.sheetId + '/edit' : '#');
  $('cf-sync').textContent = S.ultimaSync ? new Date(S.ultimaSync).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Nunca';
  $('cf-reservas').textContent = S.loaded ? S.res.length + ' reservas · ' + (S.pagos || []).length + ' pagos · ' + (S.recibos || []).length + ' recibos' : '—';
  $('cf-error').hidden = !S.errorConexion; $('cf-error').textContent = S.errorConexion || '';
  ['b-drive', 'b-reconstruir'].forEach(function(id){ $(id).disabled = !S.edit; });
}

/* ---------- Diálogo ---------- */
function opcionesCab(){ $('r-cab').innerHTML = CAB.map(function(c){ return '<option value="' + c.id + '">' + esc(cabN(c.id)) + ' (' + c.cap + ')</option>'; }).join(''); }
function abrir(r, pre){
  S.cur = r || null;
  var nuevo = !r; pre = pre || {};
  $('dlg-t').textContent = nuevo ? 'Nueva reserva' : r.huesped;
  var t = hoy();
  $('r-cab').value = String(r ? r.cabin : (pre.cabin != null ? pre.cabin : 1));
  $('r-in').value = r ? r.from : (pre.from || t);
  $('r-out').value = r ? r.to : (pre.to || iso(dn($('r-in').value) + 1));
  $('r-name').value = r ? r.huesped : ''; $('r-tel').value = r ? (r.tel || '') : '';
  $('r-pers').value = r && r.personas ? r.personas : (pre.pers || '');
  $('r-src').value = r && r.origen ? r.origen : 'WhatsApp';
  if ($('r-src').value === '') $('r-src').value = 'Otro';
  $('r-total').value = r && r.total ? r.total : ''; $('r-sena').value = r && r.sena ? r.sena : '';
  $('r-sena-l').textContent = r ? 'Pagado hasta hoy ($)' : 'Seña recibida ($)';
  $('f-medio').hidden = !!r;
  S.curClave = nuevaClave();
  $('r-nota').value = r ? (r.nota || '') : '';
  S.curSt = r ? (r.estado === 'cancelada' ? 'porconfirmar' : r.estado) : 'porconfirmar';
  var info = $('d-info');
  if (r) {
    info.hidden = false;
    var pg = (S.pagos || []).filter(function(p){ return p.reserva === r.id; }).sort(function(a, b){ return a.id < b.id ? -1 : 1; });
    info.innerHTML = '<div class="kv"><div><span>Reserva</span><b>' + esc(r.id) + '</b></div><div><span>Estado</span><b><span class="pill s-' + r.estado + '">' + ST[r.estado] + '</span></b></div><div><span>Noches</span><b>' + noches(r) + '</b></div><div><span>Pagado</span><b class="num">' + plata(r.sena) + '</b></div><div><span>Saldo</span><b class="num">' + plata(saldo(r)) + '</b></div></div>' +
      (r.tel ? '<p style="margin:10px 0 0">Teléfono: <b style="user-select:all">' + esc(r.tel) + '</b></p>' : '') +
      '<div style="margin-top:12px"><p class="eyebrow" style="margin:0 0 6px">Pagos registrados</p>' + (pg.length ? '<ul class="pagos">' + pg.map(function(p){ var act = p.estado === 'activo'; return '<li class="' + (act ? '' : 'anulado') + '"><span><b class="num">' + plata(p.monto) + '</b> · ' + esc(p.concepto) + ' · ' + esc(p.medio) + ' · ' + corto(p.fecha) + (p.recibo ? ' · ' + esc(p.recibo) : '') + (act ? '' : ' · ' + esc(p.estado)) + '</span>' + (act && S.edit ? '<button type="button" class="btn sm dan" data-anular="' + esc(p.id) + '" data-critico>Anular</button>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted" style="margin:0;font-size:14px">Sin pagos. Registrá señas y pagos desde el botón Recibo.</p>') + '</div>';
  } else info.hidden = true;
  var tel = (r && r.tel || '').replace(/\D/g, '');
  $('d-wa').hidden = !(r && tel.length >= 8);
  if (tel) $('d-wa').href = 'https://wa.me/' + tel;
  $('d-cancel').hidden = !(r && S.edit);
  $('d-rec').hidden = !r; $('d-bien').hidden = !r;
  $('d-del').hidden = !(r && S.edit);
  $('d-cancel').textContent = r && r.estado === 'cancelada' ? 'Reactivar' : 'Cancelar reserva';
  $('d-danger').hidden = true;
  var ro = !S.edit;
  ['r-cab','r-in','r-out','r-name','r-tel','r-pers','r-src','r-total','r-sena','r-nota','r-medio'].forEach(function(id){ $(id).disabled = ro; });
  $('r-sena').disabled = ro || !!r;
  document.querySelectorAll('#seg button').forEach(function(b){ b.disabled = ro; });
  $('d-save').hidden = ro;
  actualizarForm();
  document.querySelectorAll('.sync-inline').forEach(function(x){ x.hidden = true; });
  var dl = $('dlg');
  if (dl.showModal) { if (!dl.open) dl.showModal(); } else dl.setAttribute('open', '');
  if (nuevo && !ro) setTimeout(function(){ $('r-name').focus(); }, 50);
}
function cerrar(){ var dl = $('dlg'); if (dl.close) dl.close(); else dl.removeAttribute('open'); }
function actualizarForm(){
  document.querySelectorAll('#seg button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-st') === S.curSt)); });
  var cab = parseInt($('r-cab').value, 10), fi = $('r-in').value, fo = $('r-out').value, pers = parseInt($('r-pers').value, 10) || 0;
  $('r-cab-chip').innerHTML = chipCab(cab);
  var ds = dispo(fi, fo, pers, S.cur && S.cur.id);
  var libres = ds.filter(function(d){ return d.libre; });
  if (!S.cur && libres.length && !libres.some(function(d){ return d.c.id === cab; })) { $('r-cab').value = String(libres[0].c.id); return actualizarForm(); }
  $('r-disp').innerHTML = (fi && fo && fo > fi) ? (libres.length ? '' : '<span class="check bad" style="flex:1 1 100%">No hay cabañas libres para esas fechas' + (pers ? ' y ' + pers + ' personas' : '') + '.</span>') + libres.map(function(d){ return chipDisp(d, cab, 'data-pick'); }).join('') + ds.filter(function(d){ return !d.libre; }).map(function(d){ return chipDisp(d, cab, 'data-pick'); }).join('') : '<span class="muted">Elegí llegada y salida para ver qué cabañas están libres.</span>';
  Array.prototype.forEach.call($('r-cab').options, function(o){ var d = ds.filter(function(x){ return String(x.c.id) === o.value; })[0]; if (!d) return; var base = cabN(d.c.id) + ' (' + d.c.cap + ')'; o.textContent = base + (fi && fo && fo > fi ? (d.libre ? ' · libre' : d.busy ? ' · ocupada' : ' · no entran') : ''); });
  var ck = $('r-check');
  if (!fi || !fo || fo <= fi) { ck.textContent = 'La salida tiene que ser después de la llegada.'; ck.className = 'check bad'; }
  else {
    var cx = cruces(cab, fi, fo, S.cur && S.cur.id), n = dn(fo) - dn(fi), c = cabC(cab);
    if (cx.length) { ck.textContent = 'Se cruza con ' + cx[0].huesped + ' (' + corto(cx[0].from) + ' → ' + corto(cx[0].to) + ') en ' + cabN(cab) + '.'; ck.className = 'check bad'; }
    else if (pers > c.max) { ck.textContent = cabN(cab) + ' es para hasta ' + c.max + ' personas.'; ck.className = 'check bad'; }
    else { var pr = precio(cab); ck.textContent = 'Libre · ' + n + ' noche' + (n === 1 ? '' : 's') + (pr ? ' · según tarifa: ' + plata(pr * n) + ' (' + plata(pr) + ' x noche)' : ''); ck.className = 'check ok'; }
    $('r-total').placeholder = precio(cab) ? String(precio(cab) * n) : '0';
    $('b-usar').hidden = !(precio(cab) && S.edit); $('b-usar').textContent = 'Usar ' + plata(precio(cab) * n);
  }
  var tot = parseInt($('r-total').value, 10) || 0, se = parseInt($('r-sena').value, 10) || 0;
  $('r-saldo').textContent = plata(S.curSt === 'pagada' ? 0 : Math.max(tot - se, 0));
}
async function guardar(ev){
  ev.preventDefault();
  if (!S.edit) { toast('Sin conexión con Google Sheets: no se pueden guardar cambios ahora.'); return; }
  var cab = parseInt($('r-cab').value, 10), fi = $('r-in').value, fo = $('r-out').value, name = $('r-name').value.trim();
  if (!name) { toast('Falta el nombre del huésped.'); $('r-name').focus(); return; }
  if (!fi || !fo || fo <= fi) { toast('Revisá las fechas: la salida tiene que ser después de la llegada.'); return; }
  var cx = cruces(cab, fi, fo, S.cur && S.cur.id);
  if (cx.length) { toast('No se guardó: ' + cabN(cab) + ' ya está ocupada por ' + cx[0].huesped + '.'); return; }
  var tot = parseInt($('r-total').value, 10) || 0, se = parseInt($('r-sena').value, 10) || 0;
  var est = S.curSt; if (est === 'sinpago' && se > 0 && !S.cur) est = 'sena';
  var d = { cabin: cab, huesped: name, tel: $('r-tel').value.trim(), personas: parseInt($('r-pers').value, 10) || 0, from: fi, to: fo,
    origen: $('r-src').value, estado: est, total: tot, nota: $('r-nota').value.trim() };
  try {
    if (S.cur) {
      d.fecha = hoy();
      await escribir('actualizarReserva', { id: S.cur.id, cambios: d }, 'Reserva de ' + name + ' actualizada en la planilla.');
    } else {
      d.sena = se; d.medio = $('r-medio').value; d.fechaSena = hoy();
      await escribir('crearReserva', { clave: S.curClave, reserva: d }, 'Reserva anotada en la planilla: ' + name + ' en ' + cabN(cab) + ', ' + corto(fi) + ' → ' + corto(fo) + '.');
    }
    cerrar();
  } catch (e) { /* el error ya se muestra en la barra de sincronización */ }
}
function pedirCancelar(){
  var r = S.cur; if (!r) return;
  var box = $('d-danger');
  if (r.estado === 'cancelada') { cambiarEstado(r, 'porconfirmar', 'Reserva reactivada como “Por confirmar”.'); return; }
  box.hidden = false;
  box.innerHTML = '<span class="check bad" style="flex:1 1 220px">¿Cancelar la reserva de ' + esc(r.huesped) + '? Queda registrada como cancelada y las noches quedan libres.</span>' +
    '<button type="button" class="btn dan solid" id="ok-cancel" data-critico>Sí, cancelar</button><button type="button" class="btn" id="no-cancel">No</button>';
  $('ok-cancel').onclick = function(){ cambiarEstado(r, 'cancelada', 'Reserva de ' + r.huesped + ' cancelada en la planilla.'); };
  $('no-cancel').onclick = function(){ box.hidden = true; };
}
async function cambiarEstado(r, est, msg){
  try {
    if (est === 'cancelada') await escribir('cancelarReserva', { id: r.id }, msg);
    else await escribir('actualizarReserva', { id: r.id, cambios: { estado: est, fecha: hoy() } }, msg);
    cerrar();
  } catch (e) {}
}
async function anularPago(idPago){
  try { await escribir('anularPago', { id: idPago }, 'Pago anulado. El saldo se recalculó en la planilla.'); if (S.cur) { var nr = S.res.filter(function(x){ return x.id === S.cur.id; })[0]; if (nr) abrir(nr); } } catch (e) {}
}

/* ---------- Tarifas ---------- */
var precioCab = null;
function abrirPrecio(id){
  precioCab = id; $('dlgp-t').textContent = 'Tarifa · ' + cabN(id);
  $('p-val').value = precio(id) || '';
  var d = $('dlgp'); if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  setTimeout(function(){ $('p-val').focus(); $('p-val').select(); }, 50);
}
function cerrarPrecio(){ var d = $('dlgp'); if (d.close) d.close(); else d.removeAttribute('open'); }
$('dlgp-form').addEventListener('submit', async function(e){
  e.preventDefault();
  var v = parseInt($('p-val').value, 10);
  if (!(v >= 0)) { toast('Escribí un precio válido.'); return; }
  try { await escribir('guardarTarifa', { cabin: precioCab, precio: v }, 'Tarifa de ' + cabN(precioCab) + ': ' + plata(v) + ' por noche, guardada en la planilla.'); cerrarPrecio(); }
  catch (er) {}
});
$('dlgp-x').addEventListener('click', cerrarPrecio); $('dlgp-c').addEventListener('click', cerrarPrecio);

/* ---------- Eliminar ---------- */
function pedirEliminar(){
  var r = S.cur; if (!r || !S.edit) return;
  var box = $('d-danger'); box.hidden = false;
  box.innerHTML = '<span class="check bad" style="flex:1 1 240px">¿Eliminar para siempre la reserva de ' + esc(r.huesped) + ' (' + esc(cabN(r.cabin)) + ', ' + corto(r.from) + ' → ' + corto(r.to) + ')? Las noches quedan libres y no se puede deshacer.</span>' +
    '<button type="button" class="btn dan solid" id="ok-del" data-critico>Sí, eliminar</button><button type="button" class="btn" id="no-del">No</button>';
  $('ok-del').onclick = async function(){
    try {
      await escribir('eliminarReserva', { id: r.id }, 'Reserva de ' + r.huesped + ' eliminada de la planilla. ' + cabN(r.cabin) + ' quedó libre esas noches.');
      cerrar();
    } catch (e) {}
  };
  $('no-del').onclick = function(){ box.hidden = true; };
}

/* ---------- Eventos ---------- */
document.addEventListener('click', function(e){
  var an = e.target.closest('[data-anular]'); if (an) { anularPago(an.getAttribute('data-anular')); return; }
  var t = e.target.closest('[data-pick],[data-hoydisp],[data-precio],[data-new],[data-newcab],[data-id],[data-cab],[data-go],[data-f],[data-st]');
  if (!t) return;
  if (t.hasAttribute('data-pick')) { $('r-cab').value = t.getAttribute('data-pick'); actualizarForm(); return; }
  if (t.hasAttribute('data-hoydisp')) { abrir(null, { cabin: +t.getAttribute('data-hoydisp'), from: $('c-in').value, to: $('c-out').value, pers: parseInt($('c-p').value, 10) }); return; }
  if (t.hasAttribute('data-precio')) { abrirPrecio(+t.getAttribute('data-precio')); return; }
  if (t.hasAttribute('data-new')) { if (!S.edit) { toast('Sin conexión con Google Sheets: no se pueden anotar reservas ahora.'); return; } abrir(null); return; }
  if (t.hasAttribute('data-newcab')) { var ci = $('c-in').value, co = $('c-out').value; abrir(null, { cabin: +t.getAttribute('data-newcab'), from: ci, to: co > ci ? co : '', pers: parseInt($('c-p').value, 10) }); return; }
  if (t.hasAttribute('data-st')) { S.curSt = t.getAttribute('data-st'); actualizarForm(); return; }
  if (t.hasAttribute('data-id')) { var r = S.res.filter(function(x){ return x.id === t.getAttribute('data-id'); })[0]; if (r) abrir(r); return; }
  if (t.hasAttribute('data-cab')) { if (!S.edit) return; var dd = t.getAttribute('data-day'); abrir(null, { cabin: +t.getAttribute('data-cab'), from: dd, to: iso(dn(dd) + 1) }); return; }
  if (t.hasAttribute('data-f')) { S.filtro = t.getAttribute('data-f'); renderLista(); return; }
  if (t.hasAttribute('data-go')) { var g = t.getAttribute('data-go').split(':'); if (g[1]) S.filtro = g[1]; location.hash = g[0]; if (location.hash.slice(1) === g[0]) irA(g[0]); }
});
['c-in','c-out','c-p'].forEach(function(id){ $(id).addEventListener('input', renderHoy); });
document.querySelectorAll('[data-quick]').forEach(function(b){ b.addEventListener('click', function(){
  var t = dn(hoy()), q = b.getAttribute('data-quick');
  if (q === 'finde') { var wd = new Date(t * 86400000).getUTCDay(), hastaViernes = (5 - wd + 7) % 7; var v = t + hastaViernes; $('c-in').value = iso(v); $('c-out').value = iso(v + 2); }
  else { var a = $('c-in').value ? dn($('c-in').value) : t; $('c-in').value = iso(a); $('c-out').value = iso(a + 7); }
  renderHoy();
}); });
$('chk').addEventListener('submit', function(e){ e.preventDefault(); });
document.querySelectorAll('input[type=date]').forEach(function(inp){ inp.addEventListener('click', function(){ try { if (inp.showPicker && !inp.disabled) inp.showPicker(); } catch (e) {} }); });
$('q').addEventListener('input', function(){ S.q = this.value; renderLista(); });
['r-cab','r-in','r-out','r-pers','r-total','r-sena'].forEach(function(id){ $(id).addEventListener('input', function(){
  if (id === 'r-in' && $('r-out').value <= $('r-in').value && $('r-in').value) $('r-out').value = iso(dn($('r-in').value) + 1);
  actualizarForm(); }); });
$('dlg-form').addEventListener('submit', guardar);
$('b-usar').addEventListener('click', function(){ var n = dn($('r-out').value) - dn($('r-in').value); var pr = precio(parseInt($('r-cab').value, 10)); if (n > 0 && pr) { $('r-total').value = pr * n; actualizarForm(); } });
$('dlg-x').addEventListener('click', cerrar); $('d-close').addEventListener('click', cerrar);
$('d-cancel').addEventListener('click', pedirCancelar);
$('d-del').addEventListener('click', pedirEliminar);
$('d-rec').addEventListener('click', function(){ if (!S.cur) return; RC.id = S.cur.id; RC.tab = 'recibo'; RC._ultimo = null; cerrar(); location.hash = 'recibos'; if (S.view === 'recibos') renderRecibos(); });
$('d-bien').addEventListener('click', function(){ if (!S.cur) return; RC.id = S.cur.id; RC.tab = 'bien'; cerrar(); location.hash = 'recibos'; if (S.view === 'recibos') renderRecibos(); });
$('m-prev').addEventListener('click', function(){ S.cal.m--; if (S.cal.m < 1) { S.cal.m = 12; S.cal.y--; } renderCal(); });
$('m-next').addEventListener('click', function(){ S.cal.m++; if (S.cal.m > 12) { S.cal.m = 1; S.cal.y++; } renderCal(); });
$('m-hoy').addEventListener('click', function(){ S.cal = null; renderCal(); });
$('cal-l').addEventListener('click', function(){ $('calwrap').scrollBy({ left: -7 * 48, behavior: 'smooth' }); });
$('cal-r').addEventListener('click', function(){ $('calwrap').scrollBy({ left: 7 * 48, behavior: 'smooth' }); });


/* ---------- Recibos y mensaje de llegada ---------- */
var WIFI_PASS = 'cieloazul1';
var RC = { tab: 'recibo', id: null };
var DIAC = ['dom','lun','mar','mié','jue','vie','sáb'];
function largo(s){ var d = new Date(s + 'T12:00:00'); return DIAL[d.getDay()] + ' ' + d.getDate() + ' de ' + MES[d.getMonth()]; }
function medio(s){ var d = new Date(s + 'T12:00:00'); return DIAC[d.getDay()] + ' ' + d.getDate() + ' ' + MC[d.getMonth()]; }
function nombreCorto(n){ return String(n || '').split(' ')[0]; }
function rcReserva(){ return S.res.filter(function(r){ return r.id === RC.id; })[0] || null; }
function rcOpciones(){
  var tn = dn(hoy()), q = ($('rc-q').value || '').trim().toLowerCase();
  var l = S.res.filter(function(r){ return r.estado !== 'cancelada'; })
    .filter(function(r){ return !q || (r.huesped + ' ' + cabN(r.cabin)).toLowerCase().indexOf(q) >= 0; })
    .sort(function(a, b){ var fa = dn(a.to) >= tn, fb = dn(b.to) >= tn; if (fa !== fb) return fa ? -1 : 1; return fa ? (a.from < b.from ? -1 : 1) : (a.from > b.from ? -1 : 1); });
  if (RC.id && !l.some(function(r){ return r.id === RC.id; })) { var cur = rcReserva(); if (cur) l.unshift(cur); }
  if (!RC.id && l.length) RC.id = l[0].id;
  $('rc-res').innerHTML = l.length ? l.map(function(r){ return '<option value="' + esc(r.id) + '"' + (r.id === RC.id ? ' selected' : '') + '>' + corto(r.from) + ' → ' + corto(r.to) + ' · ' + esc(r.huesped) + ' · ' + esc(cabN(r.cabin)) + (dn(r.to) < tn ? ' (pasada)' : '') + '</option>'; }).join('') : '<option value="">No hay reservas con ese nombre</option>';
}
function rcCalc(){
  var r = rcReserva(); if (!r) return null;
  var monto = parseInt($('rc-monto').value, 10) || 0, conc = $('rc-conc').value;
  var previo = r.sena || 0;
  if (RC.modo === 'existente') previo = Math.max(previo - monto, 0);
  var total = r.total || 0, pagado = previo + monto, saldoR = Math.max(total - pagado, 0);
  return { r: r, monto: monto, conc: conc, previo: previo, total: total, pagado: pagado, saldo: saldoR, medio: $('rc-medio').value, fecha: $('rc-fecha').value || hoy(), de: $('rc-de').value.trim() || r.huesped, nota: $('rc-nota').value.trim(), nro: rcNumero() };
}
function rcNumero(){ if (RC.nro) return RC.nro; var mx = 0; (S.recibos || []).forEach(function(x){ var m = String(x.nro).match(/(\d+)$/); if (m) mx = Math.max(mx, +m[1]); }); return 'REC-' + String(mx + 1).padStart(6, '0'); }
function rcSugerirMonto(){
  var r = rcReserva(); if (!r) return;
  var c = $('rc-conc').value;
  var v = c === 'Seña' ? Math.round((r.total || 0) * 0.5) : c === 'Saldo' ? saldo(r) : c === 'Pago total' ? Math.max((r.total || 0) - (r.sena || 0), 0) : 0;
  $('rc-monto').value = v || '';
}
function renderRecibos(){
  $('rc-anotar').hidden = !S.edit;
  rcOpciones();
  document.querySelectorAll('[data-rt]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-rt') === RC.tab)); });
  $('rc-form-recibo').hidden = RC.tab !== 'recibo'; $('rc-form-bien').hidden = RC.tab !== 'bien';
  var r = rcReserva();
  $('rc-vacio').hidden = !!r; $('rc-zona').hidden = !r;
  if (!r) return;
  if (RC._ultimo !== RC.id) {
    RC._ultimo = RC.id;
    $('rc-de').value = r.huesped; $('rc-fecha').value = hoy(); $('rc-nota').value = '';
    $('rc-conc').value = (r.sena && r.estado === 'sena') ? 'Saldo' : (r.total && !r.sena ? 'Seña' : 'Pago total');
    rcSugerirMonto();
    // Si ya está todo pagado, se propone re-emitir el recibo del último pago
    var ult = (S.pagos || []).filter(function(p){ return p.reserva === r.id && p.estado === 'activo'; }).sort(function(a, b){ return a.id < b.id ? 1 : -1; })[0];
    if (!(parseInt($('rc-monto').value, 10) > 0) && ult) {
      if (['Seña', 'Saldo', 'Pago total', 'Otro pago'].indexOf(ult.concepto) >= 0) $('rc-conc').value = ult.concepto;
      $('rc-monto').value = ult.monto; if (ult.medio && [].some.call($('rc-medio').options, function(o){ return o.value === ult.medio; })) $('rc-medio').value = ult.medio;
    }
  }
  $('rc-info').innerHTML = chipCab(r.cabin) + '<span><b>' + esc(r.huesped) + '</b> · ' + esc(cabN(r.cabin)) + ' · ' + corto(r.from) + ' → ' + corto(r.to) + ' · ' + noches(r) + ' noche' + (noches(r) === 1 ? '' : 's') + ' · total ' + plata(r.total) + ' · seña ' + plata(r.sena) + '</span>';
  var c = rcCalc();
  $('rc-saldo').textContent = plata(c.saldo);
  if (!RC.clave) RC.clave = nuevaClave();
  var hist = (S.recibos || []).filter(function(x){ return x.reserva === r.id; }).sort(function(a, b){ return a.nro < b.nro ? 1 : -1; });
  $('rc-hist').innerHTML = hist.length ? hist.map(function(x){ return '<li><b>N° ' + esc(x.nro) + '</b> · ' + corto(x.fecha) + ' · ' + esc(x.concepto) + ' · ' + plata(x.monto) + ' · ' + esc(x.medio) + '</li>'; }).join('') : '<li class="muted">Todavía no emitiste recibos para esta reserva.</li>';
  dibujar();
}
var _dib = 0;
function dibujar(){ var k = ++_dib; setTimeout(function(){ if (k === _dib) (RC.tab === 'recibo' ? dibujarRecibo : dibujarBienvenida)().catch(function(){}); }, 60); }

/* Canvas helpers */
function rr(x, cx, cy, w, h, r){ x.beginPath(); x.moveTo(cx + r, cy); x.arcTo(cx + w, cy, cx + w, cy + h, r); x.arcTo(cx + w, cy + h, cx, cy + h, r); x.arcTo(cx, cy + h, cx, cy, r); x.arcTo(cx, cy, cx + w, cy, r); x.closePath(); }
function txt(x, t, cx, cy, font, col, align){ x.font = font; x.fillStyle = col; x.textAlign = align || 'left'; x.textBaseline = 'alphabetic'; x.fillText(t, cx, cy); }
function envolver(x, t, cx, cy, maxW, lh, font, col){ x.font = font; x.fillStyle = col; x.textAlign = 'left'; var pal = String(t).split(/\s+/), linea = '', yy = cy; pal.forEach(function(p){ var prueba = linea ? linea + ' ' + p : p; if (x.measureText(prueba).width > maxW && linea) { x.fillText(linea, cx, yy); linea = p; yy += lh; } else linea = prueba; }); if (linea) x.fillText(linea, cx, yy); return yy; }
function ajustar(x, t, maxW, peso, max, fam){ var s = max; x.font = peso + ' ' + s + 'px ' + fam; while (x.measureText(t).width > maxW && s > 20) { s -= 2; x.font = peso + ' ' + s + 'px ' + fam; } return peso + ' ' + s + 'px ' + fam; }
function cargarImg(src){ return new Promise(function(ok, no){ var i = new Image(); i.onload = function(){ ok(i); }; i.onerror = no; i.src = src; }); }
function logoSrc(){ var l = document.querySelector('.brand img'); return l ? l.src : null; }
var FD = "'Familjen Grotesk', 'Helvetica Neue', Arial, sans-serif", FB = "'Figtree', system-ui, sans-serif";
async function fuentes(){ try { await Promise.all([document.fonts.load('700 40px "Familjen Grotesk"'), document.fonts.load('600 30px "Figtree"'), document.fonts.load('400 30px "Figtree"')]); } catch (e) {} }

async function escena(x, cab, W, H, vb){
  try {
    var svg = ilu(cab).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" ');
    if (vb) svg = svg.replace('viewBox="0 0 320 200"', 'viewBox="' + vb + '"');
    var im = await cargarImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    x.drawImage(im, 0, 0, W, H);
  } catch (e) { x.fillStyle = cab.tint; x.fillRect(0, 0, W, H); }
}
async function logoPill(x, h){
  try { var lg = await cargarImg(logoSrc()); var lw = lg.width * h / lg.height; rr(x, 40, 36, lw + 48, h + 28, 26); x.fillStyle = 'rgba(255,255,255,.95)'; x.fill(); x.drawImage(lg, 64, 50, lw, h); } catch (e) {}
}
async function dibujarRecibo(){
  var c = rcCalc(); if (!c) return;
  await fuentes();
  var cv = $('rc-canvas'), x = cv.getContext('2d'), W = 1080, H = 1350, EX = 130, cab = cabC(c.r.cabin);
  cv.width = W; cv.height = H + EX;
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H + EX);
  await escena(x, cab, W, 340 + EX, '0 22 320 148');
  x.fillStyle = cab.col; x.fillRect(0, 340 + EX, W, 12);
  await logoPill(x, 84);
  var tag = 'RECIBO N° ' + c.nro; x.font = '700 34px ' + FD; var tw = x.measureText(tag).width;
  rr(x, W - 70 - tw - 48, 50, tw + 48, 70, 35); x.fillStyle = 'rgba(255,255,255,.95)'; x.fill();
  txt(x, tag, W - 70 - 24, 97, '700 34px ' + FD, '#0F2237', 'right');
  var nomCab = cab.n ? 'Cabaña ' + cab.id + ' · ' + cab.n : 'Cabaña 0'; x.font = '700 30px ' + FD; var cw = x.measureText(nomCab).width;
  rr(x, W - 70 - cw - 40, 270 + EX, cw + 40, 52, 26); x.fillStyle = cab.col; x.fill();
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 3; x.stroke();
  txt(x, nomCab, W - 70 - 20, 306 + EX, '700 30px ' + FD, cab.fg, 'right');
  x.save(); x.translate(0, EX);
  txt(x, 'Recibimos de', 70, 410, '600 28px ' + FB, '#4D5E72');
  txt(x, largo(c.fecha), W - 70, 410, '600 28px ' + FB, '#4D5E72', 'right');
  txt(x, c.de, 70, 464, ajustar(x, c.de, W - 140, '700', 52, FD), '#0F2237');
  txt(x, 'la suma de', 70, 516, '600 28px ' + FB, '#4D5E72');
  rr(x, 70, 534, W - 140, 136, 22); x.fillStyle = '#EEF4FB'; x.fill();
  txt(x, plata(c.monto), 110, 630, '700 88px ' + FD, '#0F2237');
  txt(x, c.conc + ' · ' + c.medio, W - 110, 615, ajustar(x, c.conc + ' · ' + c.medio, 380, '700', 32, FB), '#1F5FAA', 'right');
  var filas = [['Cabaña', nomCab], ['Llegada', largo(c.r.from) + ' · desde las 15:00'], ['Salida', largo(c.r.to) + ' · hasta las 10:00'],
    ['Noches', String(noches(c.r)) + (c.r.personas ? ' · ' + c.r.personas + ' personas' : '')], ['Medio de pago', c.medio], ['Concepto', c.conc]];
  var yy = 728;
  filas.forEach(function(f, i){
    txt(x, f[0], 70, yy, '600 28px ' + FB, '#4D5E72');
    if (i === 0) { rr(x, 360, yy - 30, 38, 38, 9); x.fillStyle = cab.col; x.fill(); txt(x, String(cab.id), 379, yy - 1, '700 24px ' + FD, cab.fg, 'center'); txt(x, f[1], 412, yy, '700 30px ' + FB, '#0F2237'); }
    else txt(x, f[1], 360, yy, ajustar(x, f[1], W - 430, '600', 30, FB), '#0F2237');
    x.fillStyle = '#EEF2F7'; x.fillRect(70, yy + 18, W - 140, 2);
    yy += 54;
  });
  yy += 8;
  rr(x, 70, yy, W - 140, 150, 22); x.fillStyle = '#F7F9FC'; x.fill(); x.strokeStyle = '#D9E1EB'; x.lineWidth = 2; x.stroke();
  [['Total de la estadía', plata(c.total)], ['Pagado a la fecha', plata(c.pagado)], ['Saldo pendiente', plata(c.saldo)]].forEach(function(k, i){ var cx = 70 + (W - 140) / 3 * i + 30; txt(x, k[0], cx, yy + 54, '600 26px ' + FB, '#4D5E72'); txt(x, k[1], cx, yy + 112, '700 42px ' + FD, i === 2 && c.saldo > 0 ? '#9A2F12' : '#0F2237'); });
  yy += 190;
  if (c.nota) { var nt = 'Nota: ' + c.nota; txt(x, nt, 70, yy, ajustar(x, nt, W - 140, '400', 26, FB), '#33475E'); }
  txt(x, '¡Gracias por elegir Cabañas Cielo Azul!', W / 2, H - 84, '700 34px ' + FD, '#123F7A', 'center');
  txt(x, 'San Lorenzo, Salta · WhatsApp +54 9 11 3816-7697', W / 2, H - 46, '400 25px ' + FB, '#33475E', 'center');
  txt(x, 'Comprobante simbólico de pago. No válido como factura.', W / 2, H - 16, '400 21px ' + FB, '#4D5E72', 'center');
  x.restore();
}

async function dibujarBienvenida(){
  var r = rcReserva(); if (!r) return;
  await fuentes();
  var cv = $('rc-canvas'), x = cv.getContext('2d'), W = 1080, H = 1350, cab = cabC(r.cabin);
  cv.width = W; cv.height = H;
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
  await escena(x, cab, W, 560);
  x.fillStyle = cab.col; x.fillRect(0, 560, W, 14);
  await logoPill(x, 96);
  var saludo = '¡Gracias por tu reserva, ' + nombreCorto(r.huesped) + '!';
  txt(x, saludo, 70, 660, ajustar(x, saludo, W - 140, '700', 60, FD), '#0F2237');
  txt(x, 'Te esperamos en San Lorenzo, Salta.', 70, 710, '400 32px ' + FB, '#33475E');
  rr(x, 70, 750, W - 140, 170, 26); x.fillStyle = cab.col; x.fill();
  txt(x, 'TU CABAÑA', 110, 805, '700 28px ' + FB, cab.fg);
  var nom = cab.n ? 'Cabaña ' + cab.id + ' · ' + cab.n : 'Cabaña 0';
  txt(x, nom, 110, 885, ajustar(x, nom, W - 220, '700', 76, FD), cab.fg);
  var bx = [['LLEGADA', medio(r.from), 'desde las 15:00'], ['SALIDA', medio(r.to), 'hasta las 10:00']];
  bx.forEach(function(b, i){ var cx = 70 + i * ((W - 160) / 2 + 20), w = (W - 160) / 2;
    rr(x, cx, 950, w, 170, 22); x.fillStyle = '#F2F5F9'; x.fill(); x.strokeStyle = '#D9E1EB'; x.lineWidth = 2; x.stroke();
    txt(x, b[0], cx + 30, 1000, '700 24px ' + FB, '#4D5E72'); txt(x, b[1], cx + 30, 1060, ajustar(x, b[1], w - 60, '700', 46, FD), '#0F2237'); txt(x, b[2], cx + 30, 1100, '600 28px ' + FB, '#1F5FAA'); });
  rr(x, 70, 1150, W - 140, 110, 22); x.fillStyle = '#0F2237'; x.fill();
  x.save(); x.translate(120, 1205); x.strokeStyle = '#FFFFFF'; x.lineWidth = 5; x.lineCap = 'round';
  [34, 22, 10].forEach(function(rad){ x.beginPath(); x.arc(0, 14, rad, Math.PI * 1.25, Math.PI * 1.75); x.stroke(); }); x.beginPath(); x.arc(0, 14, 3, 0, Math.PI * 2); x.fillStyle = '#FFFFFF'; x.fill(); x.restore();
  var red = ($('bv-red').value || '').trim(), pass = ($('bv-pass').value || WIFI_PASS).trim();
  txt(x, red ? 'WiFi: ' + red : 'WiFi', 180, 1195, '600 28px ' + FB, '#C9D9EC');
  txt(x, 'Contraseña: ' + pass, 180, 1238, ajustar(x, 'Contraseña: ' + pass, W - 290, '700', 42, FD), '#FFFFFF');
  var extra = ($('bv-extra').value || '').trim();
  if (extra) envolver(x, extra, 70, 1300, W - 140, 34, '400 26px ' + FB, '#33475E');
  else txt(x, 'Consultas: WhatsApp +54 9 11 3816-7697', W / 2, 1310, '600 28px ' + FB, '#33475E', 'center');
}
function textoRecibo(c){
  return 'RECIBO N° ' + c.nro + ' · Cabañas Cielo Azul\n' + largo(c.fecha) + '\n\nRecibimos de ' + c.de + ' la suma de ' + plata(c.monto) + ' en concepto de ' + c.conc.toLowerCase() + ' (' + c.medio + ').\n\n' +
    cabN(c.r.cabin) + '\nLlegada: ' + largo(c.r.from) + ', desde las 15:00\nSalida: ' + largo(c.r.to) + ', hasta las 10:00\n\nTotal de la estadía: ' + plata(c.total) + '\nPagado a la fecha: ' + plata(c.pagado) + '\nSaldo pendiente: ' + plata(c.saldo) + '\n\n¡Gracias por elegirnos!';
}
function textoBienvenida(r){
  var red = ($('bv-red').value || '').trim(), pass = ($('bv-pass').value || WIFI_PASS).trim(), extra = ($('bv-extra').value || '').trim();
  return '¡Hola ' + nombreCorto(r.huesped) + '! Gracias por tu reserva en Cabañas Cielo Azul.\n\nTu cabaña: ' + cabN(r.cabin) + '\nLlegada: ' + largo(r.from) + ', desde las 15:00\nSalida: ' + largo(r.to) + ', hasta las 10:00\n\nWiFi' + (red ? ' (' + red + ')' : '') + ' · contraseña: ' + pass + (extra ? '\n\n' + extra : '') + '\n\nCualquier consulta, escribinos por acá. ¡Te esperamos!';
}
async function copiar(t){
  try { await navigator.clipboard.writeText(t); toast('Texto copiado. Pegalo en el chat de WhatsApp.'); }
  catch (e) { var ta = $('rc-copia'); ta.hidden = false; ta.value = t; ta.focus(); ta.select(); toast('Seleccioné el texto: copialo con Ctrl+C o mantené apretado.'); }
}
async function descargarCanvas(nombre){
  var cv = $('rc-canvas');
  var blob = await new Promise(function(ok){ cv.toBlob(ok, 'image/png'); });
  if (!blob) { toast('No se pudo generar la imagen.'); return false; }
  var url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
  toast('Imagen descargada: ' + nombre);
  return true;
}
function initRecibos(){
  $('rc-q').addEventListener('input', function(){ RC.id = null; renderRecibos(); });
  $('rc-res').addEventListener('change', function(){ RC.id = this.value; renderRecibos(); });
  document.querySelectorAll('[data-rt]').forEach(function(b){ b.addEventListener('click', function(){ RC.tab = b.getAttribute('data-rt'); $('rc-copia').hidden = true; renderRecibos(); }); });
  $('rc-conc').addEventListener('change', function(){ rcSugerirMonto(); renderRecibos(); });
  ['rc-monto','rc-medio','rc-fecha','rc-de','rc-nota','bv-red','bv-pass','bv-extra'].forEach(function(id){ $(id).addEventListener('input', function(){ if (id.indexOf('rc-') === 0) $('rc-saldo').textContent = plata((rcCalc() || {}).saldo || 0); dibujar(); }); });
  // Emitir recibo de un pago que ya figura en la reserva (no suma un pago nuevo)
  $('rc-dl').addEventListener('click', async function(){
    var c = rcCalc(); if (!c) return; if (!c.monto) { toast('Escribí el monto del recibo.'); return; }
    RC.modo = 'existente'; c = rcCalc();
    try {
      var res = await escribir('registrarRecibo', { clave: RC.clave, reserva: c.r.id, monto: c.monto, medio: c.medio, concepto: c.conc, fecha: c.fecha, nota: c.nota, de: c.de }, 'Recibo registrado en la planilla.');
      RC.nro = res.recibo.nro; await dibujarRecibo(); await descargarCanvas('recibo-' + RC.nro + '-' + slug(c.r.huesped) + '.png');
      RC.nro = null; RC.clave = nuevaClave();
    } catch (e) {} finally { RC.modo = null; dibujar(); }
  });
  $('rc-txt').addEventListener('click', function(){ var c = rcCalc(); if (c) copiar(textoRecibo(c)); });
  // Registrar un pago nuevo (seña, saldo, etc.): suma a la reserva, actualiza el saldo y emite su recibo
  $('rc-anotar').addEventListener('click', async function(){
    var c = rcCalc(); if (!c || !S.edit) return; if (!c.monto) { toast('Escribí el monto recibido.'); return; }
    try {
      var res = await escribir('registrarPago', { clave: RC.clave, reserva: c.r.id, monto: c.monto, medio: c.medio, concepto: c.conc, fecha: c.fecha, nota: c.nota, de: c.de, conRecibo: true }, 'Pago registrado en la planilla y recibo emitido.');
      RC.modo = 'existente'; RC.nro = res.recibo && res.recibo.nro; await dibujarRecibo();
      await descargarCanvas('recibo-' + (RC.nro || 'pago') + '-' + slug(c.r.huesped) + '.png');
      RC.nro = null; RC.modo = null; RC.clave = nuevaClave(); RC._ultimo = null; renderRecibos();
    } catch (e) { RC.modo = null; RC.nro = null; }
  });
  $('bv-dl').addEventListener('click', async function(){ var r = rcReserva(); if (!r) return; await dibujarBienvenida(); descargarCanvas('bienvenida-' + slug(r.huesped) + '.png'); });
  $('bv-txt').addEventListener('click', function(){ var r = rcReserva(); if (r) copiar(textoBienvenida(r)); });
}

/* ---------- Arranque ---------- */
opcionesCab();
initRecibos();
initConexion();
irA(location.hash.slice(1) || 'hoy');
if (claveSesion()) { document.body.classList.remove('bloqueado'); cargar(); } else bloquear_pantalla('');
setInterval(function(){ if (document.visibilityState === 'visible' && !$('dlg').open && !S.ocupado && claveSesion()) cargar(true); }, 60000);
document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'visible' && !S.ocupado && claveSesion()) cargar(true); });
})();
