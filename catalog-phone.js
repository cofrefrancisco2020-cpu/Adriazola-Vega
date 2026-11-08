import {verifyAuthenticator,qrSource} from './catalog-security.js';
import {friendlyError} from './catalog-core.js';
const unwrap=({data,error})=>{if(error)throw error;return data;};
export async function startPhoneChange(client){
  const factors=unwrap(await client.auth.mfa.listFactors());
  const oldIds=(factors.totp||[]).filter(f=>f.status==='verified').map(f=>f.id);
  if(!oldIds.length)throw new Error('NO_AUTORIZADO');
  const assurance=unwrap(await client.auth.mfa.getAuthenticatorAssuranceLevel());
  if(assurance.currentLevel!=='aal2')throw new Error('NO_AUTORIZADO');
  for(const factor of factors.all||[])if(factor.status==='unverified'&&factor.factor_type==='totp'&&factor.friendly_name?.startsWith('Adriazola 4WD · nuevo '))unwrap(await client.auth.mfa.unenroll({factorId:factor.id}));
  const factor=unwrap(await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Adriazola 4WD · nuevo '+crypto.randomUUID().slice(0,8)}));
  return {factor,oldIds,verified:false};
}
export async function finishPhoneChange(client,replacement,code){
  if(!replacement?.factor?.id||replacement.oldIds.includes(replacement.factor.id))throw new Error('NO_AUTORIZADO');
  if(!replacement.verified){await verifyAuthenticator(client,replacement.factor.id,code);replacement.verified=true;}
  // Nunca elimina el anterior antes de verificar un factor nuevo y distinto.
  for(const id of [...replacement.oldIds]){
    unwrap(await client.auth.mfa.unenroll({factorId:id}));replacement.oldIds=replacement.oldIds.filter(old=>old!==id);
  }
}
export function attachPhoneChange({client,demo,onComplete}){
  const $=id=>document.getElementById(id);let replacement=null,working=false;
  const clear=()=>{replacement=null;$('phone-qr').removeAttribute('src');$('phone-secret').value='';$('phone-code').value='';$('phone-error').textContent='';};
  async function cancel(){
    if(working)return;
    if(replacement&&!replacement.verified){try{await client.auth.mfa.unenroll({factorId:replacement.factor.id});}catch{/* Solo un factor temporal sin verificar. */}}
    $('phone-dialog').close();clear();
  }
  $('change-phone').addEventListener('click',async()=>{
    if(working)return;if(demo||!client){$('team-error').textContent='El cambio de teléfono requiere una cuenta real con su código verificado.';return;}
    working=true;$('change-phone').disabled=true;
    try{clear();replacement=await startPhoneChange(client);$('phone-qr').src=qrSource(replacement.factor.totp.qr_code);$('phone-secret').value=replacement.factor.totp.secret;$('phone-instruction').textContent='Escanea este QR con el teléfono que usará esta cuenta. El código anterior seguirá funcionando hasta verificar el nuevo.';$('phone-submit').textContent='Verificar nuevo código y retirar anteriores';$('phone-code').required=true;$('phone-dialog').showModal();$('phone-code').focus();}
    catch(error){$('team-error').textContent=friendlyError(error);}finally{working=false;$('change-phone').disabled=false;}
  });
  $('phone-form').addEventListener('submit',async event=>{
    event.preventDefault();if(working||!replacement)return;working=true;$('phone-submit').disabled=true;$('phone-error').textContent='';
    try{await finishPhoneChange(client,replacement,$('phone-code').value.trim());$('phone-dialog').close();clear();await client.auth.signOut({scope:'local'});onComplete();}
    catch(error){$('phone-error').textContent=replacement?.verified?'El teléfono nuevo ya está verificado. Falta retirar algún código anterior. Pulsa de nuevo para terminar.':friendlyError(error);if(replacement?.verified){$('phone-submit').textContent='Terminar de retirar los códigos anteriores';$('phone-code').required=false;}else{$('phone-code').value='';$('phone-code').focus();}}
    finally{working=false;$('phone-submit').disabled=false;}
  });
  $('phone-close').addEventListener('click',cancel);$('phone-dialog').addEventListener('cancel',event=>{event.preventDefault();cancel();});
  return {clear};
}
