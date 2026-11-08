import {client} from './catalog-api.js';
import {teamError} from './catalog-team.js';
const $=id=>document.getElementById(id);
const key='adriazola-pending-invitation';
const fragment=location.hash.slice(1);
if(fragment){sessionStorage.setItem(key,fragment);history.replaceState(null,'',location.pathname);}
let token=sessionStorage.getItem(key)||'';
if(!/^[0-9a-f]{64}$/.test(token)||!client){$('activation-form').hidden=true;$('activation-message').textContent='Abre el enlace privado que te envió un administrador. Si caducó, pídele uno nuevo.';sessionStorage.removeItem(key);token='';}
$('activation-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('activation-submit');if(button.disabled)return;
  if($('activation-password').value!==$('activation-repeat').value){$('activation-message').textContent='Las contraseñas no coinciden.';return;}
  const password=$('activation-password').value;button.disabled=true;button.textContent='Creando tu cuenta…';$('activation-message').textContent='';
  try{
    const config=window.ADRIAZOLA_CONFIG;
    const response=await fetch(config.supabaseUrl+'/functions/v1/catalog-activate',{method:'POST',headers:{'Content-Type':'application/json','apikey':config.supabasePublishableKey},body:JSON.stringify({token,password}),cache:'no-store',referrerPolicy:'no-referrer'});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'ACTIVACION_NO_DISPONIBLE');
    sessionStorage.removeItem(key);token='';$('activation-form').reset();$('activation-form').hidden=true;$('activation-complete').hidden=false;
    // La cuenta y el factor pertenecen a cada persona, no al dispositivo del invitador.
    await client.auth.signOut({scope:'local'});
    const login=await client.auth.signInWithPassword({email:result.email,password});
    if(login.error){$('activation-message').textContent='La cuenta está creada. Inicia sesión para configurar tu teléfono.';return;}
    sessionStorage.setItem('adriazola-last-activity',String(Date.now()));location.replace('./admin.html');
  }catch(error){$('activation-message').textContent=teamError(error);}
  finally{button.disabled=false;button.textContent='Crear mi cuenta y continuar →';}
});
