const ORIGINS=new Set(['https://mecanicadriazola.cl','https://www.mecanicadriazola.cl','http://127.0.0.1:4173']);
export function createActivationHandler({admin,login}){
  return async request=>{
    const origin=request.headers.get('origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Vary':'Origin',
      'Access-Control-Allow-Origin':ORIGINS.has(origin)?origin:'null','Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'content-type, apikey','Access-Control-Max-Age':'600'};
    const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
    if(!ORIGINS.has(origin))return reply(403,{error:'ORIGEN_NO_PERMITIDO'});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return reply(405,{error:'METODO_NO_PERMITIDO'});
    if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply(415,{error:'DATOS_INVALIDOS'});
    let body;
    try{
      const reader=request.body?.getReader();if(!reader)return reply(400,{error:'DATOS_INVALIDOS'});
      const chunks=[];let size=0;
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();return reply(413,{error:'DATOS_INVALIDOS'});}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
      body=JSON.parse(new TextDecoder().decode(bytes));
    }catch{return reply(400,{error:'DATOS_INVALIDOS'});}
    if(typeof body?.token!=='string'||!/^\w{64}$/.test(body.token)||!/^[0-9a-f]{64}$/.test(body.token)||typeof body.password!=='string'||body.password.length<12||body.password.length>128)return reply(400,{error:'DATOS_INVALIDOS'});
    try{
      const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body.token));
      const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
      const lookup=await admin.rpc('catalog_activation_lookup',{p_hash:hash});
      if(lookup.error)return reply(503,{error:'ACTIVACION_NO_DISPONIBLE'});
      const invite=lookup.data;
      if(invite?.error)return reply(invite.error==='ESPERA_ACTIVACION'?429:400,{error:invite.error==='ESPERA_ACTIVACION'?'ESPERA_ACTIVACION':'INVITACION_INVALIDA'});
      if(!invite?.id||!invite.email)return reply(400,{error:'INVITACION_INVALIDA'});
      let userId=invite.existing_id;
      if(userId){
        // Recupera una activación interrumpida, pero jamás cambia una contraseña existente.
        const proof=await login(invite.email,body.password);
        if(proof.error||proof.data?.user?.id!==userId)return reply(400,{error:'ACTIVACION_INCOMPLETA'});
      }else{
        const result=await admin.auth.admin.createUser({email:invite.email,password:body.password,email_confirm:true,app_metadata:{catalog_invitation_id:invite.id}});
        if(result.error||!result.data?.user?.id)return reply(400,{error:'NO_SE_PUDO_CREAR_CUENTA'});
        userId=result.data.user.id;
      }
      const finished=await admin.rpc('catalog_activation_finish',{p_hash:hash,p_user_id:userId});
      if(finished.error)return reply(400,{error:'ACTIVACION_INCOMPLETA'});
      return reply(200,{email:invite.email});
    }catch{
      // No se registran cuerpos, enlaces, claves, contraseñas ni detalles internos.
      return reply(503,{error:'ACTIVACION_NO_DISPONIBLE'});
    }
  };
}
