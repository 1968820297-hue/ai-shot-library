import fs from 'node:fs';
import path from 'node:path';
const output='dist';
const hosted=process.argv.includes('--hosted');
// Keep the full local library; hosted previews use the original published CDN.
// This avoids re-uploading 133 MB of already-public video assets.
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for(const name of ['index.html','app.js','translations.js','design.css','favicon.svg','api','media','posters','source','LICENSE','NOTICE.txt','upstream-notices']){
  if(!fs.existsSync(name))throw new Error('Missing required site asset: '+name);
  if(hosted && name==='media')continue;
  fs.cpSync(name,path.join(output,name),{recursive:true});
}
const library=JSON.parse(fs.readFileSync('api/library.json','utf8'));
let previews=0;
for(const card of library.cards){
  if(!fs.existsSync(card.sourceUrl.split('?')[0]))throw new Error('Missing recipe: '+card.name);
  for(const style of card.styles){if(style.media){
    const mediaPath=style.media.url.split('?')[0];
    if(!fs.existsSync(mediaPath))throw new Error('Missing preview: '+style.key);
    const posterPath=path.join('posters',path.basename(mediaPath).replace(/\.[^.]+$/,'.jpg'));
    if(!fs.existsSync(posterPath))throw new Error('Missing preview poster: '+style.key);
    previews++;
  }}
}
if(hosted){
  const base='https://vincentwei1021.github.io/video-shotcraft/';
  const hostedLibrary=structuredClone(library);
  for(const card of hostedLibrary.cards)for(const style of card.styles)if(style.media)style.media.url=new URL(style.media.url,base).href;
  fs.writeFileSync('dist/api/library.json',JSON.stringify(hostedLibrary));
  const html=fs.readFileSync('index.html','utf8').replace('src="./media/carousel-3d.mp4"',`src="${base}media/carousel-3d.mp4"`);
  fs.writeFileSync('dist/index.html',html);
  // A cross-origin download link opens the native media page rather than claiming a local download.
  const app=fs.readFileSync('app.js','utf8').replace('download>${state.language === \'zh\' ? \'下载样片 ↓\' : \'Download preview ↓\'}','target="_blank" rel="noopener noreferrer">${state.language === \'zh\' ? \'打开原始样片 ↗\' : \'Open original preview ↗\'}');
  fs.writeFileSync('dist/app.js',app);
}
fs.copyFileSync('dist/index.html','dist/library.html');
console.log(`Built ${library.cards.length} recipes and ${previews} previews into dist.`);
