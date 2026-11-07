// Demostración explícita. Solo se carga si no existe conexión y se pide ?demo=1.
// Datos en memoria: jamás autentica usuarios ni escribe en Supabase.
import {PLACEHOLDER} from './catalog-core.js';
const stamp=()=>new Date().toISOString();
const categories=['Repuestos','Equipamiento 4x4','Lubricantes y filtros','Accesorios'].map((name,position)=>({id:crypto.randomUUID(),name,position,updated_at:stamp()}));
const products=[
  ['Filtro de aceite · ejemplo',categories[2].id,12990,true,true,'Producto de demostración. Aquí podrás indicar marcas, modelos y compatibilidad.'],
  ['Kit de frenos · ejemplo',categories[0].id,45990,true,true,'Ejemplo de un repuesto con precio publicado y consulta por WhatsApp.'],
  ['Accesorio 4x4 · ejemplo',categories[1].id,null,false,true,'Este producto está en borrador: el público todavía no lo ve.'],
  ['Repuesto Nissan · ejemplo',categories[0].id,29990,true,false,'Producto de ejemplo marcado sin stock. El cliente puede consultar alternativas.']
].map(([name,category_id,price,published,in_stock,description],position)=>({id:crypto.randomUUID(),name,category_id,price,published,in_stock,description,sku:`DEMO-00${position+1}`,position,image_path:'demo',image_url:PLACEHOLDER,updated_at:stamp()}));
const photos=new Map();
const conflict=(old,expected)=>{if(!old||old.updated_at!==expected)throw new Error('CONFLICTO_EDICION');};
export const demoApi={
  async load(){return structuredClone({products,categories,settings:{max_products:100,max_categories:20}});},
  async isAdmin(){return true;},
  async saveProduct(p,expected){
    let current=products.find(x=>x.id===p.id);
    if(p.id){conflict(current,expected);}else{if(products.length>=100)throw new Error('LIMITE_PRODUCTOS');current={id:crypto.randomUUID(),position:products.length};products.push(current);}
    Object.assign(current,p,{id:current.id,image_url:photos.get(p.image_path)||current.image_url||PLACEHOLDER,updated_at:stamp()});return current;
  },
  async deleteProduct(id,expected){const i=products.findIndex(p=>p.id===id);conflict(products[i],expected);return products.splice(i,1)[0].image_path;},
  async saveCategory(c,expected){
    if(categories.some(x=>x.id!==c.id&&x.name.toLowerCase()===c.name.trim().toLowerCase()))throw {code:'23505'};
    if(c.id){const old=categories.find(x=>x.id===c.id);conflict(old,expected);Object.assign(old,{name:c.name.trim(),updated_at:stamp()});}
    else{if(categories.length>=20)throw new Error('LIMITE_CATEGORIAS');categories.push({id:crypto.randomUUID(),name:c.name.trim(),position:categories.length,updated_at:stamp()});}
  },
  async deleteCategory(id,expected){const i=categories.findIndex(c=>c.id===id);conflict(categories[i],expected);if(products.some(p=>p.category_id===id))throw new Error('CATEGORIA_CON_PRODUCTOS');categories.splice(i,1);},
  async reorder(kind,ids){const list=kind==='products'?products:categories;list.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));list.forEach((x,i)=>{x.position=i;x.updated_at=stamp();});},
  async uploadPhoto(blob){const key=crypto.randomUUID();photos.set(key,URL.createObjectURL(blob));return key;},
  async removePhoto(key){if(photos.has(key)){URL.revokeObjectURL(photos.get(key));photos.delete(key);}}
};
