# Reservas Cielo Azul

Sistema interno para administrar las reservas de Cabañas Cielo Azul (San Lorenzo, Salta): disponibilidad por cabaña, calendario, reservas, pagos y señas, recibos, mensaje de llegada para el huésped y tarifas.

Es un sitio estático (HTML, CSS y JavaScript, sin build). Los datos viven en la planilla de Google Sheets **CABAÑAS CIELO AZUL - SISTEMA 2026-2030** y se leen y escriben a través de un Google Apps Script publicado como aplicación web.

```
Navegador (Vercel) ──fetch──▶ Apps Script /exec ──▶ Google Sheets (planilla actual)
```

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación |
| `css/styles.css` | Estilos |
| `js/app.js` | Lógica de la aplicación y conexión con la planilla |
| `js/config.js` | URL del Apps Script e ID de la planilla (datos públicos, sin claves) |
| `assets/` | Logo e ícono |
| `apps-script/Codigo.gs` | Código del backend. Se pega en Apps Script; no corre en Vercel |
| `apps-script/appsscript.json` | Manifiesto opcional del Apps Script |

## Cómo se anota una reserva

El botón **+ Nueva reserva** abre un asistente de 4 pasos, pensado para usarse desde el celular sin conocimientos previos: fechas y personas → cabaña (solo se muestran las libres) → nombre y teléfono → total y seña. Al final muestra un resumen y el botón **Guardar reserva**. El estado (Por confirmar, Sin seña, Con seña, Pagada) se define solo según lo que se cargó. Para editar una reserva existente se usa la ficha completa.

En el celular la lista completa de reservas (con buscador y filtros) está en la pantalla **Hoy**, debajo de las cabañas; la sección **Reservas** separada solo aparece en pantallas grandes.

## Cómo usa la planilla

La planilla actual se conserva tal cual. El sistema agrega cuatro pestañas al final (las crea solo la primera vez):

- **BD_RESERVAS**: una fila por reserva, con ID único `RES-000001`. Es el registro principal.
- **BD_PAGOS**: cada seña o pago (`PAG-000001`). El "Pagado" y el "Saldo" de la reserva salen de acá.
- **BD_RECIBOS**: cada recibo emitido (`REC-000001`).
- **BD_TARIFAS**: precio por noche, capacidad máxima (personas) y enlace del calendario de Airbnb de cada cabaña.

La primera vez, todas las reservas que ya están escritas en las hojas mensuales (AGOSTO 2026 … DICIEMBRE 2030) se copian a BD_RESERVAS. No se borra ni se reemplaza nada.

Después, cada cambio también se escribe en la **hoja del mes** correspondiente, dentro del bloque de la cabaña:

- columna A: nombre del huésped;
- una "x" por noche (o "?" si está por confirmar);
- columnas Teléfono, Valor alq., Seña, Venta total, Ocupantes y Notas (ID, estado, origen y notas);
- la columna **A cobrar** no se toca, así conserva su fórmula.

Antes de cada cambio, el sistema incorpora lo que se haya escrito a mano en esa hoja del mes, para no pisarlo.

**Acciones que escriben en la planilla:**

- crear, editar o cancelar una reserva;
- cambiar fechas o cabaña;
- eliminar una reserva;
- registrar o anular un pago;
- emitir un recibo;
- cambiar una tarifa o la capacidad de una cabaña;
- vincular o desvincular el calendario de Airbnb de una cabaña, y cada sincronización con Airbnb;
- "Actualizar con los datos más recientes";
- "Reescribir hojas mensuales".

Si Google no responde, el sistema muestra **Error al sincronizar** con un botón **Reintentar**, y no informa que se guardó. Cada envío lleva una clave única, así que reintentar o hacer doble clic no duplica registros.

## Capacidad de las cabañas

Cada cabaña tiene una capacidad de fábrica (Luna 2–3, Marte 9–10, etc.). Desde la tarjeta de la cabaña, el botón **Tarifa y capacidad** permite cambiar el precio por noche y la cantidad máxima de personas. El valor queda en BD_TARIFAS y lo usa todo el sistema: el buscador de disponibilidad, el asistente de nueva reserva y los avisos de "esta cabaña es para hasta N personas". Si se vuelve al número de fábrica, se muestra otra vez el texto original (por ejemplo "2–3 pers.").

## Airbnb

Airbnb no permite conectar la cuenta de un anfitrión a otros sistemas, pero cada anuncio exporta un **calendario (.ics)** con sus reservas. En la sección **Excel vinculado › Airbnb** se pega el enlace del calendario de cada cabaña (en Airbnb: Calendario › anuncio › Disponibilidad › Conectar calendarios › Exportar calendario).

Qué hace el sistema con ese enlace:

- Cada reserva del calendario se anota como reserva del sistema con origen **Airbnb**, estado **Pagada** (se cobra a través de Airbnb) y la clave `airbnb:<código de reserva>`, así nunca se duplica. Airbnb no incluye el nombre del huésped: se carga "Huésped de Airbnb · HMXXXX" y los últimos 4 dígitos del teléfono; nombre, personas y total se completan desde la ficha y no se pisan en las próximas sincronizaciones.
- Si la reserva cambia de fechas en Airbnb, se mueve; si desaparece del calendario (cancelación), se marca como cancelada y libera las noches; si vuelve a aparecer, se reactiva.
- Los bloqueos de fechas ("Airbnb (Not available)") no se importan.
- Si en esas fechas ya había una reserva anotada a mano, no la pisa: lo informa como conflicto en el panel.
- La sincronización corre sola cada 20 minutos mientras alguien usa el sistema, y con el botón **Sincronizar Airbnb ahora**. Para que corra cada hora aunque nadie abra el sistema, ejecutá una vez la función `instalarSincronizacionAirbnb` desde el editor de Apps Script.

Al actualizar `Codigo.gs` con esta función hay que volver a ejecutar `configurarPorPrimeraVez` desde el editor y aceptar el permiso nuevo ("Conectarse a un servicio externo"), y luego publicar una **Nueva versión**. Si en su momento pegaste `appsscript.json` en el editor, reemplazalo por el nuevo (agrega los permisos `script.external_request` y `script.scriptapp`); si nunca lo pegaste, Apps Script los pide solo.

## Paso 1 · Publicar el Apps Script (una sola vez)

1. Abrí la planilla en Google Sheets con una cuenta que tenga permiso de **edición**.
2. Andá a **Extensiones › Apps Script**.
3. Borrá el contenido de `Código.gs` y pegá todo `apps-script/Codigo.gs`. Guardá.
4. Arriba, elegí la función `configurarPorPrimeraVez` y tocá **Ejecutar**. Aceptá los permisos que pide Google. Esto crea las pestañas BD_* y copia las reservas existentes; podés verlo en el registro de ejecución.
5. Tocá **Implementar › Nueva implementación**. Tipo: **Aplicación web**. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier persona**. Tocá **Implementar**.
6. Copiá la **URL de la aplicación web**; termina en `/exec`.
Si más adelante cambiás `Codigo.gs`, usá **Implementar › Administrar implementaciones › Editar › Nueva versión** para mantener la misma URL.

## Contraseña de acceso

Al abrir el sistema pide una contraseña. La verifica el Apps Script en cada pedido, así que sin ella no se pueden ver ni cambiar datos, aunque alguien tenga el link.

- La contraseña está en `apps-script/Codigo.gs`, en la línea `var CLAVE_ACCESO = '...'`. Para cambiarla, editá ese valor en el editor de Apps Script y publicá una **Nueva versión** (Implementar › Administrar implementaciones › lápiz › Versión: Nueva versión › Implementar).
- Alternativa sin tocar el código: en **Configuración del proyecto › Propiedades del script** creá `API_TOKEN` con la contraseña nueva. Tiene prioridad sobre la del código.
- "Recordar en este dispositivo" guarda la contraseña en ese navegador. **Cerrar sesión** (sección Excel vinculado) la borra.
- La contraseña no aparece en `index.html` ni en `js/`; solo vive en el Apps Script, que no se sirve al navegador.

## Paso 2 · Configurar el sitio

En `js/config.js`, pegá la URL del paso 1 en `endpoint`:

```js
window.CIELO_CONFIG = {
  endpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec',
  sheetId: '1BjmyM7fHC6nOWI0z3AB0s3kEesXsRpRNT6MRz6Qogx4',
  ...
};
```

También podés pegarla desde el sistema, en la sección **Excel vinculado › Conectar planilla**. Ahí mismo podés cambiar el enlace por otra planilla, siempre que la cuenta que publicó el script pueda editarla.

## Abrirlo en tu computadora

No necesita instalación. Desde la carpeta del proyecto ejecutá `npx serve .` (o `python3 -m http.server 8080`) y abrí la dirección que muestra. Abrir el archivo con doble clic también funciona para mirar, pero es mejor usar un servidor.

## Subirlo a GitHub

1. Creá un repositorio **privado** en GitHub.
2. Subí el contenido de esta carpeta (ver la lista de abajo), por ejemplo con **Add file › Upload files**, o con:

```bash
git init && git add . && git commit -m "Sistema de reservas Cielo Azul"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/mi-sistema-cabanas.git
git push -u origin main
```

## Desplegarlo en Vercel

1. En Vercel: **Add New › Project › Import** del repositorio.
2. Framework Preset: **Other**.
3. Root Directory: `./`
4. Build Command: vacío (sin build).
5. Output Directory: vacío (o `.`).
6. Install Command: vacío.
7. Environment Variables: ninguna.
8. **Deploy**. Queda en una dirección tipo `https://mi-sistema-cabanas.vercel.app`.

## Qué no se debe publicar

- Ninguna clave privada ni archivo de credenciales de Google. Este proyecto no los usa; el Apps Script corre con tu cuenta de Google.
- La contraseña de acceso está solo en `apps-script/Codigo.gs` (que no se publica en el sitio) o en la propiedad `API_TOKEN` del script. El repositorio debe ser privado.
- Copias de la planilla (`.xlsx`, `.csv`). El `.gitignore` ya las excluye.

La URL `/exec` y el ID de la planilla quedan visibles en el navegador; sin la contraseña no sirven para nada.

## Cómo comprobar que la sincronización funciona

1. Abrí el sistema publicado e ingresá la contraseña. En **Excel vinculado** tiene que decir **Conectado**, el nombre de la planilla y la hora de la última sincronización.
2. Creá una reserva de prueba con un nombre claro, por ejemplo `PRUEBA (borrar)`. Debe aparecer en BD_RESERVAS con un ID `RES-…` y en la hoja del mes, en el bloque de su cabaña.
3. Editala: cambiá el nombre. Se modifica esa misma fila; no se crea otra.
4. En **Recibos**, registrá un pago. Aparece en BD_PAGOS y en BD_RECIBOS, y cambian el Pagado y el Saldo de la reserva y la columna Seña de la hoja del mes.
5. Cambiale fechas o cabaña. Se borra del mes o bloque anterior y aparece en el nuevo.
6. Cancelala. En BD_RESERVAS queda con estado `cancelada` y sus noches se liberan en la hoja del mes.
7. Recargá la página y abrila desde otro navegador o desde el celular: los datos tienen que ser los mismos.
8. Al terminar, eliminá la reserva de prueba desde su ficha (**Eliminar reserva**).

## ARCHIVOS QUE DEBO SUBIR A GITHUB

```
mi-sistema-cabanas/
├── index.html
├── README.md
├── .gitignore
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── config.js
├── assets/
│   ├── images/
│   │   └── logo.webp
│   └── icons/
│       └── favicon.svg
└── apps-script/
    ├── Codigo.gs
    └── appsscript.json
```

## CONFIGURACIÓN DE VERCEL

| Opción | Valor |
|---|---|
| Framework Preset | Other |
| Root Directory | `./` |
| Build Command | vacío (no hay build) |
| Output Directory | vacío o `.` |
| Install Command | vacío |
| Environment Variables | ninguna |
