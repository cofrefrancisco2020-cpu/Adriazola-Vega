# Catálogo conectado de Adriazola 4WD

## Estado de la conexión

El proyecto **adriazola-4wd** ya está creado en la organización **Perspective ORG**, región São Paulo, y la página usa su URL y su clave pública. Se instalaron las tablas, los permisos, el almacenamiento y la obligación de usar contraseña más código de una aplicación autenticadora.

- [Abrir el proyecto en Supabase](https://supabase.com/dashboard/project/nveehecqdefrdncdkpxy)
- Referencia del proyecto: `nveehecqdefrdncdkpxy`.
- Plan verificado: **Free**. La consulta de costo del proyecto indicó **$0 al mes**.
- Registro público y acceso anónimo de cuentas: deshabilitados.
- El visitante consulta el catálogo sin registrarse. Solo las cuentas autorizadas pueden editar, después de completar el segundo factor.

La página oficial seguirá mostrando la versión anterior hasta que estos archivos se publiquen en el hosting. Crear el proyecto de Supabase no actualiza por sí solo la página oficial.

## Dónde se crea el usuario administrador

El alta inicial se realiza en **Supabase**, no en la página pública del taller:

1. Abre **Authentication → Users → Add user → Create new user**.
2. Escribe el correo real autorizado por el propietario.
3. Ingresa tú una contraseña única de al menos 12 caracteres. No la envíes por chat ni la guardes en los archivos.
4. Completa **Create user**. El alta manual con “Auto confirm user?” marcado no envía un correo de confirmación.
5. Autoriza esa cuenta con `supabase/02-autorizar-administrador.sql`, sustituyendo únicamente el correo del ejemplo. Crear una cuenta de Authentication sin ese paso no concede permisos de edición.

No se incluye el correo personal del administrador en los archivos que se subirán al repositorio público. Tampoco se incluyen contraseñas, claves privadas ni códigos del autenticador.

## Primer inicio de sesión

Después de publicar la nueva versión:

1. En la página del taller, baja hasta el pie y pulsa **Administración**. La dirección directa termina en `/admin.html`.
2. Ingresa el correo y la contraseña de la cuenta autorizada.
3. Pulsa **Configurar aplicación autenticadora**.
4. Abre una aplicación compatible en tu teléfono, escanea el QR y escribe el código de seis números.
5. Una vez verificado, se abre el panel. En las entradas siguientes se pide nuevamente el código de la aplicación.

El QR y su clave son privados. Conserva una forma segura de recuperar tu aplicación autenticadora. Si pierdes el teléfono, el propietario debe verificar tu identidad y gestionar el factor desde Supabase; un correo o una contraseña por sí solos no permiten omitir la segunda verificación. [Documentación de MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp).

## Mantener el proyecto sin cargos

Se indicó expresamente que este proyecto no debe generar gastos. Mantén la organización en **Free** y no actives Pro, servicios adicionales de pago, SMS, ramas de desarrollo de Supabase ni transformaciones de imagen en el servidor.

Supabase indica que **no cobra mientras se utiliza el plan Free**. Si se superan sus cuotas, puede restringir el servicio. Los proyectos gratuitos también pueden pausarse por inactividad. No se promete disponibilidad ilimitada: se eligió aceptar las restricciones del plan gratuito en lugar de contratar recursos de pago. [Control de costos](https://supabase.com/docs/guides/platform/cost-control), [límites del plan Free](https://supabase.com/pricing).

Límites instalados en el servidor:

| Recurso | Límite |
| --- | --- |
| Productos, incluidos borradores | 100 |
| Categorías | 20 |
| Foto asociada a cada producto | 1 |
| Fotos almacenadas, incluidas pendientes y antiguas | 120 |
| Tamaño de cada foto guardada | 400 KiB |
| Lado mayor de la foto optimizada por el panel | 1600 píxeles |
| Nombre de producto | 100 caracteres |
| Descripción | 2000 caracteres |
| Código de producto | 60 caracteres |
| Nombre de categoría | 60 caracteres |

Con el máximo de 120 fotos de 400 KiB, el depósito queda por debajo de 47 MiB. El margen de 20 fotos permite reemplazar imágenes cuando ya existen 100 productos. La cuota cuenta también las fotos pendientes, para que los fallos de conexión no acumulen imágenes ilimitadamente.

Las fotos se convierten a WebP en el navegador. No se utiliza el servicio de transformaciones de imagen de Supabase. El código de autenticación se genera en el teléfono y no usa SMS.

Los límites de archivos no limitan la cantidad de visitas. El tráfico consume las cuotas del plan Free; si aumenta mucho, el servicio puede restringirse. No habilites facturación por exceso para resolver una restricción sin una nueva autorización del propietario.

## Recuperar contraseña sin contratar servicios

El envío automático de correos de recuperación está desactivado en la interfaz mediante `passwordRecoveryEnabled: false`. No se contrató un proveedor de correo. Para un problema de acceso, se debe contactar al propietario del proyecto.

El código de recuperación por correo está preparado, pero solo debe activarse después de configurar y comprobar un remitente que respete el requisito de costo cero. El SMTP de prueba de Supabase tiene restricciones para destinatarios externos al equipo. Si se habilita, la recuperación tampoco omite el segundo factor del administrador. [Guía de correo de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

## Archivos de conexión

`config.js` contiene únicamente la URL del proyecto, su clave **publicable**, el número de WhatsApp y una opción de recuperación de contraseña. La clave publicable puede viajar en la página: los permisos de acceso se aplican en la base de datos. Nunca la sustituyas por `service_role`, `sb_secret_`, una contraseña de base de datos o un token personal. [Claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

El archivo `01-instalar.sql` contiene el estado final del esquema. `03-verificar.sql` comprueba las reglas y muestra cuántos administradores hay autorizados. Si muestra cero, el acceso de edición está cerrado hasta autorizar una cuenta.

## Probar antes de publicar

Abre **ABRIR-VISTA-PREVIA.cmd** y conserva abierta su ventana. Después entra a:

- Página: `http://127.0.0.1:4173/`.
- Panel real: `http://127.0.0.1:4173/admin.html`.

Esta copia ya está conectada al proyecto real. No utiliza los productos de ejemplo de la primera entrega. El parámetro `?demo=1` se ignora cuando hay una conexión válida.

Después de crear y autorizar la cuenta, entra, configura el autenticador y crea un producto de prueba como borrador. Comprueba en una ventana privada que no aparezca. Publícalo y recarga esa ventana: debe aparecer. Revisa el precio, la categoría y el enlace de WhatsApp antes de eliminar la prueba.

El cliente revisa y envía el mensaje en WhatsApp. La página no envía mensajes, cobra, reserva stock ni confirma ventas automáticamente.

## Publicación y mantenimiento

El repositorio confirmado es [cofrefrancisco2020-cpu/Adriazola-Vega](https://github.com/cofrefrancisco2020-cpu/Adriazola-Vega). Los archivos de la página se preparan en una rama de revisión. Subirlos a GitHub y publicarlos en el dominio son pasos distintos.

Conserva la estructura de `assets/`, `vendor/` y los HTML/CSS/JS. El sitio publicado es estático y no requiere compilar ni ejecutar Node.js. Para Vercel se incluye `vercel.json`; para Netlify o Cloudflare Pages se incluye `_headers`. El hosting también debe permanecer en un servicio y plan que el propietario haya aprobado expresamente como gratuito.

No necesitas publicar `tests/`, `supabase/`, las guías ni el iniciador de vista previa para servir la web. Pueden conservarse en el repositorio como documentación; no contienen secretos.

Si se agotan las 120 imágenes, revisa las fotos antiguas sin referencia desde Storage. El panel intenta limpiar la anterior al reemplazar o eliminar un producto. Si se corta una conexión, puede quedar una pendiente. Espera al menos 24 horas y confirma que no hay nadie subiendo imágenes antes de borrar una foto huérfana.

Consulta para identificar archivos sin producto:

```sql
select o.name, o.created_at
from storage.objects o
left join public.catalog_products p on p.image_path=o.name
where o.bucket_id='catalog-photos' and p.id is null;
```

Elimina archivos mediante Storage o su API, no borrando filas directamente de `storage.objects`. Conserva respaldos manuales separados de tablas y fotografías. No se contrataron respaldos automáticos ni otros servicios de pago.
