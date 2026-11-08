import {el} from './catalog-core.js';
const unwrap=({data,error})=>{if(error)throw error;return data;};
export const teamErrors={
  NO_AUTORIZADO:'Vuelve a iniciar sesión y verifica el código de seguridad.',
  INVITACION_DATOS:'Revisa el correo electrónico e inténtalo otra vez.',
  CUENTA_EXISTENTE:'Ese correo ya tiene una cuenta. Si perdió acceso, contacta al propietario; una invitación no cambia su contraseña ni su teléfono.',
  INVITACION_PENDIENTE:'Ya existe una invitación para ese correo. Cancélala antes de generar otra.',
  LIMITE_ADMINISTRADORES:'El taller admite hasta 10 administradores, contando las invitaciones pendientes.',
  LIMITE_CUENTAS:'Se alcanzó el límite de cuentas. Contacta al propietario para revisar las altas antiguas.',
  LIMITE_INVITACIONES_DIA:'Se alcanzaron las 20 invitaciones de las últimas 24 horas. Intenta mañana.',
  NO_REVOCAR_PROPIO_ACCESO:'No puedes quitarte tu propio acceso desde este panel.',
  ULTIMO_ADMINISTRADOR:'Debe quedar al menos un administrador.',
  INVITACION_INVALIDA:'Este enlace caducó, ya se usó o fue cancelado. Solicita una invitación nueva.',
  ESPERA_ACTIVACION:'Se alcanzó el límite de intentos. Espera unos minutos. Si continúa, inténtalo mañana.',
  ACTIVACION_INCOMPLETA:'La activación no terminó. Reintenta con la misma contraseña que elegiste. Si continúa, pide ayuda al propietario.',
  NO_SE_PUDO_CREAR_CUENTA:'No pudimos crear la cuenta. Usa una contraseña única de al menos 12 caracteres y vuelve a intentar.',
  ACTIVACION_NO_DISPONIBLE:'La activación no está disponible en este momento. Intenta más tarde.',
  DATOS_INVALIDOS:'Revisa el enlace y usa una contraseña de entre 12 y 128 caracteres.'
};
export function teamError(error){return Object.entries(teamErrors).find(([code])=>String(error?.message||error).includes(code))?.[1]||'No pudimos completar la operación. Actualiza la lista e inténtalo otra vez.';}
export async function invitationSecret(){
  const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  return {token,hash:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')};
}
export function invitationLink(token,base=location.href){
  if(!/^[0-9a-f]{64}$/.test(token))throw new Error('INVITACION_DATOS');
  const url=new URL('./activar.html',base);url.search='';url.hash=token;return url.href;
}
export function attachTeam({client,toast,demo=false}){
  const $=id=>document.getElementById(id);
  let working=false,generation=0;
  const date=value=>new Intl.DateTimeFormat('es-CL',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
  const clear=()=>{generation++;$('invite-result').hidden=true;$('invite-link').value='';$('invite-form').reset();$('team-admins').replaceChildren();$('team-invitations').replaceChildren();$('team-error').textContent='';};
  const rpc=async(name,args)=>unwrap(await client.rpc(name,args));
  async function load(){
    const current=generation;
    $('team-error').textContent='';
    if(demo){$('team-error').textContent='Las invitaciones solo se generan en el panel conectado, después de verificar el código de seguridad.';return;}
    try{
      const data=await rpc('catalog_team_list');
      if(current!==generation)return;
      $('team-capacity').textContent=`${data.admins.length} administradores · ${data.invitations.length} invitaciones pendientes · máximo ${data.max_admins}`;
      $('team-admins').replaceChildren(...data.admins.map(person=>el('div',{class:'team-row'},
        el('div',{},el('strong',{},person.email),el('small',{},person.id===data.self_id?'Tu cuenta':person.mfa_ready?'Autenticador configurado':'Pendiente de configurar su teléfono')),
        person.id!==data.self_id?el('button',{type:'button',class:'text-btn',onclick:async()=>{
          if(!confirm(`¿Quitar a ${person.email} el permiso de administrar? Su cuenta no se elimina, pero ya no podrá editar ni invitar a otras personas.`))return;
          await action(()=>rpc('catalog_admin_revoke',{p_user_id:person.id}),'Acceso retirado.');
        }},'Quitar acceso'):el('span',{class:'badge published'},'Tú'))));
      $('team-invitations').replaceChildren(...data.invitations.map(invite=>el('div',{class:'team-row'},
        el('div',{},el('strong',{},invite.email),el('small',{},`Caduca el ${date(invite.expires_at)}`)),
        el('button',{type:'button',class:'text-btn',onclick:async()=>{
          if(!confirm(`¿Cancelar la invitación para ${invite.email}? Su enlace dejará de funcionar.`))return;
          await action(()=>rpc('catalog_invite_cancel',{p_id:invite.id}),'Invitación cancelada.');
          $('invite-result').hidden=true;$('invite-link').value='';
        }},'Cancelar invitación'))));
      if(!data.invitations.length)$('team-invitations').append(el('p',{class:'hint'},'No hay invitaciones pendientes.'));
    }catch(error){$('team-error').textContent=teamError(error);}
  }
  async function action(fn,message){
    if(working)return;working=true;$('team-section').setAttribute('aria-busy','true');
    $('team-section').querySelectorAll('button,input').forEach(b=>b.disabled=true);
    try{await fn();if(message)toast(message);await load();}
    catch(error){$('team-error').textContent=teamError(error);}
    finally{working=false;$('team-section').setAttribute('aria-busy','false');$('team-section').querySelectorAll('button,input').forEach(b=>b.disabled=false);}
  }
  $('invite-form').addEventListener('submit',async event=>{
    event.preventDefault();if(demo||!client){toast('Las invitaciones requieren una cuenta real y el código de seguridad.',true);return;}
    await action(async()=>{
      const current=generation;
      $('invite-result').hidden=true;$('invite-link').value='';
      const secret=await invitationSecret();
      const result=await rpc('catalog_invite_create',{p_email:$('invite-email').value.trim(),p_token_hash:secret.hash});
      if(current!==generation)return;
      $('invite-link').value=invitationLink(secret.token);$('invite-recipient').textContent=result.email;
      $('invite-result').hidden=false;$('invite-form').reset();
    },'Invitación creada. Copia el enlace y envíaselo únicamente a esa persona.');
  });
  $('copy-invite').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('invite-link').value);toast('Enlace copiado. Pégalo en tu correo o WhatsApp.');}
    catch{$('invite-link').focus();$('invite-link').select();toast('Seleccionamos el enlace. Cópialo con Ctrl+C o mantén pulsado para copiar.');}
  });
  $('team-refresh').addEventListener('click',load);
  return {load,clear};
}
