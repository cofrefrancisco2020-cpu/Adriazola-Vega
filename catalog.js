import {api,client} from './catalog-api.js';
import {el,imageNode,money,normalize,whatsappLink} from './catalog-core.js';
const $=id=>document.getElementById(id);
const copy={
  es:{nav:'Catálogo',kicker:'Repuestos · equipamiento · accesorios',title:'Encuentra lo que<br>tu vehículo necesita.',intro:'Explora nuestros productos y consulta disponibilidad o compatibilidad directamente con el taller.',search:'Buscar producto o código…',all:'Todas las categorías',count:n=>`${n} ${n===1?'producto':'productos'}`,details:'Ver producto',ask:'Consultar por WhatsApp ↗',available:'Consultar disponibilidad',out:'Sin stock · consulta alternativas',soon:'Estamos preparando nuestro catálogo.',soonText:'Mientras tanto, escríbenos y te ayudamos a encontrar lo que necesitas.',empty:'No encontramos productos.',emptyText:'Prueba otra búsqueda o selecciona otra categoría.',fail:'No pudimos cargar el catálogo.',failText:'Vuelve a intentarlo o consulta directamente con el taller.',retry:'Volver a intentar',close:'Cerrar producto',code:'Código',note:'Confirma disponibilidad, compatibilidad y precio final con el taller. La compra se coordina por WhatsApp.',missing:'Este producto ya no está disponible en el catálogo.',clear:'Limpiar filtros',consult:'Consultar precio'},
  en:{nav:'Catalog',kicker:'Parts · equipment · accessories',title:'Find what your<br>vehicle needs.',intro:'Browse our products and ask the workshop about availability and compatibility.',search:'Search product or code…',all:'All categories',count:n=>`${n} ${n===1?'product':'products'}`,details:'View product',ask:'Ask on WhatsApp ↗',available:'Ask about availability',out:'Out of stock · ask for alternatives',soon:'Our catalog is coming soon.',soonText:'In the meantime, contact us and we will help you find what you need.',empty:'No products found.',emptyText:'Try a different search or choose another category.',fail:'We could not load the catalog.',failText:'Try again or contact the workshop.',retry:'Try again',close:'Close product',code:'Code',note:'Confirm availability, compatibility and final price with the workshop. Purchases are arranged on WhatsApp.',missing:'This product is no longer available in the catalog.',clear:'Clear filters',consult:'Ask for price'},
  de:{nav:'Katalog',kicker:'Ersatzteile · Ausrüstung · Zubehör',title:'Finde, was dein<br>Fahrzeug braucht.',intro:'Entdecke unsere Produkte und frage die Werkstatt nach Verfügbarkeit und Kompatibilität.',search:'Produkt oder Artikelnummer suchen…',all:'Alle Kategorien',count:n=>`${n} ${n===1?'Produkt':'Produkte'}`,details:'Produkt ansehen',ask:'Per WhatsApp anfragen ↗',available:'Verfügbarkeit anfragen',out:'Nicht auf Lager · Alternativen anfragen',soon:'Unser Katalog ist bald verfügbar.',soonText:'Kontaktiere uns, damit wir dir helfen können, das passende Produkt zu finden.',empty:'Keine Produkte gefunden.',emptyText:'Versuche eine andere Suche oder Kategorie.',fail:'Der Katalog konnte nicht geladen werden.',failText:'Versuche es erneut oder kontaktiere die Werkstatt.',retry:'Erneut versuchen',close:'Produkt schließen',code:'Artikelnummer',note:'Bestätige Verfügbarkeit, Kompatibilität und Endpreis mit der Werkstatt. Der Kauf wird über WhatsApp vereinbart.',missing:'Dieses Produkt ist nicht mehr im Katalog verfügbar.',clear:'Filter zurücksetzen',consult:'Preis anfragen'}
};
let products=[],categories=[],loadState='loading',detailProduct=null;
const t=()=>copy[document.documentElement.lang]||copy.es;
const price=p=>p.price===null?t().consult:money(p.price);
function whatsapp(p){return whatsappLink(p,window.ADRIAZOLA_CONFIG?.whatsapp||'56984484274');}
function displayEmpty(title,text,retry=false){
  $('catalog-grid').replaceChildren(el('div',{class:'catalog-empty'},el('span',{'aria-hidden':'true'},'⌕'),el('h3',{},title),el('p',{},text),retry?el('button',{type:'button',class:'catalog-secondary',onclick:load},t().retry):null,el('a',{href:`https://wa.me/${window.ADRIAZOLA_CONFIG?.whatsapp||'56984484274'}`,class:'catalog-ask',target:'_blank',rel:'noopener noreferrer'},t().ask)));
}
function render(){
  const c=t();document.querySelectorAll('.catalog-nav').forEach(n=>n.textContent=c.nav);
  $('catalog-kicker').textContent=c.kicker;$('catalog-title').innerHTML=c.title;$('catalog-intro').textContent=c.intro;$('catalog-search').placeholder=c.search;$('catalog-search').setAttribute('aria-label',c.search);$('catalog-category').setAttribute('aria-label',c.all);$('catalog-clear').textContent=c.clear;$('catalog-note').textContent=c.note;
  const selected=$('catalog-category').value||'';
  $('catalog-category').replaceChildren(el('option',{value:''},c.all),...categories.map(cat=>el('option',{value:cat.id},cat.name)));$('catalog-category').value=selected;
  if(loadState==='loading'){$('catalog-count').textContent='…';return;}
  if(loadState==='error'){$('catalog-count').textContent='';displayEmpty(c.fail,c.failText,true);return;}
  if(!products.length){$('catalog-count').textContent='';displayEmpty(c.soon,c.soonText);return;}
  const query=normalize($('catalog-search').value),category=$('catalog-category').value;
  const visible=products.filter(p=>(!category||p.category_id===category)&&normalize(`${p.name} ${p.sku} ${p.description}`).includes(query));
  $('catalog-count').textContent=c.count(visible.length);$('catalog-clear').hidden=!query&&!category;
  if(!visible.length){displayEmpty(c.empty,c.emptyText);return;}
  $('catalog-grid').replaceChildren(...visible.map(p=>el('article',{class:'catalog-card'},
    el('button',{type:'button',class:'catalog-image','aria-label':`${c.details}: ${p.name}`,onclick:()=>openDetail(p)},imageNode(p.image_url,p.name,{width:640,height:480})),
    el('div',{class:'catalog-card-body'},el('p',{class:'catalog-category-name'},categories.find(cat=>cat.id===p.category_id)?.name||''),el('h3',{},el('button',{type:'button',onclick:()=>openDetail(p)},p.name)),el('p',{class:'catalog-description'},p.description),el('strong',{class:'catalog-price'},price(p)),el('span',{class:'catalog-stock'+(!p.in_stock?' is-out':'')},p.in_stock?c.available:c.out),el('a',{href:whatsapp(p),class:'catalog-ask',target:'_blank',rel:'noopener noreferrer'},c.ask))
  )));
  if(detailProduct)renderDetail(detailProduct);
}
function renderDetail(p){
  const c=t();$('detail-close').setAttribute('aria-label',c.close);$('detail-title').textContent=p.name;
  $('detail-image').replaceChildren(imageNode(p.image_url,p.name,{loading:'eager'}));
  $('detail-category').textContent=categories.find(cat=>cat.id===p.category_id)?.name||'';
  $('detail-description').textContent=p.description;$('detail-sku').textContent=p.sku?`${c.code}: ${p.sku}`:'';$('detail-price').textContent=price(p);$('detail-stock').textContent=p.in_stock?c.available:c.out;$('detail-stock').classList.toggle('is-out',!p.in_stock);$('detail-whatsapp').href=whatsapp(p);$('detail-whatsapp').textContent=c.ask;$('detail-note').textContent=c.note;
}
function openDetail(p,updateUrl=true){detailProduct=p;renderDetail(p);if(!$('product-detail').open)$('product-detail').showModal();if(updateUrl){const url=new URL(location.href);url.searchParams.set('producto',p.id);url.hash='catalogo';history.pushState({},'',url);}}
function closeDetail(updateUrl=true){$('product-detail').close();detailProduct=null;if(updateUrl){const url=new URL(location.href);url.searchParams.delete('producto');history.replaceState({},'',url);}}
function fromUrl(){const id=new URL(location.href).searchParams.get('producto');if(!id){if($('product-detail').open)closeDetail(false);return;}const p=products.find(p=>p.id===id);if(p)openDetail(p,false);else{$('catalog-announcement').textContent=t().missing;}}
async function load(){
  loadState='loading';$('catalog-grid').setAttribute('aria-busy','true');$('catalog-grid').replaceChildren(...[1,2,3].map(()=>el('div',{class:'catalog-skeleton','aria-hidden':'true'})));render();
  try{if(client){const data=await api.load();products=data.products.filter(p=>p.published);categories=data.categories;}loadState='ready';}
  catch{loadState='error';}
  finally{$('catalog-grid').setAttribute('aria-busy','false');render();if(loadState==='ready')fromUrl();}
}
$('catalog-search').addEventListener('input',render);$('catalog-category').addEventListener('change',render);$('catalog-clear').addEventListener('click',()=>{$('catalog-search').value='';$('catalog-category').value='';render();$('catalog-search').focus();});$('detail-close').addEventListener('click',()=>closeDetail());$('product-detail').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});window.addEventListener('popstate',fromUrl);
new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
load();
