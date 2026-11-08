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

**44 pruebas locales aprobadas**, incluidas autenticación por segundo factor, revocación, borradores, ediciones antiguas, cuotas de productos y categorías, rechazo de la imagen 121, invitaciones privadas y cambio seguro de teléfono.

La conexión contra Supabase real permitió leer categorías y productos publicados. Rechazó, con respuesta 401, cuatro solicitudes de un visitante: consultar administradores, escribir directamente en tablas, ejecutar una edición y llamar a la comprobación interna de administrador.

Las verificaciones no incluyen el uso de la contraseña real ni la configuración del teléfono del administrador. Esas acciones deben realizarlas las personas autorizadas directamente en la interfaz.

## Administradores y ayuda (11.1)

El panel permite a cualquier administrador con MFA verificado crear un enlace privado para otro correo, copiarlo y enviarlo personalmente. No envía correos ni WhatsApp automáticamente. El destinatario elige su contraseña y configura su propio autenticador. Registro público deshabilitado; no se usa un proveedor de correo de pago.

Las invitaciones duran 24 horas y se consumen una sola vez. Solo se guarda su hash SHA-256; el secreto de 256 bits viaja en el fragmento del enlace, se retira de la barra al abrir y se conserva solo en la pestaña hasta activar. El enlace concede acceso a la cuenta indicada: se debe enviar únicamente a la persona autorizada. No verifica la entrega de un correo por SMTP.

Se limitan a 10 las plazas de administradores, incluyendo invitaciones pendientes; 20 invitaciones por 24 horas; 20 cuentas de Auth incluyendo altas interrumpidas; 10 intentos de activación por minuto y 100 por 24 horas en todo el proyecto. Cada invitación permite hasta 5 intentos cada 15 minutos. El historial de invitaciones se limpia al crear nuevas altas, después de 30 días. Un ataque puede agotar temporalmente estas cuotas y bloquear nuevas altas; no desbloquea el catálogo ni permite editar.

La función de servidor `catalog-activate` autentica cada alta con la invitación secreta y comprueba su vigencia y autorización. El control JWT de la puerta de entrada está deshabilitado porque el invitado todavía no tiene cuenta; no es una función de registro abierto. Las claves privilegiadas solo se leen del entorno privado de Supabase. No se guardan contraseñas, tokens de sesión ni enlaces secretos en registros de aplicación. Supabase conserva sus registros operativos normales.

La migración `04-administradores.sql` y la función de servidor están instaladas. Las llamadas reales de visitantes a las funciones de equipo y de activación privada devolvieron 401, y la función de activación rechazó un enlace inválido sin crear cuentas. Los flujos completos de alta y cambio de teléfono se verificaron con cuentas ficticias locales; los teléfonos y contraseñas reales requieren a sus titulares.

La opción **Cambiar el teléfono de mi cuenta** comprueba el código del nuevo teléfono antes de retirar los factores anteriores de esa cuenta. Conserva la contraseña. No se retiró el autenticador real existente durante el desarrollo. El panel incluye instrucciones para invitar, configurar Contraseñas en iPhone, entregar una cuenta a su dueño y quitar permisos.

## Revisión de seguridad

Las tablas tienen RLS. No hay permisos de escritura directa para visitantes ni cuentas de aplicación. Las operaciones de edición se exponen deliberadamente como funciones protegidas que comprueban membresía, sesión `aal2` y un factor TOTP verificado en cada operación. No hay SQL dinámico y el esquema de búsqueda de esas funciones está fijado.

El asesor de Supabase puede advertir que las cuentas autenticadas pueden ejecutar funciones `SECURITY DEFINER`; ese acceso es intencional para estas operaciones protegidas, y su rechazo de usuarios no autorizados forma parte de las pruebas. Las funciones de edición no son ejecutables por visitantes. [Explicación del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

La comprobación automática de contraseñas filtradas permanece desactivada porque Supabase la ofrece en planes de pago. Se mantuvo Free, como pidió el propietario, con longitud mínima de contraseña de 12 caracteres, cambio seguro de contraseña y segundo factor obligatorio para editar. Se recomienda una contraseña única. [Alcance de esa función](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Publicación

La versión inicial del catálogo se incorporó desde **catalogo-autogestionable-v11**. La actualización de administradores 11.1 se prepara en **administradores-invitaciones**, en **cofrefrancisco2020-cpu/Adriazola-Vega**. Sus despliegues automáticos de Vercel están deshabilitados para evitar publicaciones intermedias; se publica al incorporar la actualización completa a la rama principal.

La versión 10 del escritorio permanece intacta. El hosting debe servir todos los archivos de esta actualización para mostrar la sección Administradores y ayuda; actualizar Supabase por sí solo no modifica la interfaz pública.
