import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {createActivationHandler} from './handler.js';

// Las credenciales privilegiadas solo se leen dentro de Supabase; nunca llegan a la web.
function envKey(modern: string,legacy: string){
  const keys=Deno.env.get(modern);
  return (keys?JSON.parse(keys).default:null)||Deno.env.get(legacy)||'';
}
const url=Deno.env.get('SUPABASE_URL')||'';
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(url,envKey('SUPABASE_SECRET_KEYS','SUPABASE_SERVICE_ROLE_KEY'),options);
const publicKey=envKey('SUPABASE_PUBLISHABLE_KEYS','SUPABASE_ANON_KEY');
Deno.serve(createActivationHandler({admin,login:async(email: string,password: string)=>{
  const isolated=createClient(url,publicKey,options);
  return isolated.auth.signInWithPassword({email,password});
}}));
