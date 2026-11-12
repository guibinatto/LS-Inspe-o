const fs=require('fs'),d=process.argv[2];
const dados=fs.readFileSync(d+'/dados.json','utf8').replace(/</g,'\\u003c');
let h=fs.readFileSync(d+'/modelo.html','utf8').replace('__DADOS__',()=>dados).replace('__LOGO__',()=>fs.readFileSync(d+'/logo.txt','utf8').trim());
fs.writeFileSync(d+'/pulso-comercial-ls-fire.html',h);console.log(h.length);
