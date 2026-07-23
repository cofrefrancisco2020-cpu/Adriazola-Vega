# Adriazola & Vegas — versión 1

Sitio web estático para el taller mecánico Adriazola & Vegas de Coyhaique.

## Archivos

- `index.html`: contenido y estructura.
- `styles.css`: diseño responsive y animaciones.
- `script.js`: menú móvil, formulario de WhatsApp y apariciones al hacer scroll.
- `brief-marca.md`: investigación, fuentes y decisiones.
- `vercel.json`: configuración básica para Vercel.
- `assets/`: todos los recursos finales, sin subcarpetas.

## Abrir localmente

Puede abrirse directamente con doble clic en `index.html`. Para probar mapa,
animaciones y enlaces en condiciones similares a producción, conviene usar un
servidor local:

```bash
npx serve .
```

## Subir a GitHub

1. Crear un repositorio vacío.
2. Subir el contenido de esta carpeta `version 1` a la raíz del repositorio.
3. Confirmar que `index.html` quede en la raíz.

## Desplegar en Vercel

1. En Vercel, elegir **Add New → Project**.
2. Importar el repositorio de GitHub.
3. Seleccionar **Framework Preset: Other**.
4. Dejar vacío el comando de compilación.
5. Usar `.` como directorio de salida si Vercel lo solicita.
6. Pulsar **Deploy**.

La web no necesita instalar dependencias ni ejecutar una compilación.

## Fotografías

Se utilizaron fotografías reales del taller y su trabajo. Las imágenes marcadas
con `-ai` fueron tratadas con IA para mejorar luz, nitidez, encuadre y limpieza
visual. No se crearon reseñas, clientes ni cifras de confianza falsas.
