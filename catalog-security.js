const unwrap=({data,error})=>{if(error)throw error;return data;};
export async function securityState(client,isMember){
  if(!await isMember())return {authorized:false,verified:false,factors:[]};
  const assurance=unwrap(await client.auth.mfa.getAuthenticatorAssuranceLevel());
  const data=unwrap(await client.auth.mfa.listFactors());
  const factors=(data.totp||[]).filter(f=>f.status==='verified');
  return {authorized:true,verified:assurance.currentLevel==='aal2'&&assurance.nextLevel==='aal2'&&factors.length>0,factors};
}
export async function enrollAuthenticator(client){
  const data=unwrap(await client.auth.mfa.listFactors());
  // Solo descarta configuraciones anteriores de esta app que nunca se verificaron.
  for(const f of (data.all||[]))if(f.status==='unverified'&&f.factor_type==='totp'&&f.friendly_name==='Adriazola 4WD'){
    unwrap(await client.auth.mfa.unenroll({factorId:f.id}));
  }
  return unwrap(await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Adriazola 4WD'}));
}
export async function verifyAuthenticator(client,factorId,code){
  if(!factorId||!/^\d{6}$/.test(code))throw new Error('CODIGO_MFA_INVALIDO');
  return unwrap(await client.auth.mfa.challengeAndVerify({factorId,code}));
}
export function qrSource(qr){
  if(typeof qr!=='string')throw new Error('QR_MFA_INVALIDO');
  if(qr.startsWith('data:image/svg+xml'))return qr;
  if(qr.trimStart().startsWith('<svg'))return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(qr);
  throw new Error('QR_MFA_INVALIDO');
}
