import {api,client} from './catalog-api.js';
import {el,imageNode,PLACEHOLDER,money,normalize,validateProduct,optimizeImage,friendlyError} from './catalog-core.js';
import {securityState,enrollAuthenticator,verifyAuthenticator,qrSource} from './catalog-security.js';
import {attachTeam} from './catalog-team.js';
import {attachPhoneChange} from './catalog-phone.js';
const $=id=>document.getElementById(id);
const demo=!client && new URLSearchParams(location.search).get('demo')==='1';
let backend=api,state={products:[],categories:[],settings:{max_products:100,max_categories:20}},selectedCategory='',editing=null,editingCategory=null;
let busy=false,dirty=false,photo=null,removeImage=false,photoTicket=0,processingPhoto=false,previewUrl=null,confirmAction=null;
let mfaFactorId=null,entryInProgress=false,recovering=false;
let lastActivity=Number(sessionStorage.getItem('adriazola-last-activity'))||Date.now();
const toast=(message,error=false)=>{ $('toast').textContent=message;$('toast').classList.toggle('error',error);$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,error?12000:5000);};
const team=attachTeam({client,toast,demo});
const phone=attachPhoneChange({client,demo,onComplete:()=>setAccess('Teléfono actualizado. Inicia sesión y usa el código del nuevo teléfono.')});
function clearMfa(){mfaFactorId=null;$('mfa-code').value='';$('mfa-secret').value='';$('mfa-qr').removeAttribute('src');$('mfa-error').textContent='';$('mfa-enrollment').hidden=true;}
const setAccess=message=>{clearMfa();team.clear();phone.clear();recovering=false;$('security-card').hidden=true;$('dashboard').hidden=true;$('access').hidden=false;$('logout').hidden=true;$('access-message').textContent=message||'';state.products=[];state.categories=[];for(const d of document.querySelectorAll('dialog[open]'))d.close();};
function activity(){lastActivity=Date.now();sessionStorage.setItem('adriazola-last-activity',String(lastActivity));}
async function expire(){await client?.auth.signOut({scope:'local'});setAccess('La sesión se cerró por inactividad. Inicia sesión otra vez.');}
function lock(value){busy=value;$('dashboard').classList.toggle('is-busy',value);$('product-list').setAttribute('aria-busy',String(value));document.querySelectorAll('#dashboard button,#dashboard select,#category-manager button').forEach(b=>b.disabled=value);if(!value)render();}
async function refresh(){
  state=await backend.load();
  if(selectedCategory&&!state.categories.some(c=>c.id===selectedCategory))selectedCategory='';
  render();
}
async function mutate(action,message){
  if(busy)return;
  if(!demo&&Date.now()-lastActivity>30*60*1000){await expire();return;}
  lock(true);
  try{await action();toast(message);try{await refresh();}catch{toast('El cambio se guardó, pero no pudimos actualizar la lista. Pulsa “Actualizar”.',true);}}
  catch(error){toast(friendlyError(error),true);}
  finally{lock(false);}
}
function button(text,fn,attrs={}){return el('button',{type:'button',class:'icon-btn',onclick:fn,...attrs},text);}
function render(){
  const {products,categories,settings}=state;
  const published=products.filter(p=>p.published).length;
  $('stat-total').textContent=`${products.length} / ${settings.max_products}`;$('stat-published').textContent=published;$('stat-drafts').textContent=products.length-published;$('stat-categories').textContent=`${categories.length} / ${settings.max_categories}`;
  $('capacity').max=settings.max_products;$('capacity').value=products.length;
  $('new-product').disabled=busy||products.length>=settings.max_products;
  $('new-category').disabled=busy||categories.length>=settings.max_categories;
  $('products-heading').textContent=categories.find(c=>c.id===selectedCategory)?.name||'Todos los productos';
  const categoryButton=(category)=>{
    const id=category?.id||'';const count=products.filter(p=>!id||p.category_id===id).length;
    const node=el('button',{type:'button',class:'category-button'+(selectedCategory===id?' active':''),'aria-pressed':selectedCategory===id,onclick:()=>{selectedCategory=id;render();}},el('span',{},category?.name||'Todos los productos'),el('b',{},String(count)));
    if(id){node.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('text/plain')){e.preventDefault();node.classList.add('drop-target');}});node.addEventListener('dragleave',()=>node.classList.remove('drop-target'));node.addEventListener('drop',e=>{e.preventDefault();node.classList.remove('drop-target');const product=products.find(p=>p.id===e.dataTransfer.getData('text/plain'));if(product)moveProduct(product,id);});}
    return node;
  };
  $('category-list').replaceChildren(categoryButton(null),...categories.map(categoryButton));
  const query=normalize($('product-search').value),filter=$('status-filter').value;
  const visible=products.filter(p=>(!selectedCategory||p.category_id===selectedCategory)&&normalize(`${p.name} ${p.sku} ${p.description}`).includes(query)&&(filter==='all'||filter==='published'&&p.published||filter==='draft'&&!p.published||filter==='out'&&!p.in_stock));
  $('product-count').textContent=`${visible.length} ${visible.length===1?'producto':'productos'}${query||selectedCategory||filter!=='all'?' en esta vista':''}`;
  $('product-list').replaceChildren(...visible.map((p,i)=>productRow(p,visible,i)));
  if(!visible.length)$('product-list').append(el('div',{class:'empty-state'},el('span',{class:'empty-symbol','aria-hidden':'true'},'＋'),el('h3',{},products.length?'No encontramos productos':'Tu primer producto empieza aquí'),el('p',{},products.length?'Prueba otra búsqueda o elige otra categoría.':'Agrega una foto, un nombre y una descripción. Puedes guardarlo como borrador antes de publicarlo.'),!products.length?el('button',{class:'btn primary',onclick:()=>openProduct()},'Agregar producto'):null));
  renderCategoryManager();
}
function productRow(p,visible,index){
  const handle=button('⠿',()=>{}, {class:'drag-handle',draggable:true,'aria-label':`Arrastrar ${p.name}`,title:'Arrastrar para ordenar'});
  handle.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',p.id);e.dataTransfer.effectAllowed='move';});
  const cat=el('select',{'aria-label':`Mover ${p.name} a otra categoría`,onchange:e=>moveProduct(p,e.target.value)},...state.categories.map(c=>el('option',{value:c.id},c.name)));cat.value=p.category_id;
  const row=el('article',{class:'product-row','data-product-id':p.id},handle,imageNode(p.image_url,p.name),
    el('div',{class:'product-copy'},el('div',{class:'product-badges'},el('span',{class:'badge '+(p.published?'published':'draft')},p.published?'Publicado':'Borrador'),!p.in_stock?el('span',{class:'badge out'},'Sin stock'):null),el('h3',{},p.name),el('span',{class:'product-sku'},p.sku||'Sin código'),el('strong',{class:'product-price'},money(p.price)),el('label',{class:'move-label'},'Mover a',cat)),
    el('div',{class:'row-actions'},el('div',{class:'order-buttons'},button('↑',()=>reorderRelative(p.id,visible[index-1]?.id),{'aria-label':`Subir ${p.name}`,...index===0?{disabled:true}:{}}),button('↓',()=>reorderRelative(p.id,visible[index+1]?.id,true),{'aria-label':`Bajar ${p.name}`,...index===visible.length-1?{disabled:true}:{}})),
      el('button',{class:'btn subtle',onclick:()=>openProduct(p)},'Editar'),button(p.published?'◉':'○',()=>togglePublication(p),{'aria-label':`${p.published?'Ocultar':'Publicar'} ${p.name}`,title:p.published?'Guardar como borrador':'Publicar producto'}),button('×',()=>askDelete(`Eliminar “${p.name}”`,`Se eliminará este producto del catálogo y dejará de aparecer en la página.`,()=>deleteProduct(p)),{class:'icon-btn delete-btn','aria-label':`Eliminar ${p.name}`})));
  row.addEventListener('dragover',e=>{e.preventDefault();row.classList.add('drop-target');});row.addEventListener('dragleave',()=>row.classList.remove('drop-target'));row.addEventListener('drop',e=>{e.preventDefault();row.classList.remove('drop-target');reorderRelative(e.dataTransfer.getData('text/plain'),p.id);});
  return row;
}
function moveProduct(p,categoryId){if(p.category_id!==categoryId)mutate(()=>backend.saveProduct({...p,category_id:categoryId},p.updated_at),'Producto movido a otra categoría.');}
function togglePublication(p){if(!p.published&&!p.image_path){toast('Agrega una foto antes de publicar el producto.',true);openProduct(p);return;}mutate(()=>backend.saveProduct({...p,published:!p.published},p.updated_at),p.published?'Producto guardado como borrador.':'Producto publicado.');}
function reorderRelative(id,target,after=false,kind='products'){
  if(!target||id===target||!state[kind].some(p=>p.id===id))return;
  const ids=state[kind].map(x=>x.id).filter(x=>x!==id);const at=ids.indexOf(target);if(at<0)return;ids.splice(at+(after?1:0),0,id);
  mutate(()=>backend.reorder(kind,ids),'Orden actualizado.');
}
function renderCategoryManager(){
  $('category-manager').replaceChildren(...state.categories.map((c,i)=>el('div',{class:'category-manager-row'},el('div',{},el('strong',{},c.name),el('small',{},`${state.products.filter(p=>p.category_id===c.id).length} productos`)),
    button('↑',()=>reorderRelative(c.id,state.categories[i-1]?.id,false,'categories'),{'aria-label':`Subir categoría ${c.name}`,...i===0?{disabled:true}:{}}),
    button('↓',()=>reorderRelative(c.id,state.categories[i+1]?.id,true,'categories'),{'aria-label':`Bajar categoría ${c.name}`,...i===state.categories.length-1?{disabled:true}:{}}),
    button('Editar',()=>openCategory(c),{class:'text-btn','aria-label':`Editar categoría ${c.name}`}),button('×',()=>{
      if(state.products.some(p=>p.category_id===c.id)){toast('Mueve los productos a otra categoría antes de eliminar esta.',true);return;}
      askDelete(`Eliminar “${c.name}”`,'Se eliminará esta categoría vacía.',()=>mutate(()=>backend.deleteCategory(c.id,c.updated_at),'Categoría eliminada.'));
    },{class:'icon-btn delete-btn','aria-label':`Eliminar categoría ${c.name}`}))));
}
function askDelete(title,message,action){if(busy)return;confirmAction=action;$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-dialog').showModal();$('confirm-cancel').focus();}
async function deleteProduct(p){let cleanupFailed=false;await mutate(async()=>{const path=await backend.deleteProduct(p.id,p.updated_at);try{await backend.removePhoto(path);}catch{cleanupFailed=true;}},'Producto eliminado.');if(cleanupFailed)toast('Producto eliminado. La foto antigua quedó pendiente de limpieza.',true);}
function releasePreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}}
function openProduct(p=null){
  if(busy)return;
  if(!state.categories.length){toast('Primero crea una categoría para tu producto.');openCategory();return;}
  editing=p;photo=null;removeImage=false;dirty=false;processingPhoto=false;photoTicket++;releasePreview();$('product-form').reset();$('product-error').textContent='';$('photo-info').textContent='Hasta 15 MB de origen · máximo 400 KB al guardar.';$('product-title').textContent=p?'Editar producto':'Agregar producto';
  $('product-name').value=p?.name||'';$('product-description').value=p?.description||'';$('product-sku').value=p?.sku||'';$('product-price').value=p?.price??'';$('product-stock').checked=p?.in_stock??true;$('product-published').checked=p?.published??false;
  $('product-category').replaceChildren(...state.categories.map(c=>el('option',{value:c.id},c.name)));$('product-category').value=p?.category_id||selectedCategory||state.categories[0].id;
  $('photo-preview').src=p?.image_url||PLACEHOLDER;$('save-product').disabled=false;$('product-dialog').showModal();
}
async function choosePhoto(file){
  if(!file)return;const ticket=++photoTicket;processingPhoto=true;$('save-product').disabled=true;$('photo-info').textContent='Preparando tu foto…';
  try{const optimized=await optimizeImage(file);if(ticket!==photoTicket)return;photo=optimized.blob;removeImage=false;dirty=true;releasePreview();previewUrl=URL.createObjectURL(photo);$('photo-preview').src=previewUrl;$('photo-info').textContent=`Lista en WebP · ${Math.ceil(photo.size/1024)} KB · ${optimized.width} × ${optimized.height} px`;$('product-error').textContent='';}
  catch(error){if(ticket===photoTicket){$('photo-info').textContent=error.message;$('product-error').textContent=error.message;}}
  finally{if(ticket===photoTicket){processingPhoto=false;$('save-product').disabled=false;}}
}
function closeDialog(id){
  if(id==='category-dialog'&&$('category-form').dataset.saving==='true')return;
  if(id==='product-dialog'){
    if($('product-form').dataset.saving==='true')return;
    if(dirty&&!confirm('Tienes cambios sin guardar. ¿Quieres descartarlos?'))return;
    photoTicket++;processingPhoto=false;releasePreview();dirty=false;
  }
  $(id).close();
}
async function saveProduct(event){
  event.preventDefault();if(processingPhoto||$('product-form').dataset.saving==='true')return;
  let product;
  try{product=validateProduct({id:editing?.id||null,name:$('product-name').value,description:$('product-description').value,sku:$('product-sku').value,category_id:$('product-category').value,price:$('product-price').value===''?null:Number($('product-price').value),published:$('product-published').checked,in_stock:$('product-stock').checked,image_path:removeImage?null:editing?.image_path||null});if(product.published&&!photo&&!product.image_path)throw new Error('Agrega una foto antes de publicar. También puedes guardarlo como borrador.');}
  catch(error){$('product-error').textContent=error.message;return;}
  let uploaded=null,saved=false;$('product-form').dataset.saving='true';$('product-form').querySelectorAll('input,textarea,select,button').forEach(n=>n.disabled=true);$('save-product').textContent='Guardando…';$('product-error').textContent='';
  try{
    if(photo){uploaded=await backend.uploadPhoto(photo);product.image_path=uploaded;}
    await backend.saveProduct(product,editing?.updated_at);saved=true;
    const old=editing?.image_path;dirty=false;$('product-dialog').close();releasePreview();
    let cleanupFailed=false;if(old&&old!==product.image_path){try{await backend.removePhoto(old);}catch{cleanupFailed=true;}}
    toast(cleanupFailed?'Producto guardado. La foto antigua quedó pendiente de limpieza.':product.published?'Producto guardado y publicado.':'Producto guardado como borrador.',cleanupFailed);
    try{await refresh();}catch{toast('Producto guardado. No pudimos actualizar la lista; pulsa “Actualizar”.',true);}
  }catch(error){if(uploaded&&!saved){try{await backend.removePhoto(uploaded);}catch{toast('La foto quedó pendiente de limpieza. Puedes volver a intentar guardar.',true);}}$('product-error').textContent=friendlyError(error);}
  finally{$('product-form').dataset.saving='false';$('product-form').querySelectorAll('input,textarea,select,button').forEach(n=>n.disabled=false);$('save-product').textContent='Guardar producto';}
}
function openCategory(c=null){if(busy||$('category-form').dataset.saving==='true')return;editingCategory=c;$('category-title').textContent=c?'Editar categoría':'Crear categoría';$('category-name').value=c?.name||'';$('category-error').textContent='';$('category-dialog').showModal();}
$('category-form').addEventListener('submit',async e=>{e.preventDefault();if($('category-form').dataset.saving==='true')return;const category={id:editingCategory?.id,name:$('category-name').value},expected=editingCategory?.updated_at;$('category-form').dataset.saving='true';$('category-form').querySelectorAll('input,button').forEach(n=>n.disabled=true);try{await backend.saveCategory(category,expected);$('category-dialog').close();toast('Categoría guardada.');try{await refresh();}catch{toast('Categoría guardada. Pulsa “Actualizar” para recargar la lista.',true);}}catch(error){$('category-error').textContent=friendlyError(error);}finally{$('category-form').dataset.saving='false';$('category-form').querySelectorAll('input,button').forEach(n=>n.disabled=false);}});
$('category-dialog').addEventListener('cancel',e=>{if($('category-form').dataset.saving==='true')e.preventDefault();});
$('product-form').addEventListener('submit',saveProduct);$('product-form').addEventListener('input',()=>dirty=true);
$('photo').addEventListener('change',e=>choosePhoto(e.target.files[0]));
$('photo-drop').addEventListener('dragover',e=>{e.preventDefault();$('photo-drop').classList.add('drop-target');});$('photo-drop').addEventListener('dragleave',()=>$('photo-drop').classList.remove('drop-target'));$('photo-drop').addEventListener('drop',e=>{e.preventDefault();$('photo-drop').classList.remove('drop-target');choosePhoto(e.dataTransfer.files[0]);});
$('remove-photo').addEventListener('click',()=>{photoTicket++;photo=null;removeImage=true;dirty=true;processingPhoto=false;releasePreview();$('photo').value='';$('photo-preview').src=PLACEHOLDER;$('photo-info').textContent='Sin foto. Agrega una para publicar el producto.';$('save-product').disabled=false;});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
$('product-dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog('product-dialog');});
$('new-product').addEventListener('click',()=>openProduct());$('new-category').addEventListener('click',()=>openCategory());$('manage-categories').addEventListener('click',()=>$('categories-dialog').showModal());
$('product-search').addEventListener('input',render);$('status-filter').addEventListener('change',render);$('refresh').addEventListener('click',()=>mutate(async()=>{},'Catálogo actualizado.'));
$('confirm-cancel').addEventListener('click',()=>$('confirm-dialog').close());$('confirm-delete').addEventListener('click',()=>{$('confirm-dialog').close();confirmAction?.();confirmAction=null;});
$('show-password').addEventListener('click',()=>{const show=$('password').type==='password';$('password').type=show?'text':'password';$('show-password').textContent=show?'Ocultar':'Mostrar';$('show-password').setAttribute('aria-pressed',String(show));$('show-password').setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');});
function showMfa(access){
  clearMfa();$('access').hidden=true;$('dashboard').hidden=true;$('security-card').hidden=false;$('logout').hidden=false;$('password').value='';
  const enrolled=access.factors.length>0;
  $('mfa-enroll-start').hidden=enrolled;$('mfa-form').hidden=!enrolled;$('mfa-factor-label').hidden=access.factors.length<2;
  $('security-instruction').textContent=enrolled?'Abre tu aplicación autenticadora e ingresa el código de seis números.':'Esta cuenta está autorizada. Falta configurar su segundo paso de seguridad.';
  $('mfa-factor').replaceChildren(...access.factors.map((f,i)=>el('option',{value:f.id},f.friendly_name||`Aplicación ${i+1}`)));
  mfaFactorId=access.factors[0]?.id||null;activity();if(enrolled)$('mfa-code').focus();
}
async function enterDashboard(){
  if(entryInProgress)return;entryInProgress=true;
  try{
    if(!demo){
      const access=await securityState(client,()=>api.isMember());
      if(!access.authorized){await client.auth.signOut({scope:'local'});setAccess('Esta cuenta no tiene autorización para administrar el catálogo.');return;}
      if(!access.verified){showMfa(access);return;}
    }
    if(!await backend.isAdmin())throw new Error('NO_AUTORIZADO');
    clearMfa();$('security-card').hidden=true;$('password').value='';
    if(recovering){$('access').hidden=true;$('dashboard').hidden=true;$('logout').hidden=false;if(!$('password-dialog').open)$('password-dialog').showModal();activity();return;}
    await refresh();$('access').hidden=true;$('dashboard').hidden=false;$('logout').hidden=demo;activity();team.load();
  }finally{entryInProgress=false;}
}
$('mfa-enroll').addEventListener('click',async()=>{
  const button=$('mfa-enroll');button.disabled=true;$('mfa-error').textContent='';
  try{const factor=await enrollAuthenticator(client);mfaFactorId=factor.id;$('mfa-qr').src=qrSource(factor.totp.qr_code);$('mfa-secret').value=factor.totp.secret;$('mfa-enroll-start').hidden=true;$('mfa-enrollment').hidden=false;$('mfa-form').hidden=false;$('mfa-code').focus();activity();}
  catch(error){$('mfa-error').textContent=friendlyError(error);}finally{button.disabled=false;}
});
$('mfa-factor').addEventListener('change',()=>{mfaFactorId=$('mfa-factor').value;$('mfa-code').value='';});
$('mfa-form').addEventListener('submit',async e=>{
  e.preventDefault();const submit=e.submitter||$('mfa-form').querySelector('button');if(submit.disabled)return;submit.disabled=true;$('mfa-error').textContent='';
  try{await verifyAuthenticator(client,mfaFactorId,$('mfa-code').value.trim());await enterDashboard();}
  catch(error){$('mfa-error').textContent=friendlyError(error);$('mfa-code').value='';$('mfa-code').focus();}finally{submit.disabled=false;}
});
$('login-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!client)return;const submit=e.submitter;submit.disabled=true;$('access-message').textContent='Comprobando acceso…';
  try{const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error)throw error;await enterDashboard();}
  catch(error){$('access-message').textContent=friendlyError(error);}finally{submit.disabled=false;}
});
$('logout').addEventListener('click',async()=>{
  const {error}=await client.auth.signOut({scope:'local'});if(error)toast('La sesión se cerrará localmente. Si cambiaste de equipo, revisa tus sesiones en Supabase.',true);
  setAccess('Sesión cerrada.');
});
for(const [tab,panel] of [['tab-catalog','catalog-workspace'],['tab-team','team-section']])$(tab).addEventListener('click',()=>{
  const isCatalog=panel==='catalog-workspace';$('catalog-workspace').hidden=!isCatalog;$('team-section').hidden=isCatalog;
  $('tab-catalog').setAttribute('aria-pressed',String(isCatalog));$('tab-team').setAttribute('aria-pressed',String(!isCatalog));$('new-product').hidden=!isCatalog;
  if(!isCatalog)team.load();
});
$('forgot-password').addEventListener('click',async()=>{
  if(!$('email').reportValidity())return;const btn=$('forgot-password');btn.disabled=true;
  try{const url=new URL('./admin.html',location.href);const {error}=await client.auth.resetPasswordForEmail($('email').value.trim(),{redirectTo:url.href});if(error)throw error;$('access-message').textContent='Si el correo corresponde a una cuenta, recibirás un enlace para cambiar tu contraseña. Ábrelo en este mismo navegador.';}
  catch(error){$('access-message').textContent=friendlyError(error);}finally{btn.disabled=false;}
});
$('password-form').addEventListener('submit',async e=>{
  e.preventDefault();if($('new-password').value!==$('repeat-password').value){$('password-error').textContent='Las contraseñas no coinciden.';return;}
  e.submitter.disabled=true;
  try{const {error}=await client.auth.updateUser({password:$('new-password').value});if(error)throw error;$('password-form').reset();$('password-dialog').close();await client.auth.signOut({scope:'local'});setAccess('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');}
  catch(error){$('password-error').textContent=friendlyError(error);}finally{e.submitter.disabled=false;}
});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{if(!$('dashboard').hidden||!$('security-card').hidden)activity();},{passive:true});
window.addEventListener('beforeunload',e=>{if(dirty||$('product-form').dataset.saving==='true'){e.preventDefault();e.returnValue='';}});
setInterval(()=>{if(!demo&&(!$('dashboard').hidden||!$('security-card').hidden||$('password-dialog').open)&&Date.now()-lastActivity>30*60*1000)expire();},30000);
async function init(){
  if(demo){backend=(await import('./catalog-demo.js')).demoApi;$('demo-banner').hidden=false;await enterDashboard();return;}
  if(!client){$('login-form').hidden=true;$('setup-note').hidden=false;return;}
  $('forgot-password').hidden=!window.ADRIAZOLA_CONFIG?.passwordRecoveryEnabled;$('recovery-note').hidden=Boolean(window.ADRIAZOLA_CONFIG?.passwordRecoveryEnabled);
  client.auth.onAuthStateChange((event)=>{
    // No se esperan llamadas a Auth dentro de su propio callback.
    if(event==='SIGNED_OUT')setAccess('Sesión cerrada.');
    if(event==='PASSWORD_RECOVERY'){recovering=true;setTimeout(()=>{enterDashboard().catch(error=>setAccess(friendlyError(error)));},0);}
  });
  const {data,error}=await client.auth.getSession();if(error)throw error;
  if(data.session){if(!recovering&&Date.now()-lastActivity>30*60*1000){await expire();return;}await enterDashboard();}
}
init().catch(error=>{setAccess(friendlyError(error));});
