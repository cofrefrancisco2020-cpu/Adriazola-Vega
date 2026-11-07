export const PLACEHOLDER = './assets/product-placeholder.svg';
export const money = value => value === null || value === '' || value === undefined
  ? 'Consultar precio' : new Intl.NumberFormat('es-CL', {style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value);
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function productLink(id, base=location.href) {
  const url=new URL(base); url.pathname=url.pathname.replace(/admin\.html$/, 'index.html');
  url.search=''; url.searchParams.set('producto',id); url.hash='catalogo'; return url.href;
}
export function whatsappLink(product,phone,base) {
  if(!/^\d{8,15}$/.test(phone)) throw new Error('Número de WhatsApp inválido.');
  const message=`Hola, quisiera consultar la disponibilidad de este producto de Adriazola 4WD:\n\n${product.name}${product.sku ? '\nCódigo: '+product.sku : ''}\nPrecio publicado: ${money(product.price)}\n${productLink(product.id,base)}\n\n¿Me pueden confirmar compatibilidad y disponibilidad?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
export function validateProduct(p) {
  if(!p.name?.trim() || p.name.trim().length>100) throw new Error('Escribe un nombre de hasta 100 caracteres.');
  if(!p.description?.trim() || p.description.trim().length>2000) throw new Error('Escribe una descripción de hasta 2.000 caracteres.');
  if(!p.category_id) throw new Error('Selecciona una categoría.');
  if(p.price!==null && (!Number.isSafeInteger(p.price)||p.price<0||p.price>999999999)) throw new Error('El precio debe ser un número entero entre 0 y 999.999.999 pesos.');
  if((p.sku||'').length>60) throw new Error('El código admite hasta 60 caracteres.');
  return {...p,name:p.name.trim(),description:p.description.trim(),sku:(p.sku||'').trim()};
}
export function el(tag,attrs={},...children) {
  const node=document.createElement(tag);
  for(const [key,value] of Object.entries(attrs)) {
    if(key==='class')node.className=value;
    else if(key==='text')node.textContent=value;
    else if(key.startsWith('on'))node.addEventListener(key.slice(2),value);
    else if(value!==undefined&&value!==null)node.setAttribute(key,String(value));
  }
  for(const child of children.flat())if(child!==null&&child!==undefined)node.append(child);
  return node;
}
export function safeImage(url) {
  if(!url)return PLACEHOLDER;
  try {const u=new URL(url,location.href);return ['https:','http:','blob:'].includes(u.protocol)?u.href:PLACEHOLDER;}catch{return PLACEHOLDER;}
}
export function imageNode(src,alt,attrs={}) {
  const node=el('img',{src:safeImage(src),alt,loading:'lazy',...attrs});
  node.addEventListener('error',()=>{node.src=PLACEHOLDER;},{once:true});return node;
}
export async function optimizeImage(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Elige una foto JPG, PNG o WebP. Si está en HEIC, expórtala como JPG.');
  if(file.size>15*1024*1024)throw new Error('La foto original debe pesar menos de 15 MB.');
  let bitmap;
  try {bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw new Error('No se pudo abrir la foto. Prueba con otra imagen JPG o PNG.');}
  try {
    if(bitmap.width*bitmap.height>50000000)throw new Error('La foto es demasiado grande. Usa una imagen de hasta 50 megapíxeles.');
    let max=1600;
    for(let attempt=0;attempt<4;attempt++){
      const ratio=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
      const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      for(const quality of [.84,.74,.64]){
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
        if(!blob||blob.type!=='image/webp')throw new Error('Tu navegador no permite convertir a WebP. Usa Chrome, Edge, Firefox o Safari actualizado.');
        if(blob.size<=400*1024)return {blob,width:canvas.width,height:canvas.height,originalSize:file.size};
      }
      max=Math.round(max*.75);
    }
    throw new Error('No se pudo reducir la foto a 400 KB. Prueba con una foto más sencilla.');
  } finally {bitmap.close();}
}
export function friendlyError(error) {
  const msg=String(error?.message||error||'');
  if(/CODIGO_MFA_INVALIDO|mfa_verification_failed|invalid.*totp|invalid.*code/i.test(msg+' '+(error?.code||'')))return 'El código no coincide o ya venció. Usa el código actual de tu aplicación y verifica que la hora del teléfono sea automática.';
  if(/LIMITE_PRODUCTOS/.test(msg))return 'Llegaste al límite de productos. Elimina uno antes de agregar otro.';
  if(/LIMITE_CATEGORIAS/.test(msg))return 'Llegaste al límite de categorías. Elimina una vacía antes de crear otra.';
  if(/LIMITE_IMAGENES/.test(msg))return 'Llegaste al máximo de 120 fotos almacenadas. Elimina productos que no uses o pide limpiar las fotos antiguas sin producto.';
  if(/CATEGORIA_CON_PRODUCTOS|23503/.test(msg))return 'Esta categoría tiene productos. Muévelos a otra antes de eliminarla.';
  if(/CONFLICTO_EDICION/.test(msg))return 'Este elemento cambió en otra sesión. Cierra el formulario, actualiza el catálogo y vuelve a editarlo.';
  if(/23505/.test(error?.code||msg))return 'Ya existe una categoría con ese nombre.';
  if(/NO_AUTORIZADO|42501|JWT|refresh.token|session.*missing/i.test(msg))return 'Tu acceso no está autorizado o la sesión venció. Vuelve a iniciar sesión.';
  if(/Failed to fetch|NetworkError|network|Load failed/i.test(msg))return 'No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.';
  if(/Invalid login credentials/i.test(msg))return 'No pudimos iniciar sesión. Revisa tu correo y contraseña.';
  if(/Email rate limit|rate limit|Too many requests/i.test(msg))return 'Hay demasiados intentos. Espera unos minutos y vuelve a probar.';
  if(/23514|22P02|VALIDACION/.test(error?.code||msg))return 'Revisa los campos: el nombre, la descripción, la categoría y el precio deben ser válidos.';
  return 'No se pudo completar la operación. Inténtalo de nuevo; si continúa, contacta a quien administra la página.';
}
