const config=window.ADRIAZOLA_CONFIG||{};
export const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl||'') && /^(sb_publishable_|eyJ)/.test(config.supabasePublishableKey||'') && !/service_role|sb_secret_/.test(config.supabasePublishableKey||'');
// Rechaza también la antigua clave service_role codificada como JWT.
function safeKey(key){try{if(key.startsWith('eyJ')){const p=key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(p)).role==='anon';}return key.startsWith('sb_publishable_');}catch{return false;}}
// Los tokens de sesión duran solo en esta pestaña. El verificador PKCE, que no
// permite iniciar sesión por sí solo, se comparte para abrir el correo de
// recuperación en otra pestaña del mismo navegador.
const authStorage={
  getItem:key=>(key.endsWith('-code-verifier')?localStorage:sessionStorage).getItem(key),
  setItem:(key,value)=>(key.endsWith('-code-verifier')?localStorage:sessionStorage).setItem(key,value),
  removeItem:key=>(key.endsWith('-code-verifier')?localStorage:sessionStorage).removeItem(key)
};
export const client = configured && safeKey(config.supabasePublishableKey) && window.supabase
  ? window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{
      auth:{storage:authStorage,storageKey:'adriazola-catalog-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'},
      global:{headers:{'X-Client-Info':'adriazola-catalog-v11'}}
    }) : null;
const unwrap=({data,error})=>{if(error)throw error;return data;};
export function photoUrl(path){return path&&client?client.storage.from('catalog-photos').getPublicUrl(path).data.publicUrl:null;}
export const api={
  async load(){
    if(!client)throw new Error('SIN_CONFIGURAR');
    const [products,categories,settings]=await Promise.all([
      client.from('catalog_products').select('*').order('position').order('created_at').range(0,999),
      client.from('catalog_categories').select('*').order('position').order('created_at').range(0,999),
      client.from('catalog_settings').select('max_products,max_categories').eq('id',true).single()
    ]);
    return {products:unwrap(products).map(p=>({...p,image_url:photoUrl(p.image_path)})),categories:unwrap(categories),settings:unwrap(settings)};
  },
  async isAdmin(){return Boolean(unwrap(await client.rpc('is_catalog_admin')));},
  async isMember(){return Boolean(unwrap(await client.from('catalog_admins').select('user_id').limit(1).maybeSingle()));},
  async saveProduct(p,expected){return unwrap(await client.rpc('catalog_save_product',{p_product:p,p_expected_updated_at:expected||null}));},
  async deleteProduct(id,expected){return unwrap(await client.rpc('catalog_delete_product',{p_id:id,p_expected_updated_at:expected}));},
  async saveCategory(category,expected){return unwrap(await client.rpc('catalog_save_category',{p_id:category.id||null,p_name:category.name,p_expected_updated_at:expected||null}));},
  async deleteCategory(id,expected){return unwrap(await client.rpc('catalog_delete_category',{p_id:id,p_expected_updated_at:expected}));},
  async reorder(kind,ids){return unwrap(await client.rpc('catalog_reorder',{p_kind:kind,p_ids:ids}));},
  async uploadPhoto(blob){
    if(blob.type!=='image/webp'||blob.size>409600)throw new Error('VALIDACION_FOTO');
    const path=`products/${crypto.randomUUID()}.webp`;
    unwrap(await client.storage.from('catalog-photos').upload(path,blob,{contentType:'image/webp',cacheControl:'31536000',upsert:false}));return path;
  },
  async removePhoto(path){if(path)unwrap(await client.storage.from('catalog-photos').remove([path]));}
};
