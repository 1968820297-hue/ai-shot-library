import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
const root=path.resolve(process.argv[2]||'.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.zip':'application/zip'};
http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return res.writeHead(400).end()}
  if(pathname==='/'||pathname==='/library'||pathname==='/library.html')pathname='/index.html';
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile())return res.writeHead(404).end('File not found');
    const headers={'Content-Type':mime[path.extname(file)]||'text/plain; charset=utf-8','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    const match=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(match){const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),stat.size-1):stat.size-1;if(start> end)return res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res)}
    else{res.writeHead(200,{...headers,'Content-Length':stat.size});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res)}
  });
}).listen(4173,'0.0.0.0',()=>console.log('Local: http://localhost:4173'));
