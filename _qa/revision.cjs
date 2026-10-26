const {chromium,webkit}=require('playwright');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
process.chdir(path.resolve(__dirname,'..'));
let baseURL;
const html=fs.readFileSync('index.html','utf8');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
const outputDir=process.env.QA_OUTPUT_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'entrenamiento-qa-'));
fs.mkdirSync(outputDir,{recursive:true});
function launchOptions(name){return name==='Chromium'&&process.env.QA_CHROMIUM_EXECUTABLE?{headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}:{headless:true}}
const assert=require('assert/strict');
const results=[];
async function test(engine,name){
 let browser;try{browser=await engine.launch(launchOptions(name))}catch(e){results.push({engine:name,test:'Browser launch',status:'NO EJECUTADO',detail:e.message.split('\n')[0]});return}
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,timezoneId:'Europe/Madrid'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=async(title,fn)=>{try{await fn();results.push({engine:name,test:title,status:'PASS'})}catch(e){results.push({engine:name,test:title,status:'FAIL',detail:e.message});throw e}};
 const go=async id=>{await page.locator(`[data-tab="${id}"]`).click()};
 const fill=async id=>{await page.evaluate(id=>{
  const root=document.querySelector('#day_'+id);
  root.querySelectorAll('[data-k]').forEach(el=>{if(el.disabled||el.type==='checkbox'||el.tagName==='SELECT')return;const k=el.dataset.k;
   let v=el.dataset.num?'12':'Sesión cómoda';
   if(k.endsWith('_eb')||k.endsWith('_ea'))v='8';
   if(k==='tue_blocks')v='6';if(k==='tue_time')v='36';if(k==='tue_distance')v='3,6';
   if(k==='thu_tread_time')v='30';if(k==='thu_tread_distance')v='3';if(k==='thu_bike_time')v='10';
   if(k.startsWith('sleep_'))v='7,5';
   el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  root.querySelectorAll('[data-rir]').forEach(x=>x.querySelector('[data-v="3"]').click());
  root.querySelectorAll('[data-scale]').forEach(x=>x.querySelector('[data-v="0"]').click());
 },id)};
 try{
  await page.goto(baseURL);
  await check('Arranque, seis pestañas, semana y campos vacíos',async()=>{assert.equal(await page.locator('#tabs button').count(),6);assert.match(await page.locator('.week').innerText(),/26 — 30/);assert.equal(await page.locator('[data-k="mon_chest_w1"]').inputValue(),'');assert.deepEqual(errors,[])});
  await check('Fidelidad de series y paralelas de esta semana',async()=>{
   const data=await page.evaluate(()=>DAYS.map(d=>[d.id,d.ex?.map(e=>[e[7],e[6]])]));
   assert.deepEqual(data[0][1].map(x=>x[1]),[3,3,3,2,3,3,2,2]);assert.deepEqual(data[2][1].map(x=>x[1]),[3,2,3,2,3,3,3,2,2]);assert.deepEqual(data[4][1].map(x=>x[1]),[2,2,2,3,2,2,3,2,2,2,1]);assert.equal(await page.locator('[data-k="mon_parallel_decision"]').count(),0);assert.equal(await page.locator('[data-k="fri_parallel_tri_w"]').count(),0);
  });
  await check('Vacíos bloquean exportación con detalle',async()=>{await page.locator('#gen').click();assert.match(await page.locator('#status').innerText(),/S1 peso/);assert.equal(await page.locator('#output').isVisible(),false)});
  await check('Fuerza A: decimales, RIR, cero, copia y recarga',async()=>{
   await fill('mon');await page.locator('[data-k="mon_tri_w1"]').fill('12,5');await page.locator('[data-rir="mon_chest"] [data-v="0"]').click();
   await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/12,5 kg/);assert.match(await page.locator('#output').innerText(),/RIR: 0/);assert.match(await page.locator('#output').innerText(),/Realizada:/);
   if(name==='Chromium'){await context.grantPermissions(['clipboard-read','clipboard-write']);await page.locator('#copy').click();assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/FUERZA A/)}
   await page.reload();assert.equal(await page.locator('[data-k="mon_tri_w1"]').inputValue(),'12,5');assert.equal(await page.locator('[data-rir="mon_chest"] [data-v="0"]').getAttribute('class'),'sel');
  });
  await check('Resumen se invalida al editar o cambiar pestaña',async()=>{await page.locator('#gen').click();await page.locator('[data-k="mon_tri_w1"]').fill('10');await page.locator('#copy').click();assert.equal(await page.locator('#output').isVisible(),false);assert.match(await page.locator('#toast').innerText(),/Primero genera/);await go('tue');assert.equal(await page.locator('#output').isVisible(),false)});
  await check('Carrera: parcial, media total y rodilla pendiente',async()=>{await fill('tue');await page.locator('[data-k="tue_blocks"]').fill('4');await page.evaluate(()=>setv('tue_next_knee',''));await page.locator('#gen').click();const text=await page.locator('#output').innerText();assert.match(text,/Bloques completados: 4\/6/);assert.match(text,/6,00 km\/h/);assert.match(text,/Pendiente de registrar/);assert.equal(await page.locator('#day_tue .progress').innerText(),'Registro completo');await page.locator('[data-k="tue_blocks"]').fill('7');await page.locator('#gen').click();assert.match(await page.locator('#status').innerText(),/Valor inválido/);await page.locator('[data-k="tue_blocks"]').fill('4');await page.locator('[data-scale="tue_next_knee"] [data-v="2"]').click();await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/Rodilla al día siguiente: 2\/10/)});
  await check('Fuerza B: rodilla previa, cuádriceps y lados',async()=>{await go('wed');await fill('wed');await page.locator('#gen').click();const t=await page.locator('#output').innerText();assert.match(t,/Rodilla antes: 0\/10/);assert.match(t,/Extensión cuádriceps/);assert.match(t,/Rodilla durante: 0\/10/);assert.match(t,/Izquierda: 12 s \/ Derecha: 12 s/)});
  await check('Cardio dual: campos exactos, media y omisión bici/descanso',async()=>{await go('thu');await fill('thu');await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/6,00 km\/h/);await page.locator('[data-k="thu_bike_skip"]').check();await page.locator('[data-k="thu_bike_reason"]').fill('Rodilla cargada');await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/Omitida: Rodilla cargada/);await page.locator('[data-k="thu_rest_skip"]').check();await page.locator('[data-k="thu_rest_reason"]').fill('Descanso por rodilla');await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/Sesión omitida \/ descanso/);assert.doesNotMatch(await page.locator('#output').innerText(),/BLOQUE 2/)});
  await check('Fuerza C: omisión piernas y paralelas sin serie extra',async()=>{await go('fri');await fill('fri');await page.locator('[data-k="fri_parallel_decision"]').selectOption('omit');await page.locator('[data-k="fri_legs_skip"]').check();await page.locator('[data-k="fri_legs_reason"]').fill('Fatiga de rodilla');await page.locator('#gen').click();const t=await page.locator('#output').innerText();assert.match(t,/Prensa de piernas · Máquina: Omitido/);assert.match(t,/Paralelas · Apoyo estático: Omitido/);assert.doesNotMatch(t,/tercera serie/);await page.locator('[data-k="fri_parallel_decision"]').selectOption('support');await page.locator('[data-k="fri_parallel_t1"]').fill('20');await page.locator('[data-k="fri_parallel_assist"]').fill('Sin asistencia');await page.locator('[data-k="fri_parallel_apprehension"]').fill('Ninguna');await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/20 s · asistencia: Sin asistencia/)});
  await check('Sueño parcial y media con coma decimal',async()=>{await go('sleep');await page.locator('[data-k="sleep_sunmon"]').fill('7,5');await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/Media provisional \(1\/7 noches\): 7,50 h/);await page.locator('[data-k="sleep_sunmon"]').fill('30');await page.locator('#gen').click();assert.match(await page.locator('#status').innerText(),/entre 0 y 24/);await page.locator('[data-k="sleep_sunmon"]').fill('7,5')});
  await check('Cancelar borrado conserva datos; confirmar solo borra esta semana',async()=>{
   await page.evaluate(()=>localStorage.setItem('entreno_v6_semana_2026-10-19','{"old":"conservar"}'));
   const before=await page.evaluate(()=>localStorage.getItem(STORE));
   page.once('dialog',d=>d.dismiss());await page.locator('#reset').click();assert.equal(await page.evaluate(()=>localStorage.getItem(STORE)),before);
   page.once('dialog',d=>d.accept());await page.locator('#reset').click();await page.waitForLoadState('load');
   assert.equal(await page.evaluate(()=>localStorage.getItem('entreno_v7_semana_2026-10-26')),null);
   assert.equal(await page.evaluate(()=>localStorage.getItem('entreno_v6_semana_2026-10-19')),'{"old":"conservar"}');
  });
  await check('Datos persisten en recarga con HTML servido por la prueba',async()=>{
   await go('mon');await fill('mon');await page.locator('[data-k="mon_chest_w1"]').fill('20');
   await context.route('**/*',route=>route.fulfill({body:fs.readFileSync('index.html','utf8'),contentType:'text/html'}));
   await context.setOffline(true);await page.reload();assert.equal(await page.locator('[data-k="mon_chest_w1"]').inputValue(),'20');await context.setOffline(false);await context.unroute('**/*');
  });
  await check('Omitir y volver a activar piernas conserva resultados y RIR',async()=>{
   await go('fri');await fill('fri');await page.locator('[data-k="fri_press_w1"]').fill('50');
   await page.locator('[data-k="fri_legs_skip"]').check();assert.equal(await page.locator('[data-k="fri_press_w1"]').isEnabled(),false);
   await page.locator('[data-k="fri_legs_skip"]').uncheck();assert.equal(await page.locator('[data-k="fri_press_w1"]').isEnabled(),true);assert.equal(await page.locator('[data-k="fri_press_w1"]').inputValue(),'50');assert.equal(await page.locator('[data-rir="fri_press"] [data-v="3"]').getAttribute('class'),'sel');
  });
  await check('Todas las repeticiones a cero exportan sin inventar RIR',async()=>{
   await go('mon');await fill('mon');for(let i=1;i<=3;i++){await page.locator('[data-k="mon_chest_r'+i+'"]').fill('0');await page.locator('[data-k="mon_chest_w'+i+'"]').fill('0')}
   await page.evaluate(()=>setv('mon_chest_rir',''));await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/Press pecho · Máquina: 0 kg - 0 reps \/ 0 kg - 0 reps \/ 0 kg - 0 reps\n  RIR: No realizado/);
  });
  await check('Paralelas: omitir no exporta un apoyo registrado previamente',async()=>{
   await go('fri');await page.locator('[data-k="fri_parallel_decision"]').selectOption('support');await page.locator('[data-k="fri_parallel_t1"]').fill('20');await page.locator('[data-k="fri_parallel_assist"]').fill('Sin asistencia');await page.locator('[data-k="fri_parallel_apprehension"]').fill('Ninguna');
   await page.locator('[data-k="fri_parallel_decision"]').selectOption('omit');await page.locator('#gen').click();assert.match(await page.locator('#output').innerText(),/Paralelas · Apoyo estático: Omitido/);assert.doesNotMatch(await page.locator('#output').innerText(),/20 s · asistencia/);
  });
  await check('No existen identificadores duplicados de campos',async()=>{const keys=await page.locator('[data-k]').evaluateAll(els=>els.map(e=>e.dataset.k));assert.equal(keys.length,new Set(keys).size)});
  await check('Datos inválidos no impiden arranque; semana previa conservada' ,async()=>{await page.evaluate(()=>{localStorage.setItem('entreno_v6_semana_2026-10-19','{"old":"conservar"}');localStorage.setItem(STORE,'bad JSON')});await page.reload();assert.equal(await page.locator('#tabs button').count(),6);assert.equal(await page.evaluate(()=>localStorage.getItem('entreno_v6_semana_2026-10-19')),'{"old":"conservar"}');assert.equal(await page.evaluate(()=>localStorage.getItem(STORE)),'bad JSON');assert.deepEqual(errors,[])});
  await check('Móvil: todas las pestañas sin desbordamiento horizontal',async()=>{for(const id of ['mon','tue','wed','thu','fri','sleep']){await go(id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}await go('tue');await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(outputDir,`qa-${name.toLowerCase()}.png`),fullPage:true})});
  await check('Sin errores de ejecución durante toda la prueba',async()=>assert.deepEqual(errors,[]));
 }finally{await browser.close()}
}
async function edgeCases(){
 let b;try{b=await chromium.launch(launchOptions('Chromium'))}catch(e){results.push({engine:'Chromium',test:'Casos de fecha y coherencia cardio',status:'NO EJECUTADO',detail:e.message.split('\n')[0]});return}
 try{
 const c=await b.newContext({timezoneId:'Europe/Madrid'}),p=await c.newPage();
 await p.clock.install({time:new Date('2026-10-27T18:00:00+01:00')});await p.goto(baseURL);
 await p.evaluate(()=>{switchDay('tue');document.querySelector('#day_tue').querySelectorAll('[data-k]').forEach(el=>{if(el.type==='checkbox')return;el.value=el.dataset.num?'1':'Prueba';el.dispatchEvent(new Event('input',{bubbles:true}))});document.querySelector('#day_tue').querySelectorAll('[data-scale]').forEach(el=>el.querySelector('[data-v="0"]').click());setv('tue_time','36');setv('tue_distance','3,6');setv('tue_blocks','6')});
 await p.locator('#gen').click();const before=(await p.locator('#output').innerText()).split('\n').find(x=>x.startsWith('Realizada:'));
 await p.clock.setFixedTime(new Date('2026-10-28T08:00:00+01:00'));await p.locator('[data-scale="tue_next_knee"] [data-v="2"]').click();await p.locator('#gen').click();const after=(await p.locator('#output').innerText()).split('\n').find(x=>x.startsWith('Realizada:'));
 results.push({engine:'Chromium',test:'Conservar fecha al añadir rodilla al día siguiente',status:before===after?'PASS':'FAIL',detail:before+' → '+after});
 await p.locator('[data-k="tue_time"]').fill('0');await p.locator('#gen').click();
 results.push({engine:'Chromium',test:'Bloquear distancia positiva con cero minutos',status:await p.locator('#output').isVisible()?'FAIL':'PASS'});

 const record=(test,ok,detail)=>results.push({engine:'Chromium',test,status:ok?'PASS':'FAIL',...(detail?{detail}:{})});
 record('Aviso de tiempo incoherente visible',/hay distancia registrada, pero el tiempo es 0 min/.test(await p.locator('#status').innerText()));
 await p.locator('[data-k="tue_time"]').fill('36');await p.locator('#gen').click();const savedSummary=await p.locator('#output').innerText();
 await p.reload();await p.locator('#gen').click();
 record('Fecha y seguimiento de rodilla persisten tras recarga',(await p.locator('#output').innerText()).includes(before)&&(await p.locator('#output').innerText()).includes('Rodilla al día siguiente: 2/10'));
 await p.evaluate(summary=>{const k='entreno_v7_semana_2026-10-26',data=JSON.parse(localStorage.getItem(k));delete data.tue_executionDate;data._summary=summary;data._summaryDay='tue';localStorage.setItem(k,JSON.stringify(data));},savedSummary);
 await p.reload();await p.locator('#gen').click();record('Recuperar fecha de un resumen anterior a la actualización',(await p.locator('#output').innerText()).includes(before));
 await p.locator('[data-tab="thu"]').click();
 await p.evaluate(()=>{const root=document.querySelector('#day_thu');root.querySelectorAll('[data-k]').forEach(el=>{if(el.type==='checkbox')return;el.value=el.dataset.num?'1':'Prueba';el.dispatchEvent(new Event('input',{bubbles:true}))});root.querySelectorAll('[data-scale]').forEach(el=>el.querySelector('[data-v="0"]').click())});
 await p.locator('[data-k="thu_tread_time"]').fill('0');await p.locator('[data-k="thu_tread_distance"]').fill('3');await p.locator('#gen').click();record('Cinta rechaza distancia positiva con cero minutos',!(await p.locator('#output').isVisible())&&(await p.locator('#status').innerText()).includes('Cinta: hay distancia'));
 await p.locator('[data-k="thu_tread_time"]').fill('30');await p.locator('[data-k="thu_bike_time"]').fill('0');await p.locator('[data-k="thu_bike_distance"]').fill('2');await p.locator('#gen').click();record('Bici rechaza distancia positiva con cero minutos',!(await p.locator('#output').isVisible())&&(await p.locator('#status').innerText()).includes('Bici: hay distancia'));
 await p.locator('[data-k="thu_bike_skip"]').check();await p.locator('[data-k="thu_bike_reason"]').fill('Omitida por rodilla');await p.locator('#gen').click();const thuSummary=await p.locator('#output').innerText();record('Bici omitida ignora datos antiguos y cada sesión conserva su fecha',(await p.locator('#output').isVisible())&&thuSummary.includes('miércoles, 28 de octubre de 2026')&&!thuSummary.includes(before)&&thuSummary.includes('Omitida: Omitida por rodilla'));
 await p.locator('[data-k="thu_tread_time"]').fill('0');await p.locator('[data-k="thu_tread_distance"]').fill('0');await p.locator('#gen').click();record('Cero tiempo y cero distancia siguen permitidos',await p.locator('#output').isVisible());

 }finally{await b.close()}
}
(async()=>{
 try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});baseURL='http://127.0.0.1:'+server.address().port+'/';
 for(const [engine,name]of [[chromium,'Chromium'],[webkit,'WebKit']]){try{await test(engine,name)}catch(e){results.push({engine:name,test:'Finalización completa del recorrido',status:'FAIL',detail:e.message});}}
 await edgeCases();
 fs.writeFileSync(path.join(outputDir,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({outputDir,results},null,2));
 if(!results.some(r=>r.engine==='Chromium'&&r.status==='PASS')||results.some(r=>r.status==='FAIL'))process.exitCode=1;
 }catch(e){console.error(e);process.exitCode=1}finally{await new Promise(r=>server.close(r))}
})();
