const fs=require('fs');
eval(['engine.js','explica.js','exercicios.js'].map(f=>fs.readFileSync(require('path').join(__dirname,'..','src',f),'utf8')).join('\n')+`
;let bad=0;
for(const ex of EXERCICIOS){
  ex.setup(); W.cmds=[];
  const sol = typeof ex.solucao==='function'? ex.solucao.call(ex): ex.solucao;
  const log=[];
  for(const st of sol){ if(typeof st==='string'){ const o=run(st); o.forEach(x=>{ if(!x.ok) log.push('  ERR '+st+' => '+x.t.split('\\n')[0]); }); } else { const r=st.fn(); } }
  const res=ex.metas.map(([t,f])=>[t,!!f()]);
  const ok=res.every(x=>x[1]); if(!ok) bad++;
  console.log((ok?'OK  ':'FAIL')+' '+ex.id+' '+ex.titulo);
  res.filter(x=>!x[1]).forEach(x=>console.log('   meta falhou: '+x[0]));
  if(process.env.V||!ok) log.forEach(l=>console.log(l));
}
// metas must be false right after setup
for(const ex of EXERCICIOS){ ex.setup(); W.cmds=[]; const pre=ex.metas.filter(([t,f])=>f()); if(pre.length) console.log('PRE-SATISFEITA '+ex.id+': '+pre.map(x=>x[0]).join(' | ')); }
console.log('falhas:',bad);
`);
