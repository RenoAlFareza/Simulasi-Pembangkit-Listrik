'use strict';
(() => {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const Engine=window.PLTAPhysics, KEY='plta-lkpd-v1', MAX_POWER=83.385;
const PRESETS=Engine.PRESETS, icons={dry:'☀',transition:'◒',wet:'☂',manual:'≋'};
const newRow=()=>({h:'',q:'',p:'',led:'',t:'',duration:'',weather:'',energy:'',demand:''});
const emptyRows=()=>Array.from({length:3},newRow);
let state={model:'operator',h:60,q:40,recordTarget:'height',preset:'manual',duration:30,gate:60,inflow:55,release:5,scale:600,demand:20,fields:{},rows:{height:emptyRows(),flow:emptyRows()},operatorRows:[]};
let storageOK=true;
try{
 const saved=JSON.parse(localStorage.getItem(KEY)||'null');
 if(saved?.version===1){
  for(const [key,lo,hi] of [['h',0,100],['q',0,100],['gate',0,100],['inflow',0,200],['release',0,30]])if(Number.isFinite(saved[key]))state[key]=Math.max(lo,Math.min(hi,saved[key]));
  if(['operator','basic'].includes(saved.model))state.model=saved.model;
  if(['height','flow'].includes(saved.recordTarget))state.recordTarget=saved.recordTarget;
  if(['manual','dry','transition','wet'].includes(saved.preset))state.preset=saved.preset;
  if(PRESETS[state.preset]&&!Number.isFinite(saved.inflow))state.inflow=PRESETS[state.preset].inflow;
  if([30,60,90,120,150,180].includes(saved.duration))state.duration=saved.duration;
  if([1,60,600].includes(saved.scale))state.scale=saved.scale;
  if([5,20,40].includes(saved.demand))state.demand=saved.demand;
  if(saved.fields&&typeof saved.fields==='object')for(const [k,v]of Object.entries(saved.fields))if(typeof v==='string')state.fields[k]=v;
  for(const type of ['height','flow'])if(Array.isArray(saved.rows?.[type]))state.rows[type]=Array.from({length:Math.max(3,Math.min(20,saved.rows[type].length))},(_,i)=>{const row=newRow();for(const k of Object.keys(row)){const v=saved.rows[type][i]?.[k];if(typeof v==='string'||typeof v==='number')row[k]=v;}return row;});
  if(Array.isArray(saved.operatorRows))state.operatorRows=saved.operatorRows.filter(r=>r&&typeof r==='object'&&Number.isFinite(r.energy)&&Number.isFinite(r.finalH)&&Number.isFinite(r.initialH)).slice(-20).map(r=>({...r}));
 }
}catch{storageOK=false;}
let runState='ready',elapsed=0,clockOrigin=0,clockFrame=0,toastTimer,history=[],lastSample=-1,lastPaint=0,lastChart=0,runMeta=null;
const op=()=>state.model==='operator';
const cfg=()=>({model:state.model,initialH:state.h,flow:state.q,gate:state.gate,inflow:state.inflow,otherRelease:state.release,season:state.preset,scale:state.scale,demandMW:state.demand});
let sim=Engine.create(cfg());
const num=(n,d=2)=>Number(n||0).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
const hasValue=v=>v!==''&&v!==null&&v!==undefined;
const complete=row=>['h','q','p','led'].every(k=>hasValue(row[k]));
const active=()=>['running','paused','finished'].includes(runState);
const timeText=seconds=>{const n=Math.max(0,Math.ceil(seconds));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
const operationTime=seconds=>{const n=Math.max(0,Math.round(seconds));return String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n/60)%60).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
const supply=(p,demand=state.demand)=>p>=demand-1e-8?'Cukup':'Kurang';
const unitStatus=()=>sim.status==='low-water'?'Batas air minimum':sim.status==='gate-closed'?'Pintu tertutup':sim.status==='basic'?'Model ideal':'Beroperasi';
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),5000);}
function save(){try{localStorage.setItem(KEY,JSON.stringify({...state,version:1}));storageOK=true;}catch{storageOK=false;}$('#save-status').textContent=storageOK?'Tersimpan di perangkat ini':'Penyimpanan tidak tersedia · unduh jawabanmu';updateProgress();}
function updateProgress(){
 const fields=op()?['kelas','kelompok','tanggal','anggota','hipotesis','analisisOperator','kesimpulan']:['kelas','kelompok','tanggal','anggota','hipotesis','analisis1','analisis2','kesimpulan'];
 const n=fields.filter(k=>state.fields[k]?.trim()).length+(op()?Number(state.operatorRows.length>0):['height','flow'].filter(k=>state.rows[k].every(complete)).length),total=op()?8:10;
 $('#progress').max=total;$('#progress').value=n;$('#progress-label').textContent=`${n} dari ${total}`;
}
function goTo(selector){const el=$(selector);if(!el)return;if(el.tagName==='DETAILS')el.open=true;el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
$$('.worksheet-aside a').forEach(a=>a.onclick=e=>{e.preventDefault();goTo(a.getAttribute('href'));});
$('#write-prediction').onclick=()=>goTo('#hypothesis');$('#open-analysis').onclick=()=>goTo('#analysis');
function cancelClock(){cancelAnimationFrame(clockFrame);clockFrame=0;}
function addSample(force=false){if(force||elapsed-lastSample>=.5){const point={t:sim.simSeconds,h:sim.h,p:active()?sim.powerMW:0};history.push(point);if(history.length>800)history.splice(1,1);lastSample=elapsed;}}
function resetClock(){cancelClock();elapsed=0;runState='ready';runMeta=null;sim=Engine.create(cfg());history=[];lastSample=-1;lastPaint=0;lastChart=0;}
function drawClock(){
 $('#timer').textContent=timeText(state.duration-elapsed);$('#mini-time').textContent=timeText(state.duration-elapsed);
 $('#operating-clock').textContent=operationTime(sim.simSeconds);$('#timer-progress').max=state.duration;$('#timer-progress').value=elapsed;
 $('#timer-label').textContent=runState==='running'?'WAKTU TERSISA':runState==='paused'?'WAKTU DIJEDA':runState==='finished'?'PERCOBAAN SELESAI':'SIAP DIMULAI';
}
function syncClock(now=performance.now()){
 if(runState!=='running')return;
 const next=Math.min(state.duration,Math.max(elapsed,(now-clockOrigin)/1000));
 while(elapsed<next){const boundary=(Math.floor(elapsed*2+1e-9)+1)/2,target=Math.min(next,boundary);Engine.step(sim,cfg(),target-elapsed);elapsed=target;addSample();}
 if(elapsed>=state.duration){runState='finished';cancelClock();addSample(true);render();notify('Percobaan selesai. Amati grafik, catat di buku, lalu isi LKPD.');}
 else if(now-lastPaint>=80){paint();lastPaint=now;if(now-lastChart>=250){drawCharts();lastChart=now;}}
}
function tick(now){syncClock(now);if(runState==='running')clockFrame=requestAnimationFrame(tick);}
function begin(){
 if(runState==='running')return;
 if(runState!=='paused'){
  resetClock();runMeta={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),initialH:state.h,initialGate:state.gate,initialInflow:state.inflow,initialRelease:state.release,initialSeason:state.preset,scale:op()?state.scale:1,model:state.model,changes:[]};
 }
 runState='running';clockOrigin=performance.now()-elapsed*1000;addSample(true);render();clockFrame=requestAnimationFrame(tick);
}
function beforeChange(resetRun=false){if(runState==='paused')return false;syncClock();if(resetRun||runState==='finished')resetClock();return true;}
function updateWeather(){
 const p=PRESETS[state.preset];$('#weather').value=p?state.preset:'manual';$('#scene-weather-name').textContent=p?p.label:'Kondisi manual';$('#scene-weather-icon').textContent=icons[state.preset]||'≋';
 $('#sky-top').setAttribute('stop-color',state.preset==='wet'?'#d7e6df':state.preset==='dry'?'#f1f0dc':'#e7f2eb');$('#sky-bottom').setAttribute('stop-color','#f5f7eb');$('#sun').setAttribute('opacity',state.preset==='wet'?'.18':'.75');$('#weather-clouds').setAttribute('opacity',state.preset==='wet'?'.95':'.55');$('#rain').setAttribute('opacity',state.preset==='wet'?'.6':'0');
 $('#weather').disabled=runState==='paused'||(op()&&runState==='running');
 // Kedua variabel bebas: preset hanya memasang nilai awal, tidak mengunci apa pun.
 $('#weather-hint').textContent='Preset mengisi H dan Q. Keduanya tetap bisa kamu ubah.';$('#weather-hint').hidden=false;
}
function render(){
 const paused=runState==='paused',running=runState==='running',finished=runState==='finished';
 document.body.classList.toggle('model-operator',op());document.body.classList.toggle('model-basic',!op());
 $('#choose-basic').classList.toggle('selected',!op());$('#choose-operator').classList.toggle('selected',op());
 $('#choose-basic').setAttribute('aria-pressed',String(!op()));$('#choose-operator').setAttribute('aria-pressed',String(op()));$('#choose-basic').disabled=paused;$('#choose-operator').disabled=paused;
 $('#model-explanation').textContent=op()?'Atur tinggi awal, pintu, pasokan sungai, dan skala waktu. Tinggi air berubah otomatis.':'Ubah satu variabel untuk membandingkan daya. Variabel lainnya dijaga tetap.';
 $('#scene-model-caption').textContent=op()?'Waduk dinamis · waktu '+state.scale+'×':'Percobaan dasar · waktu 1×';
 $('#height-title').textContent=op()?(active()?'Tinggi air saat ini':'Tinggi awal waduk'):'Ketinggian air';$('#height').value=state.h;$('#flow').value=state.q;$('#record-target').value=state.recordTarget;
 // Kedua variabel bebas diubah; H dan Q hanya dikunci saat jeda, atau saat
 // operasi waduk berjalan (di sana H dihitung otomatis oleh neraca air).
 $('#height').disabled=paused||(op()&&running);$('#flow').disabled=paused;$('#record-target').disabled=paused;
 $('#h-lock').textContent=paused?'Dikunci saat jeda':op()?(running?'Otomatis':'Sebelum mulai'):'';
 $('#q-lock').textContent=paused?'Dikunci saat jeda':'';
 for(const [id,key,out,unit] of [['gate','gate','gate-value','%'],['inflow','inflow','inflow-value','m³/s'],['other-release','release','other-value','m³/s']]){$('#'+id).value=state[key];$('#'+id).disabled=paused;$('#'+out).innerHTML=num(state[key],0)+' <small>'+unit+'</small>';$('#'+id).style.setProperty('--percent',(state[key]/Number($('#'+id).max)*100)+'%');}
 $('#height').style.setProperty('--percent',state.h+'%');$('#flow').style.setProperty('--percent',state.q+'%');
 $('#time-scale').value=state.scale;$('#time-scale').disabled=running||paused;$('#scale-hint').textContent=`${state.duration} detik → ${num(state.duration*state.scale/3600,2)} jam operasi`;
 $('#demand').value=state.demand;$('#demand').disabled=paused;$('#duration').value=state.duration;$('#duration').disabled=running||paused;$('#duration-value').innerHTML=state.duration+' <small>detik</small>';$('#duration').style.setProperty('--percent',((state.duration-30)/150*100)+'%');
 $('#start').textContent=paused?'▶ Lanjutkan':finished?'↻ Ulangi':'▶ Mulai';$('#start').disabled=running;$('#start').title=paused?'Lanjutkan sisa waktu':'Mulai percobaan';$('#pause').disabled=!running;$('#pause').setAttribute('aria-pressed',String(paused));$('#stop').disabled=!active();
 const already=runMeta&&state.operatorRows.some(r=>r.id===runMeta.id);
 $('#record-text').textContent=op()?'Catat ringkasan LKPD':'Catat ke LKPD';$('#record').disabled=op()?(!finished||already):!active();$('#summary-record').disabled=op()?(!finished||already):!active();
 $('#record').setAttribute('aria-label',op()?'Catat ringkasan operasi ke LKPD':'Catat hasil saat ini ke LKPD');
 $('#record-hint').textContent=op()?(already?'Sudah tercatat.':finished?'Ringkasan siap dicatat.':'Tersedia setelah selesai.'):!active()?'Tekan Mulai untuk menjalankan.':state.rows[state.recordTarget].filter(complete).length+'/'+state.rows[state.recordTarget].length+' pengamatan tercatat.';
 $('#timer-hint').textContent=finished?'Hasil dibekukan.':paused?'Kedua jam dijeda.':'Berhenti otomatis saat waktu habis.';
 $('#results-model').textContent=op()?'OPERASI WADUK':'PERCOBAAN DASAR';$('#result-note').hidden=!finished;$('#result-note').textContent=finished?'Selesai · hasil dibekukan.':'';
 $('#power-explanation').textContent=op()?'Daya mengikuti debit aktual, head bersih, efisiensi, dan kapasitas 50 MW. Energi menjumlahkan produksi sepanjang waktu operasi.':'H dan Q tetap menghasilkan daya tetap. Energi tetap bertambah selama percobaan berlangsung.';
 $('#physics-note').textContent=op()?'P = ρ g Q H bersih η. H bersih = tinggi air − kehilangan head. Kerugian pipa meningkat dengan debit; efisiensi mengikuti kurva sintetis. Turbin berhenti pada ≤15 m dan aktif kembali setelah ≥15,1 m.':'P = 0,0083385 × Q × H (MW). Efisiensi tetap 85%, tanpa kehilangan head. Muka air dipertahankan tetap untuk mengisolasi pengaruh variabel.';
 $('#chart-note').textContent=op()?`Waktu operasi ${state.scale}× · sumbu vertikal otomatis.`:'Waktu nyata 1× · sumbu vertikal otomatis.';
 updateWeather();paint();drawCharts();renderSummary();updateProgress();
}
function paint(){
 const p=active()?sim.powerMW:0,q=active()?sim.q:0,h=sim.h,ratio=p/(op()?50:MAX_POWER),met=p>=state.demand-1e-8&&active(),surface=550-h*3.6,labelY=Math.min(550,Math.max(190,(surface+550)/2));
 $('#power').textContent=num(p);$('#power-bar').style.width=Math.min(100,ratio*100)+'%';$('#led-status').textContent=active()?supply(p):'Belum aktif';$('#supply-detail').textContent=active()?`${num(p)} MW tersedia / ${state.demand} MW kebutuhan · ${met?'beban contoh tercukupi':'kekurangan '+num(Math.max(0,state.demand-p))+' MW'}`:'Tekan Mulai untuk membandingkan pasokan dan kebutuhan.';
 $('#h-value').innerHTML=num(op()?h:state.h,op()?2:0)+' <small>m</small>';$('#q-value').innerHTML=num(state.q,0)+' <small>m³/s</small>';
 $('#lamp').setAttribute('fill',met?'#ffe48a':'#c4d1bd');$('#lamp-glow').setAttribute('opacity',met?'.65':'0');$('#house-window').setAttribute('fill',met?'#f9df87':'#c6d2bd');$('#led-dot').style.background=met?'#65986b':active()?'#c59450':'#a3b096';$('#led-dot').style.boxShadow='none';
 $('#water-level').setAttribute('y',surface);$('#water-level').setAttribute('height',578-surface);$('#surface-line').setAttribute('d',`M0 ${surface}H330`);$('#water-clip-path').setAttribute('d',`M0 ${surface}H330V578H0Z`);$('#head-line').setAttribute('d',h<=0?'':`M72 ${surface}V550M65 ${surface+7}L72 ${surface} 79 ${surface+7}M65 543L72 550 79 543`);$('#head-label-bg').setAttribute('y',labelY-17);$('#head-label').setAttribute('y',labelY+7);$('#head-label').textContent='H '+num(h,op()?1:0)+' m';
 const incoming=op()&&active()?sim.inflow:0,spill=op()&&active()?sim.spillFlow:0,y=Math.min(462,Math.max(220,surface+28));
 $('#inflow-arrow').setAttribute('d',`M10 ${y}H166`);$('#inflow-arrowhead').setAttribute('d',`M151 ${y-7}L166 ${y} 151 ${y+7}`);$('#inflow-label').setAttribute('y',y-14);$('#inflow-label').textContent='Sungai '+num(incoming,1)+' m³/s';$('#inflow-arrow').setAttribute('opacity',incoming>0?'.8':'.2');$('#inflow-arrowhead').setAttribute('opacity',incoming>0?'.8':'.2');document.documentElement.style.setProperty('--spill-opacity',spill>0?'1':'0');$('#spill-water').setAttribute('opacity',spill>0?'1':'0');$('#spill-flow').setAttribute('opacity',spill>0?'1':'0');
 $('#scene-inflow').textContent=num(incoming,1);$('#scene-outflow').textContent=num(q,1);$('#scene-spill').textContent=num(spill,1);
 document.documentElement.style.setProperty('--speed',(3.4-Math.min(1,q/100)*2.7)+'s');document.documentElement.style.setProperty('--spin','1.6s');document.documentElement.style.setProperty('--electric-opacity',p>0?'.85':'0');document.documentElement.style.setProperty('--electric-speed','1.5s');document.documentElement.style.setProperty('--route-opacity',p>0?'.24':'0');document.documentElement.style.setProperty('--aura-opacity',p>0?'.22':'0');
 document.body.classList.toggle('stopped',p===0);document.body.classList.toggle('paused',runState==='paused');document.body.classList.toggle('finished',runState==='finished');document.body.classList.toggle('idle',!active());
 $('#plant-status').textContent=runState==='ready'?'Siap · tentukan prediksi':runState==='stopped'?'Dihentikan · keluaran dimatikan':runState==='finished'?'Selesai · hasil dibekukan':runState==='paused'?'Simulasi dijeda':op()?unitStatus():'Percobaan dasar berjalan';
 $('#energy-value').innerHTML=num(sim.energyMWh,3)+' <small>MWh</small>';$('#volume-value').innerHTML=num(sim.turbineVolume,0)+' <small>m³</small>';$('#live-height').innerHTML=num(h,2)+' <small>m</small>';$('#live-flow').innerHTML=num(q,2)+' <small>m³/s</small>';
 $('#height-trend').textContent=!active()?'':op()?`Δ ${h-state.h>=0?'+':''}${num(h-state.h,3)} m`:'H tetap';
 $('#inflow-detail').textContent=op()?`Masuk ${num(incoming,1)} · pelepasan lain ${num(active()?sim.otherFlow:0,1)} · pelimpah ${num(spill,1)} m³/s.`:'Debit diatur langsung untuk percobaan terkontrol.';
 $('#net-head').textContent=num(sim.netHead)+' m';$('#head-loss').textContent=num(sim.headLoss)+' m';$('#efficiency').textContent=num(sim.efficiency*100,1)+'%';$('#unit-state').textContent=active()?unitStatus():'Siap';
 $('#mini-h').textContent=num(h,1);$('#mini-q').textContent=num(q,1);$('#mini-p').textContent=num(p);drawClock();
}
function svgElement(tag,attrs={},value){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(value!==undefined)e.textContent=value;return e;}
function plot(id,key,label,color){
 const svg=$('#'+id),points=history.length?history:[{t:0,h:sim.h,p:0}],values=points.map(r=>r[key]);let lo=Math.floor((Math.min(...values)-.1)*10)/10,hi=Math.ceil((Math.max(...values)+.1)*10)/10;
 lo=Math.max(0,lo);if(hi-lo<1){const mid=(hi+lo)/2;lo=Math.max(0,mid-.5);hi=lo+1;}hi=key==='h'?Math.min(100,hi):hi;if(hi<=lo){lo=Math.max(0,hi-1);}
 const maxT=Math.max(1,points.at(-1).t),hours=maxT>=3600,divisor=hours?3600:maxT>=60?60:1,unit=hours?'jam':maxT>=60?'menit':'detik',x=t=>54+t/maxT*484,y=v=>192-(v-lo)/(hi-lo)*154;
 const frag=document.createDocumentFragment();frag.append(svgElement('title',{},label));
 for(let i=0;i<4;i++){const v=lo+(hi-lo)*i/3,yy=y(v);frag.append(svgElement('path',{d:`M54 ${yy}H538`,stroke:'#e1e8db','stroke-width':1}));frag.append(svgElement('text',{x:46,y:yy+4,'text-anchor':'end',class:'chart-tick'},num(v,key==='h'?2:1)));}
 for(let i=0;i<=4;i++){const t=maxT*i/4;frag.append(svgElement('text',{x:x(t),y:212,'text-anchor':'middle',class:'chart-tick'},num(t/divisor,t/divisor<10?1:0)));}
 frag.append(svgElement('text',{x:538,y:232,'text-anchor':'end',class:'chart-tick'},'Waktu operasi ('+unit+')'));frag.append(svgElement('text',{x:54,y:20,class:'chart-unit'},key==='h'?'Tinggi (m)':'Daya (MW)'));
 frag.append(svgElement('path',{d:points.map((r,i)=>(i?'L':'M')+x(r.t).toFixed(2)+' '+y(r[key]).toFixed(2)).join(' '),fill:'none',stroke:color,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));
 const end=points.at(-1);frag.append(svgElement('circle',{cx:x(end.t),cy:y(end[key]),r:4,fill:color}));svg.replaceChildren(frag);svg.setAttribute('aria-label',`${label}. ${points.length} titik. Awal ${num(points[0][key])}, akhir ${num(end[key])}; waktu operasi ${operationTime(end.t)}.`);
}
function drawCharts(){plot('chart-height','h','Grafik tinggi air terhadap waktu','#248b8a');plot('chart-power','p','Grafik daya terhadap waktu','#ba8a47');const first=history[0],last=history.at(-1);for(const[id,key,unit]of[['height-chart-change','h','m'],['power-chart-change','p','MW']]){const delta=first?last[key]-first[key]:0;$('#'+id).textContent='Δ '+(delta>0?'+':'')+num(delta,3)+' '+unit;}}
function summaryRecord(){return {id:runMeta.id,model:state.model,initialH:runMeta.initialH,finalH:sim.h,energy:sim.energyMWh,volume:sim.turbineVolume,seconds:sim.simSeconds,duration:state.duration,scale:runMeta.scale,initialGate:runMeta.initialGate,finalGate:state.gate,initialInflow:runMeta.initialInflow,finalInflow:sim.inflow,inflowVolume:sim.inflowVolume,otherVolume:sim.otherVolume,spillVolume:sim.spillVolume,averagePower:sim.simSeconds?sim.energyMWh*3600/sim.simSeconds:0,finalPower:sim.powerMW,season:runMeta.initialSeason,finalSeason:state.preset,release:state.release,demand:state.demand,changes:runMeta.changes.map(c=>({...c})),question:$('#analysis-question').textContent};}
function renderSummary(){
 const visible=runState==='finished';$('#experiment-summary').hidden=!visible;if(!visible)return;
 const values=[['Tinggi awal → akhir',num(runMeta.initialH)+' → '+num(sim.h)+' m'],['Energi terkumpul',num(sim.energyMWh,3)+' MWh'],['Air turbin',num(sim.turbineVolume,0)+' m³'],['Daya rata-rata',num(sim.energyMWh*3600/Math.max(1,sim.simSeconds))+' MW'],['Waktu operasi',operationTime(sim.simSeconds)],['Air pelimpah',num(sim.spillVolume,0)+' m³']];
 $('#summary-values').replaceChildren(...values.map(([k,v])=>{const d=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;d.append(dt,dd);return d;}));
 const delta=sim.h-runMeta.initialH;
 $('#summary-explanation').textContent=!op()?'H dan Q terkontrol.':Math.abs(delta)<.00005?'Air masuk ≈ air keluar: tampungan stabil.':delta>0?'Air masuk > air keluar: tampungan naik.':'Air keluar > air masuk: tampungan turun.';
 $('#analysis-question').textContent=op()&&runMeta.changes.length?'Bagaimana perubahan kendali yang Anda lakukan memengaruhi grafik tinggi air dan daya? Bandingkan kondisi sebelum dan sesudah perubahan.':!op()?'Bagaimana perubahan satu variabel memengaruhi daya? Jika daya tetap, mengapa energi terkumpul masih bertambah?':sim.spillVolume>0?'Mengapa ada air yang melewati pelimpah? Apakah seluruh air keluar menghasilkan listrik?':sim.status==='low-water'?'Mengapa turbin berhenti meskipun waduk masih berisi air? Jelaskan batas operasi dan kebutuhan air lainnya.':state.gate===0?'Mengapa waduk dapat bertambah tinggi tetapi tidak menghasilkan listrik ketika pintu turbin tertutup?':'Mengapa tinggi dan daya berubah meskipun bukaan pintu dipertahankan? Bandingkan air masuk, air keluar, head dan efisiensi.';
 $('#challenge-result').textContent=op()?`Target tinggi akhir ≥25 m: ${sim.h>=25?'tercapai':'belum tercapai'}.`:'';
}
$('#start').onclick=begin;
$('#pause').onclick=()=>{syncClock();if(runState==='running'){cancelClock();runState='paused';render();}};
$('#stop').onclick=()=>{resetClock();runState='stopped';render();notify('Percobaan dihentikan dan dikembalikan ke kondisi awal. Isian LKPD tetap tersimpan.');};
$('#reset-sim').onclick=()=>{cancelClock();Object.assign(state,{h:60,q:40,recordTarget:'height',preset:'manual',duration:30,gate:60,inflow:55,release:5,scale:600,demand:20});resetClock();render();save();notify('Pengaturan awal dipulihkan. Catatan LKPD tetap tersimpan.');};
function changeModel(model){if(state.model===model)return;state.model=model;resetClock();render();save();}
$('#choose-basic').onclick=()=>changeModel('basic');$('#choose-operator').onclick=()=>changeModel('operator');
function selectMode(type){state.model='basic';state.recordTarget=type;const ctrl=type==='height'?'q':'h',prior=state.rows[type].find(r=>hasValue(r[ctrl]));if(prior&&Number.isFinite(Number(prior[ctrl])))state[ctrl]=Math.min(100,Math.max(0,Number(prior[ctrl])));resetClock();render();save();}
$('#record-target').onchange=e=>{if(runState==='paused')return;state.recordTarget=e.target.value;render();save();};$$('[data-start]').forEach(b=>b.onclick=()=>{selectMode(b.dataset.start);goTo('#sim');});
for(const[id,key]of[['height','h'],['flow','q'],['gate','gate'],['inflow','inflow'],['other-release','release']])$('#'+id).oninput=e=>{if(!beforeChange())return;state[key]=Number(e.target.value);if(['h','q','inflow'].includes(key))state.preset='manual';if(active()&&runMeta)runMeta.changes.push({seconds:sim.simSeconds,variable:key,value:state[key]});if(op()&&!active()&&key==='h')resetClock();else Engine.update(sim,cfg());if(active())addSample(true);render();save();};
$('#weather').onchange=e=>{if(!beforeChange(true))return;state.preset=e.target.value;const p=PRESETS[state.preset];if(p){state.h=p.h;state.q=p.q;state.inflow=p.inflow;}resetClock();render();save();};
$('#duration').oninput=e=>{if(['running','paused'].includes(runState))return;state.duration=Number(e.target.value);resetClock();render();save();};
$('#time-scale').onchange=e=>{if(['running','paused'].includes(runState))return;state.scale=Number(e.target.value);resetClock();render();save();};
$('#demand').onchange=e=>{if(!beforeChange())return;state.demand=Number(e.target.value);Engine.update(sim,cfg());render();save();};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncClock();}});
function validateRows(type){
 const rows=state.rows[type].filter(r=>hasValue(r.h)||hasValue(r.q));
 // Kedua variabel bebas, jadi yang diperiksa bukan lagi "kolom kontrol tetap"
 // melainkan pasangan H/Q kembar: dua baris dengan nilai sama tidak menambah data.
 const messages=[],pairs={};
 rows.forEach(r=>{if(!hasValue(r.h)||!hasValue(r.q))return;const pair=String(r.h).trim()+'|'+String(r.q).trim();if(pairs[pair])messages.push('Ada baris dengan pasangan H dan Q yang sama; ubah minimal satu nilai.');pairs[pair]=true;});
 const invalid=state.rows[type].some(r=>['h','q','p'].some(k=>hasValue(r[k])&&(!Number.isFinite(Number(r[k]))||Number(r[k])<0||Number(r[k])>(k==='p'?MAX_POWER:100))));
 if(invalid) messages.push('Periksa batas nilai: tinggi/debit 0–100 dan daya 0–83,385 MW.');
 $('#feedback-'+type).textContent=messages.join(' ');
}
function clearCapture(row,tr){row.energy='';row.weather='';row.demand='';}
function renderRows(){
 for(const type of ['height','flow']){
  const tbody=$('#table-'+type);tbody.replaceChildren();const order=type==='height'?['q','h','p']:['h','q','p'];
  state.rows[type].forEach((row,i)=>{
   const tr=document.createElement('tr'),n=document.createElement('td');n.textContent=i+1;tr.append(n);
   for(const key of order){const td=document.createElement('td'),input=document.createElement('input');input.type='number';input.min='0';input.max=key==='p'?String(MAX_POWER):'100';input.step='any';input.inputMode='decimal';input.placeholder='—';input.value=row[key];input.setAttribute('aria-label',`${type==='height'?'Tabel 1':'Tabel 2'}, baris ${i+1}, ${key==='h'?'ketinggian dalam meter':key==='q'?'debit dalam meter kubik per detik':'daya dalam megawatt'}`);input.oninput=()=>{state.rows[type][i][key]=input.value;clearCapture(state.rows[type][i],tr);validateRows(type);save();};td.append(input);tr.append(td);}
   const td=document.createElement('td'),sel=document.createElement('select');sel.setAttribute('aria-label',`Pasokan beban percobaan ${type==='height'?1:2}, baris ${i+1}`);
   ['','Cukup','Kurang','Mati','Redup','Sedang','Terang'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v||'Pilih';sel.append(o);});sel.value=row.led;sel.onchange=()=>{state.rows[type][i].led=sel.value;clearCapture(state.rows[type][i],tr);save();};td.append(sel);tr.append(td);
   const timing=document.createElement('td');timing.className='observation-time';
   for(const [key,label,max]of [['t','Waktu teramati',180],['duration','Durasi',180]]){const input=document.createElement('input');input.type='number';input.min=key==='duration'?'30':'0';input.max=String(max);input.step=key==='duration'?'30':'any';input.inputMode='decimal';input.placeholder=key==='t'?'Waktu':'Durasi';input.value=row[key];input.setAttribute('aria-label',`${label} detik percobaan ${type==='height'?1:2}, baris ${i+1}`);input.oninput=()=>{row[key]=input.value;row.energy='';save();};const labelWrap=document.createElement('label');labelWrap.textContent=label;labelWrap.append(input);timing.append(labelWrap);}tr.append(timing);
   const action=document.createElement('td'),del=document.createElement('button');del.textContent='×';del.setAttribute('aria-label',`${state.rows[type].length>3?'Hapus':'Kosongkan'} baris ${i+1} percobaan ${type==='height'?1:2}`);del.onclick=()=>{if(state.rows[type].length>3)state.rows[type].splice(i,1);else state.rows[type][i]=newRow();renderRows();render();save();notify('Baris pengamatan dikosongkan.');};action.append(del);tr.append(action);[...tr.children].forEach((cell,j)=>cell.dataset.label=['Pengamatan','Debit (m³/s)','Tinggi (m)','Daya (MW)','Pasokan beban','Waktu / durasi (detik)','Aksi'][j]);if(type==='flow'){tr.children[1].dataset.label='Tinggi (m)';tr.children[2].dataset.label='Debit (m³/s)';}tbody.append(tr);
  });validateRows(type);
 }
}
function renderOperatorRows(){
 const body=$('#table-operator');body.replaceChildren();
 if(!state.operatorRows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.className='empty-data';td.textContent='Belum ada percobaan operasi yang dicatat. Jalankan sampai selesai, lalu catat ringkasannya.';tr.append(td);body.append(tr);return;}
 state.operatorRows.forEach((r,i)=>{const tr=document.createElement('tr'),condition=(PRESETS[r.season]?.label||'Manual')+` · pintu ${r.initialGate}→${r.finalGate}%`,values=[i+1,condition,num(r.initialH)+' → '+num(r.finalH),num(r.energy,3),num(r.volume,0),operationTime(r.seconds)+` (${r.scale}×)`];
  for(const value of values){const td=document.createElement('td');td.textContent=value;td.dataset.label=['Pengamatan','Kondisi','Tinggi awal → akhir (m)','Energi (MWh)','Air turbin (m³)','Waktu operasi'][tr.children.length];tr.append(td);}const td=document.createElement('td'),button=document.createElement('button');button.textContent='×';button.setAttribute('aria-label',`Hapus ringkasan operasi ${i+1}`);button.onclick=()=>{state.operatorRows.splice(i,1);renderOperatorRows();render();save();};td.append(button);tr.append(td);body.append(tr);
 });
}
function record(){
 syncClock();
 if(op()){
  if(runState!=='finished'||!runMeta){notify('Jalankan operasi sampai timer selesai sebelum mencatat ringkasan.');return;}
  if(state.operatorRows.some(r=>r.id===runMeta.id)){notify('Ringkasan percobaan ini sudah tercatat.');return;}
  if(state.operatorRows.length>=20){notify('Maksimal 20 ringkasan. Unduh jawaban lalu hapus catatan yang tidak diperlukan.');return;}
  state.operatorRows.push(summaryRecord());renderOperatorRows();render();save();notify('Ringkasan operasi dicatat. Tuliskan penjelasan dengan kata-kata kelompokmu.');return;
 }
 if(!active()){notify('Tekan Mulai sebelum mencatat hasil.');return;}
 const type=state.recordTarget,rows=state.rows[type];
 if(rows.some(r=>hasValue(r.h)&&hasValue(r.q)&&Number(r.h)===Number(state.h)&&Number(r.q)===Number(state.q))){notify('Pasangan H dan Q ini sudah tercatat. Ubah minimal satu variabel.');return;}
 if(rows.some(r=>hasValue(r.demand)&&Number(r.demand)!==state.demand)){notify('Samakan kebutuhan beban contoh dengan pengamatan sebelumnya.');return;}
 const i=rows.findIndex(r=>Object.values(r).every(v=>!hasValue(v)));if(i<0){notify('Semua baris terisi atau terisi sebagian. Tambahkan baris atau periksa tabel.');return;}
 rows[i]={h:state.h,q:state.q,p:Number(sim.powerMW.toFixed(4)),led:supply(sim.powerMW),t:Number(elapsed.toFixed(1)),duration:state.duration,weather:state.preset,energy:sim.energyMWh,demand:state.demand};renderRows();render();save();notify(`Pengamatan ${i+1}/${rows.length} dicatat · ${num(sim.powerMW)} MW.`);
}
$$('[data-add-row]').forEach(button=>button.onclick=()=>{const type=button.dataset.addRow;if(state.rows[type].length>=20){notify('Maksimal 20 baris per tabel.');return;}state.rows[type].push(newRow());renderRows();save();});
$('#record').onclick=record;$('#summary-record').onclick=record;
$$('[data-field]').forEach(el=>{el.value=state.fields[el.dataset.field]||'';el.oninput=()=>{state.fields[el.dataset.field]=el.value;save();};});
function exportText(){
 const f=state.fields,lines=['LKPD — PLTA','',`Kelas: ${f.kelas||'—'}`,`Kelompok: ${f.kelompok||'—'}`,`Tanggal: ${f.tanggal||'—'}`,`Anggota:\n${f.anggota||'—'}`,'','HIPOTESIS',f.hipotesis||'—','','HASIL PERCOBAAN DASAR'];
 for(const type of ['height','flow']){lines.push('',type==='height'?'Tabel 1 — Ketinggian air':'Tabel 2 — Debit air');state.rows[type].forEach((r,i)=>lines.push(`${i+1}. H: ${hasValue(r.h)?r.h:'—'} m | Q: ${hasValue(r.q)?r.q:'—'} m³/s | P: ${hasValue(r.p)?r.p:'—'} MW | Pasokan: ${r.led||'—'} | Beban: ${r.demand||'—'} MW | Waktu: ${hasValue(r.t)?r.t:'—'} / ${r.duration||'—'} detik | Energi: ${hasValue(r.energy)?num(r.energy,6):'—'} MWh`));const warning=$('#feedback-'+type).textContent;if(warning)lines.push('Catatan: '+warning);}
 lines.push('','HASIL OPERASI WADUK');
 state.operatorRows.forEach((r,i)=>lines.push('',`Operasi ${i+1}: ${PRESETS[r.season]?.label||'Manual'} → ${PRESETS[r.finalSeason]?.label||'Manual'}`,`Tinggi awal/akhir: ${num(r.initialH,4)} / ${num(r.finalH,4)} m`,`Bukaan awal/akhir: ${r.initialGate}% / ${r.finalGate}%`,`Sungai awal/akhir: ${num(r.initialInflow)} / ${num(r.finalInflow)} m³/s`,`Waktu percobaan: ${r.duration} detik; skala ${r.scale}×; waktu operasi ${operationTime(r.seconds)}`,`Energi: ${num(r.energy,6)} MWh; daya rata-rata ${num(r.averagePower)} MW; daya akhir ${num(r.finalPower)} MW`,`Air masuk: ${num(r.inflowVolume,0)} m³; air turbin: ${num(r.volume,0)} m³; pelepasan lain: ${num(r.otherVolume,0)} m³; pelimpah: ${num(r.spillVolume,0)} m³`,`Beban contoh: ${r.demand} MW`,`Perubahan kendali: ${(r.changes||[]).map(c=>operationTime(c.seconds)+' '+c.variable+'='+c.value).join('; ')||'Tidak ada'}`,`Pertanyaan: ${r.question||'—'}`));
 lines.push('','ANALISIS TABEL 1 — KETINGGIAN AIR',f.analisis1||'—','','ANALISIS TABEL 2 — DEBIT AIR',f.analisis2||'—','','ANALISIS OPERASI WADUK',f.analisisOperator||'—','','KESIMPULAN',f.kesimpulan||'—','','Model dasar: P(MW)=0,0083385*Q*H; η=85%; H tetap.','Model operasi: neraca volume air; luas 1 km²; H bersih dikurangi kerugian pipa; kurva debit/efisiensi sintetis; kapasitas 50 MW; batas operasi 15 m.','Energi dihitung dengan waktu operasi, termasuk faktor percepatan. Bukan data waduk tertentu.','Jawaban tidak dikirim melalui email.');
 const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LKPD_PLTA_'+(f.kelompok||'Kelompok').replace(/[^a-z0-9_-]/gi,'_')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Jawaban diunduh. Gunakan Cetak / Simpan PDF jika perlu.');
}
$('#export').onclick=exportText;
let openedDetails=[];
window.addEventListener('beforeprint',()=>{
 $$('.print-answer').forEach(n=>n.remove());openedDetails=$$('details').map(d=>d.open);$$('details').forEach(d=>d.open=true);
 $$('#lkpd input,#lkpd textarea,#lkpd select').forEach(el=>{const span=document.createElement('span');span.className='print-answer';span.textContent=(el.tagName==='SELECT'?el.selectedOptions[0]?.textContent:el.value)||'—';el.after(span);});
});
window.addEventListener('afterprint',()=>{$$('details').forEach((d,i)=>d.open=openedDetails[i]??false);$$('.print-answer').forEach(n=>n.remove());});
$('#print').onclick=()=>window.print();
$('#clear-sheet').onclick=()=>{if(!confirm('Hapus semua jawaban dan pengamatan LKPD di perangkat ini? Unduh dahulu jika diperlukan.'))return;state.fields={};state.rows={height:emptyRows(),flow:emptyRows()};state.operatorRows=[];$$('[data-field]').forEach(el=>el.value='');renderRows();renderOperatorRows();render();save();notify('Isian LKPD dikosongkan.');};
const dialog=$('#info-dialog');
function openInfo(html){dialog.classList.remove('zoomed');$('#dialog-content').innerHTML=html;dialog.showModal();}
const Process=window.PLTAProcess;
function showStage(id){
 const stages=Process?Process.PROCESS_STAGES:[],index=stages.findIndex(stage=>stage.id===id);
 if(index<0)return;
 const stage=stages[index];
 openInfo('<p class="eyebrow">TAHAP '+String(index+1).padStart(2,'0')+' / 07</p><h2>'+stage.title+'</h2><p>'+stage.text+'</p>'+
  '<div class="stage-navigation">'+
  '<button type="button" id="prev-stage"'+(index===0?' disabled':'')+'>← Sebelumnya</button>'+
  '<button type="button" id="next-stage"'+(index===stages.length-1?' disabled':'')+'>Selanjutnya →</button>'+
  '</div>');
 const prev=$('#prev-stage'),next=$('#next-stage');
 if(prev)prev.onclick=()=>showStage(stages[index-1].id);
 if(next)next.onclick=()=>showStage(stages[index+1].id);
}
$$('#plant [data-stage]').forEach(element=>{
 const id=element.dataset.stage;
 const stages=Process?Process.PROCESS_STAGES:[],index=stages.findIndex(stage=>stage.id===id);
 const title=index>=0?stages[index].title.replace(/^\d+\s+/,''):id;
 element.setAttribute('role','button');
 element.setAttribute('tabindex','0');
 element.setAttribute('aria-label','Tahap '+(index+1)+': '+title);
 element.addEventListener('click',()=>showStage(id));
 element.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){event.preventDefault();showStage(id);}
 });
});
$('.dialog-close').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}};
$('#help').onclick=()=>openInfo('<p class="eyebrow">PANDUAN BELAJAR</p><h2>Prediksi, amati, jelaskan.</h2><ol><li>Tulis hipotesis dan siapkan buku. Pilih <strong>Percobaan dasar</strong> untuk membandingkan H/Q secara terkontrol, atau <strong>Operasi waduk</strong> untuk mengelola persediaan air.</li><li>Pada operasi, atur tinggi awal, musim, bukaan pintu, dan skala waktu. 600× berarti 1 detik percobaan mewakili 10 menit operasi. Tinggi air mengikuti air masuk dan keluar; efisiensi, head bersih, dan kapasitas membatasi daya.</li><li>Tekan Mulai. Pintu dan pasokan sungai dapat diubah selama operasi. Jeda membekukan kedua jam dan seluruh animasi. Waktu tetap diperhitungkan jika tab berada di latar belakang; kembali ke tab akan menyinkronkan hasil.</li><li>Daya adalah produksi sesaat; energi menjumlahkan produksi sepanjang waktu operasi. Grafik memakai waktu operasi. Periksa rentang sumbu tinggi agar perubahan kecil tidak disalahartikan.</li><li>Saat selesai, catat pola di buku, jawab pertanyaan analisis, lalu catat ringkasan ke LKPD. Model dasar juga dapat dicatat saat berjalan/Jeda. Analisis tidak diisi otomatis.</li><li>Unduh TXT atau Cetak / Simpan PDF. Jawaban tersimpan di browser ini dan belum dikirim melalui email.</li></ol><p>Semua nilai karakteristik operasi adalah asumsi pembelajaran. Model ini tidak dikalibrasi terhadap waduk tertentu.</p>');
$('#formula-help').onclick=()=>openInfo('<p class="eyebrow">PAHAMI RUMUS</p><h2>Dari air menjadi daya listrik.</h2><p class="formula">P = ρ × g × Q × H × η</p><dl class="symbol-list"><dt>P · daya listrik</dt><dd>Energi listrik yang dihasilkan setiap detik. Rumus menghasilkan watt (W); dibagi 1.000.000 agar menjadi megawatt (MW).</dd><dt>ρ (rho) · massa jenis air</dt><dd>Massa tiap meter kubik air: 1.000 kg/m³.</dd><dt>g · percepatan gravitasi</dt><dd>Tarikan gravitasi bumi: 9,81 m/s².</dd><dt>Q · debit air</dt><dd>Volume air yang melewati turbin tiap detik, dalam m³/s.</dd><dt>H · tinggi jatuh air (head)</dt><dd>Beda ketinggian permukaan air dan turbin, dalam meter. Mode operasi memakai head bersih setelah kerugian pipa.</dd><dt>η (eta) · efisiensi</dt><dd>Bagian energi air yang menjadi listrik. Nilai 85% ditulis 0,85. Sisanya menjadi panas, gesekan, dan kerugian lain.</dd></dl><h3>Contoh mode dasar</h3><p>Q = 40 m³/s, H = 60 m, η = 0,85.</p><p>P = 1.000 × 9,81 × 40 × 60 × 0,85<br>= 20.012.400 W ≈ <strong>20,01 MW</strong>.</p><h3>Daya dan energi berbeda</h3><p>Jika daya tetap 20 MW selama 0,5 jam, energi = 20 × 0,5 = <strong>10 MWh</strong>. Jika daya berubah, simulasi menjumlahkan energi setiap langkah waktu.</p><p>Mode dasar menjaga H dan Q sesuai pengaturan. Mode operasi menghitung perubahan tampungan, head bersih, dan efisiensi. Waktu operasi = detik percobaan × skala waktu.</p>');
$('#parts-btn').onclick=()=>openInfo(Process?Process.processOverview():'<p class="eyebrow">KENALI PLTA</p><h2>Alur energi PLTA</h2><p>Modul tahap belum termuat. Muat ulang halaman.</p>');
$('#zoom').onclick=()=>{
 dialog.classList.add('zoomed');$('#dialog-content').replaceChildren();const title=document.createElement('h2');title.textContent='Penampang PLTA';const wrap=document.createElement('div');wrap.className='zoom-scene';const clone=$('#plant').cloneNode(true);clone.querySelector('#turbine').classList.add('turbine-rotor');clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(el=>el.id='zoom-'+el.id);clone.querySelectorAll('*').forEach(el=>{for(const attr of [...el.attributes]){if(attr.value.includes('url(#'))el.setAttribute(attr.name,attr.value.replace(/url\(#/g,'url(#zoom-'));if(attr.name==='href'&&attr.value.startsWith('#'))el.setAttribute('href','#zoom-'+attr.value.slice(1));}});clone.setAttribute('aria-labelledby','zoom-svg-title zoom-svg-desc');wrap.append(clone);const note=document.createElement('p');note.textContent='Tampilan diperbesar adalah cuplikan kondisi saat dibuka. Tutup untuk mengamati pembaruan nilai. Ilustrasi tidak berskala.';$('#dialog-content').append(title,wrap,note);dialog.showModal();
};
const readingObserver=new IntersectionObserver(entries=>{for(const entry of entries){$('#mobile-readings').hidden=!entry.isIntersecting;$$('.tabbar .tab').forEach((a,i)=>a.classList.toggle('active',i===Number(entry.isIntersecting)));}},{threshold:0,rootMargin:'-70px 0px 0px 0px'});readingObserver.observe($('#lkpd'));
window.PLTAWorksheet={snapshot:()=>JSON.parse(JSON.stringify({model:state.model,fields:state.fields,rows:state.rows,operatorRows:state.operatorRows,charts:op()?history:[]}))};
renderRows();renderOperatorRows();render();
})();
