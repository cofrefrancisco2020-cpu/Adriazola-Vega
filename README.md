# Adriazola 4WD · versión 11

Catálogo autogestionable integrado sobre la versión 10 del escritorio. Conserva la página del taller y sus idiomas español, inglés y alemán. El panel se usa en español.

**Para comenzar:** lee [GUIA-CONEXION.md](GUIA-CONEXION.md).

**Para Pablo y los editores:** [MANUAL-DEL-TALLER.md](MANUAL-DEL-TALLER.md).

## Incluye

- Catálogo público con búsqueda, categorías, ficha del producto y consulta por WhatsApp.
- Panel con correo, contraseña y código TOTP obligatorio; productos y categorías, borradores, stock, precios en CLP, orden por arrastre y flechas, y movimiento entre categorías.
- Conversión automática de JPG/PNG/WebP a WebP de hasta 400 KB y 1600 px.
- SQL de instalación, alta explícita de administradores y verificación de permisos.
- Límite de 100 productos, 20 categorías y 120 imágenes aplicado en el servidor. Cada imagen admite hasta 400 KiB.
- Demostración sin conexión en `admin.html?demo=1`; se deshabilita si existe una conexión válida. Sus cambios se borran al recargar.
- Biblioteca oficial `@supabase/supabase-js` 2.119.0 incluida localmente. El sitio no descarga código de un CDN al abrirse.

## Probar localmente

Abre `ABRIR-VISTA-PREVIA.cmd` o ejecuta con Node.js 22 o posterior:

```text
node preview.mjs
```

Página: `http://127.0.0.1:4173/`.

Panel conectado: `http://127.0.0.1:4173/admin.html`. El modo de ejemplo queda deshabilitado mientras exista una conexión válida.

El servidor escucha solo en este equipo. El sitio publicado es estático y no requiere Node.js ni compilación en el hosting.

## Pruebas de desarrollo

Con Node.js 22 o posterior:

```text
npm install
npm test
```

La única dependencia de desarrollo es PGlite 0.5.15 para ejecutar PostgreSQL localmente. No forma parte de la web publicada. Las pruebas no se conectan a un proyecto real de Supabase ni envían mensajes de WhatsApp.

No agregues contraseñas ni claves privadas al repositorio. `config.js` solo acepta URL y clave pública de Supabase.

## Entrega

Supabase está conectado al proyecto exclusivo `adriazola-4wd`, referencia `nveehecqdefrdncdkpxy`, región São Paulo, organización Perspective ORG, plan Free verificado y costo de proyecto consultado de $0 al mes. El registro público está cerrado. Se requiere una cuenta autorizada y completar TOTP para editar.

La rama de revisión de la actualización 11.1 es `administradores-invitaciones`. Sus despliegues automáticos de Vercel están deshabilitados para evitar publicaciones intermedias. La versión 10 del escritorio permanece intacta.

## Administradores y ayuda

Cada administrador que complete MFA puede crear invitaciones privadas para otras personas, hasta 10 plazas incluidas las pendientes. Los enlaces duran 24 horas y sirven una sola vez. Cada invitado elige su contraseña y configura su propio teléfono. No se envían mensajes automáticamente ni se utiliza un proveedor SMTP. Las cuentas no se registran públicamente.

El panel incluye instrucciones para Contraseñas de iPhone y una opción para cambiar el teléfono conservando la contraseña. El código del teléfono nuevo se verifica antes de retirar los anteriores. La migración y la función de servidor de esta actualización están en `supabase/04-administradores.sql` y `supabase/functions/catalog-activate/`. Consulta `GUIA-CONEXION.md` y `ENTREGA.md` para instalación, límites, pruebas y decisiones de seguridad.
