/* Local PDF generation and optional Apps Script collection. No email credentials. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else {root.PLTACollection=factory();root.PLTACollection.init(root);}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const RECIPIENT='renoalfareza21@gmail.com',KEY='plta-submission-v1';
 const labels={kelas:'Kelas',kelompok:'Kelompok',tanggal:'Tanggal',anggota:'Anggota kelompok',hipotesis:'Hipotesis',analisis1:'Analisis tabel 1',analisis2:'Analisis tabel 2',analisisOperator:'Analisis operasi',kesimpulan:'Kesimpulan'};
 const numeric=v=>(typeof v==='number'||typeof v==='string'&&v.trim()&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v.trim()))&&Number.isFinite(Number(v));
 function validate(p){
  const errors=[],f=p.fields||{},operator=p.model==='operator';
  const add=(field,message)=>errors.push({field,message});
  if(!['basic','operator'].includes(p.model))add('observations','Pilih mode simulasi yang valid.');
  const required=['kelas','kelompok','tanggal','anggota','hipotesis',...(operator?['analisisOperator']:['analisis1','analisis2']),'kesimpulan'];
  for(const k of required)if(typeof f[k]!=='string'||!f[k].trim())add(k,`${labels[k]} belum diisi.`);
  for(const [k,v]of Object.entries(f))if(typeof v!=='string'||v.length>(['kelas','kelompok','tanggal','anggota'].includes(k)?500:20000))add(k,`${labels[k]||k} terlalu panjang.`);
  if(f.tanggal){const d=new Date(f.tanggal+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(f.tanggal)||f.tanggal.startsWith('0000')||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==f.tanggal)add('tanggal','Tanggal kalender tidak valid.');}
  if(operator){
   const rows=p.operatorRows;if(!Array.isArray(rows)||rows.length<1||rows.length>20)add('observations','Catat 1–20 percobaan operasi yang selesai.');
   else for(const r of rows){const keys=['initialH','finalH','energy','volume','seconds','duration','scale','finalPower','averagePower'];if(!r||keys.some(k=>typeof r[k]!=='number'||!Number.isFinite(r[k]))||r.initialH<0||r.initialH>100||r.finalH<0||r.finalH>100||r.energy<0||r.volume<0||r.seconds<=0||r.duration<30||r.duration>180||r.duration%30||![1,60,600].includes(r.scale)||r.finalPower<0||r.finalPower>50||r.averagePower<0||r.averagePower>50||Math.abs(r.seconds-r.duration*r.scale)>.01||r.volume>100*r.seconds+1||Math.abs(r.energy-r.averagePower*r.seconds/3600)>.001+.005*r.seconds/3600+1e-9){add('observations','Catatan operasi tidak valid. Jalankan dan catat ulang percobaan.');break;}}
  }else for(const [type,variable,control,title]of [['height','h','q','1'],['flow','q','h','2']]){
   const rows=p.rows?.[type];
   if(!Array.isArray(rows)||(rows.length<3||rows.length>20)||rows.some(r=>!r||!['h','q','p'].every(k=>numeric(r[k]))||+r.h<0||+r.h>100||+r.q<0||+r.q>100||+r.p<0||+r.p>83.385||!['Cukup','Kurang','Mati','Redup','Sedang','Terang'].includes(r.led)))add('observations',`Lengkapi 3–20 baris valid pada Tabel ${title}.`);
   else if(rows.some((r,i)=>rows.slice(0,i).some(a=>Math.abs(+a.h-+r.h)<=1e-8&&Math.abs(+a.q-+r.q)<=1e-8)))add('observations',`Tabel ${title}: ada baris dengan pasangan ketinggian dan debit yang sama; ubah minimal satu nilai.`);
  }
  if(!operator)for(const rows of Object.values(p.rows||{}))for(const r of rows||[]){if(!r)continue;for(const k of ['t','duration'])if(r[k]!==''&&r[k]!=null&&(!numeric(r[k])||+r[k]<0||+r[k]>180||k==='duration'&&(+r[k]<30||+r[k]%30)))add('observations','Periksa waktu dan durasi pengamatan.');if(r.t!==''&&r.t!=null&&r.duration!==''&&r.duration!=null&&+r.t>+r.duration)add('observations','Waktu teramati tidak boleh melebihi durasi.');}
  if(new TextEncoder().encode(JSON.stringify(p)).length>200000)add('observations','Data terlalu besar untuk dikumpulkan. Kurangi panjang jawaban.');
  return errors;
 }
 function filename(p){const f=p.fields||{};return ('LKPD-PLTA-'+(f.kelas||'Kelas')+'-'+(f.kelompok||'Kelompok')).replace(/[^A-Za-z0-9_-]+/g,'-').slice(0,115)+'.pdf';}
 function init(w){
  const d=w.document,$=s=>d.querySelector(s),buttons=[...d.querySelectorAll('[data-download-pdf]')],submit=$('#submit-lkpd'),status=$('#submission-status'),errorList=$('#submission-errors');
  if(!submit||!w.PLTAWorksheet)return;
  let busy=false,record=null;
  try{record=JSON.parse(w.localStorage.getItem(KEY)||'null');}catch{}
  const bridge=()=>Boolean(w.google?.script?.run);
  const setStatus=t=>{status.textContent=t;};
  const snapshot=()=>w.PLTAWorksheet.snapshot();
  const update=()=>{submit.disabled=busy||!bridge();submit.textContent=busy?'Memproses…':record?.request?'Periksa status kiriman':'Kirim PDF ke guru';};
  function errors(items){errorList.replaceChildren();for(const e of items){const li=d.createElement('li'),a=d.createElement('a');a.href='#'+(['kelas','kelompok','tanggal','anggota'].includes(e.field)?'identity':e.field==='hipotesis'?'hypothesis':e.field==='observations'?'observations':'analysis');a.textContent=e.message;a.onclick=event=>{event.preventDefault();const input=d.querySelector('[data-field="'+e.field+'"]'),target=input||$('#observations');for(let el=target;el;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;target.scrollIntoView({behavior:'smooth',block:'center'});if(input)input.focus({preventScroll:true});};li.append(a);errorList.append(li);}errorList.hidden=!items.length;}
  const persist=r=>{w.localStorage.setItem(KEY,JSON.stringify(r));record=r;};
  function download(bytes,name){const u=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=d.createElement('a');a.href=u;a.download=name;d.body.append(a);a.click();a.remove();w.setTimeout(()=>URL.revokeObjectURL(u),60000);}
  async function pdf(p,draft){await new Promise(resolve=>w.setTimeout(resolve,20));return w.PLTAPdf.build(p,{draft});}
  for(const b of buttons)b.onclick=async()=>{if(busy)return;busy=true;buttons.forEach(x=>x.disabled=true);update();try{const p=snapshot(),incomplete=validate(p).length>0;const bytes=await pdf(p,incomplete);download(bytes,filename(p));setStatus(incomplete?'PDF draf diunduh. Lengkapi isian sebelum mengirim.':'PDF lengkap diunduh.');}catch(e){setStatus('PDF gagal dibuat: '+e.message);}finally{busy=false;buttons.forEach(x=>x.disabled=false);update();}};
  $('#check-lkpd').onclick=()=>{const result=validate(snapshot());errors(result);setStatus(result.length?`${result.length} bagian perlu diperiksa.`:'Semua isian lengkap. PDF siap dikumpulkan.');};
  submit.onclick=async()=>{
   if(busy)return;if(!bridge()){setStatus('Pengiriman belum aktif. Gunakan versi web app yang dibagikan guru.');return;}
   if(!record?.request){const p=snapshot(),result=validate(p);errors(result);if(result.length){setStatus('Lengkapi bagian yang ditandai.');return;}if(record?.payload===JSON.stringify(p)&&record?.receipt){setStatus('Sudah diterima layanan email. Tanda terima: '+record.receipt);return;}}
   busy=true;update();buttons.forEach(x=>x.disabled=true);
   try{
    if(!record?.request){const p=snapshot(),bytes=await pdf(p,false);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
     const request={submissionId:w.crypto.randomUUID(),payload:p,pdfBase64:btoa(binary),filename:filename(p)};
     // Persist the exact PDF before sending so a refresh cannot generate a duplicate.
     try{persist({request});}catch{throw new Error('Penyimpanan kiriman tidak tersedia. Unduh PDF dan kumpulkan kepada guru.');}
    }
    setStatus('Mengirim PDF ke '+RECIPIENT+'…');
    const result=await new Promise((resolve,reject)=>w.google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).submitWorksheet(record.request));
    if(!result?.ok||result.recipient!==RECIPIENT||!result.receipt)throw new Error('Tanda terima tidak valid. Hubungi guru; jangan membuat kiriman baru.');
    const completed={receipt:result.receipt,payload:JSON.stringify(record.request.payload),sentAt:result.sentAt};
    try{persist(completed);}catch{record=completed;}
    setStatus('Diterima layanan email. Tanda terima: '+result.receipt);errors([]);
   }catch(e){const msg=e?.message||String(e);const beforeReservation=/^(?:Error: )?(?:INCOMPLETE_|INVALID_|INCONSISTENT_|PAYLOAD_TOO_LARGE|SUBMISSIONS_DISABLED|DAILY_LIMIT|GROUP_LIMIT|MAIL_QUOTA)/.test(msg);if(beforeReservation){try{w.localStorage.removeItem(KEY);record=null;}catch{}}
    setStatus(msg+(record?.request?' ID kiriman: '+record.request.submissionId+'. Data kiriman tersimpan; periksa status dengan tombol yang sama.':''));
   }finally{busy=false;buttons.forEach(x=>x.disabled=false);update();}
  };
  setStatus(record?.request?'Ada kiriman menunggu kepastian. Periksa status sebelum membuat pengumpulan baru.':record?.receipt?'Kiriman terakhir: '+record.receipt:bridge()?'Lengkapi isian, lalu kirim PDF.':'Pengiriman belum aktif pada HTML lokal. Gunakan web app dari guru; PDF tetap bisa diunduh.');update();
 }
 return {validate,filename,init,RECIPIENT};
});
