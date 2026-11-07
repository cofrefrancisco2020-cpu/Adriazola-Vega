import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)||path.relative(root,file).split(path.sep).some(x=>x.startsWith('.'))){res.writeHead(403);res.end();return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin'});res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Archivo no encontrado.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Vista previa: http://127.0.0.1:${port}\nPanel de administración: http://127.0.0.1:${port}/admin.html\nCierra esta ventana para detener la vista previa.`));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Ya hay una vista previa abierta en este puerto.':e.message);process.exitCode=1;});
