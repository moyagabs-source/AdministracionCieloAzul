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

## Cómo usa la planilla

La planilla actual se conserva tal cual. El sistema agrega cuatro pestañas al final (las crea solo la primera vez):

- **BD_RESERVAS**: una fila por reserva, con ID único `RES-000001`. Es el registro principal.
- **BD_PAGOS**: cada seña o pago (`PAG-000001`). El "Pagado" y el "Saldo" de la reserva salen de acá.
- **BD_RECIBOS**: cada recibo emitido (`REC-000001`).
- **BD_TARIFAS**: precio por noche de cada cabaña.

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
- cambiar una tarifa;
- "Actualizar con los datos más recientes";
- "Reescribir hojas mensuales".

Si Google no responde, el sistema muestra **Error al sincronizar** con un botón **Reintentar**, y no informa que se guardó. Cada envío lleva una clave única, así que reintentar o hacer doble clic no duplica registros.

## Paso 1 · Publicar el Apps Script (una sola vez)

1. Abrí la planilla en Google Sheets con una cuenta que tenga permiso de **edición**.
2. Andá a **Extensiones › Apps Script**.
3. Borrá el contenido de `Código.gs` y pegá todo `apps-script/Codigo.gs`. Guardá.
4. Arriba, elegí la función `configurarPorPrimeraVez` y tocá **Ejecutar**. Aceptá los permisos que pide Google. Esto crea las pestañas BD_* y copia las reservas existentes; podés verlo en el registro de ejecución.
5. Tocá **Implementar › Nueva implementación**. Tipo: **Aplicación web**. Ejecutar como: **Yo**. Quién tiene acceso: **Cualquier persona**. Tocá **Implementar**.
6. Copiá la **URL de la aplicación web**; termina en `/exec`.
7. Opcional, para que nadie más pueda usar esa URL: en **Configuración del proyecto › Propiedades del script**, agregá `API_TOKEN` con una clave. Después escribí esa misma clave en el sistema, en la sección "Excel vinculado". La clave queda guardada solo en tu navegador.

Si más adelante cambiás `Codigo.gs`, usá **Implementar › Administrar implementaciones › Editar › Nueva versión** para mantener la misma URL.

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
- El valor de `API_TOKEN` no va en el código: se escribe solo en el navegador, en "Excel vinculado".
- Copias de la planilla (`.xlsx`, `.csv`). El `.gitignore` ya las excluye.

La URL `/exec` y el ID de la planilla quedan visibles en el navegador. Por eso conviene definir `API_TOKEN` si el link del sistema puede llegar a otras personas.

## Cómo comprobar que la sincronización funciona

1. Abrí el sistema publicado. En **Excel vinculado** tiene que decir **Conectado**, el nombre de la planilla y la hora de la última sincronización.
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
