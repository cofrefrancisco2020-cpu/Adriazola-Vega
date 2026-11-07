# Adriazola 4WD · catálogo conectado

## Conexión real

Supabase está conectado al proyecto exclusivo **adriazola-4wd**, referencia `nveehecqdefrdncdkpxy`, organización **Perspective ORG**, región São Paulo. El plan se comprobó como **Free** y la consulta de costo del proyecto devolvió **$0 al mes**. No se habilitaron servicios adicionales de pago.

Se instaló el esquema del catálogo y se cerró el registro público. El propietario creó una cuenta, que quedó autorizada como administradora. La primera entrada exige configurar y verificar una aplicación autenticadora; tener únicamente la contraseña no permite editar, leer borradores ni subir imágenes.

La página contiene únicamente la clave publicable. No se incorporaron al repositorio contraseñas, claves privadas, datos del autenticador ni el correo personal del administrador.

## Límites

Se cargaron dos productos editables y eliminables en Supabase: transmisión y suspensión 4x4. Ambos están identificados como ejemplos, sin precio y sin disponibilidad para venta. Sus dos fotografías WebP ocupan 489.582 bytes en total. Se pueden reemplazar o eliminar desde Administración después de completar el acceso con autenticador.

- 100 productos, incluidos borradores, y 20 categorías.
- Una fotografía por producto.
- 400 KiB por imagen almacenada y un máximo de 120 imágenes, incluidas las pendientes de limpieza. Menos de 47 MiB de fotografías en total.
- Compresión WebP en el navegador, hasta 1600 píxeles por lado. Sin transformaciones de imagen de pago en Supabase.
- Aplicación autenticadora TOTP, sin SMS.
- Envío automático de recuperación por correo deshabilitado hasta disponer de un remitente aprobado que respete el costo cero.

El plan Free puede restringir el servicio al agotar cuotas y pausar proyectos inactivos. No se habilitó una mejora de plan ni el cobro de excedentes. El tráfico no es ilimitado. [Control de costos de Supabase](https://supabase.com/docs/guides/platform/cost-control).

## Verificación

**28 pruebas locales aprobadas**, incluidas autenticación por segundo factor, revocación, borradores, ediciones antiguas, cuotas de productos y categorías y rechazo de la imagen 121.

La conexión contra Supabase real permitió leer categorías y productos publicados. Rechazó, con respuesta 401, cuatro solicitudes de un visitante: consultar administradores, escribir directamente en tablas, ejecutar una edición y llamar a la comprobación interna de administrador.

Las verificaciones no incluyen el uso de la contraseña real ni la configuración del teléfono del administrador. Esas acciones deben realizarlas las personas autorizadas directamente en la interfaz.

## Revisión de seguridad

Las tablas tienen RLS. No hay permisos de escritura directa para visitantes ni cuentas de aplicación. Las operaciones de edición se exponen deliberadamente como funciones protegidas que comprueban membresía, sesión `aal2` y un factor TOTP verificado en cada operación. No hay SQL dinámico y el esquema de búsqueda de esas funciones está fijado.

El asesor de Supabase puede advertir que las cuentas autenticadas pueden ejecutar funciones `SECURITY DEFINER`; ese acceso es intencional para estas operaciones protegidas, y su rechazo de usuarios no autorizados forma parte de las pruebas. Las funciones de edición no son ejecutables por visitantes. [Explicación del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

La comprobación automática de contraseñas filtradas permanece desactivada porque Supabase la ofrece en planes de pago. Se mantuvo Free, como pidió el propietario, con longitud mínima de contraseña de 12 caracteres, cambio seguro de contraseña y segundo factor obligatorio para editar. Se recomienda una contraseña única. [Alcance de esa función](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Publicación

La rama de revisión es **catalogo-autogestionable-v11** en **cofrefrancisco2020-cpu/Adriazola-Vega**. Se deshabilitaron sus despliegues automáticos de Vercel para preparar la revisión sin publicaciones intermedias. La publicación en el dominio oficial se gestiona aparte.

La versión 10 del escritorio permanece intacta. Para entrar desde la página pública es necesario que el hosting sirva estos archivos nuevos; el alta de Supabase por sí sola no añade el enlace Administración al sitio anterior.
