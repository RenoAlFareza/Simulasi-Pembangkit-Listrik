/* PDF follows the HTML LKPD design and shared worksheet data. No worksheet image template. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/pdf-lib.min.js'),require('./vendor/fontkit.umd.min.js'),root);
 else root.PLTAPdf=factory(root.PDFLib,root.fontkit,root);
})(typeof globalThis!=='undefined'?globalThis:this,function(PDFLib,fontkit,root){
 'use strict';
 const {PDFDocument,rgb}=PDFLib,BLUE=rgb(.02,.53,.96),LIGHT=rgb(.68,.88,.96),INK=rgb(.10,.15,.19),MUTED=rgb(.36,.43,.47),WHITE=rgb(1,1,1);
 const number=(n,d=2)=>Number(n||0).toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
 const clean=v=>String(v??'').replace(/\r\n?/g,'\n').replace(/\t/g,'    ').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
 const b64bytes=s=>{if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(s,'base64'));const a=atob(s);return Uint8Array.from(a,c=>c.charCodeAt(0));};
 const clock=s=>{const n=Math.max(0,Math.round(Number(s)||0));return String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n/60)%60).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
 function wrap(text,font,size,width){
  const out=[];
  for(const paragraph of clean(text).split('\n')){
   if(!paragraph.trim()){out.push('');continue;}
   let line='';
   for(const word of paragraph.trim().split(/\s+/)){
    if(font.widthOfTextAtSize(word,size)>width){
     if(line){out.push(line);line='';}
     let part='';for(const c of Array.from(word)){if(part&&font.widthOfTextAtSize(part+c,size)>width){out.push(part);part=c;}else part+=c;}line=part;
    }else if(line&&font.widthOfTextAtSize(line+' '+word,size)>width){out.push(line);line=word;}else line+=(line?' ':'')+word;
   }
   if(line)out.push(line);
  }
  return out;
 }

 async function build(payload,options={}){
  const assets=options.assets||root.PLTA_PDF_ASSETS;if(!assets?.font)throw new Error('Font PDF belum tersedia.');
  const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(b64bytes(assets.font),{subset:true});
  const green=rgb(.04,.38,.34),cream=rgb(.97,.98,.95),line=rgb(.85,.89,.83),muted=rgb(.40,.48,.43),pale=rgb(.93,.96,.89),ink=rgb(.09,.24,.22),white=rgb(1,1,1);
  const f=payload.fields||{},operator=payload.model==='operator';let page,y;
  const draw=(str,x,yy,size=10,color=ink)=>page.drawText(clean(str),{x,y:yy,size,font,color});
  function fresh(){page=doc.addPage([595.28,841.89]);page.drawRectangle({x:0,y:0,width:595.28,height:841.89,color:white});draw('PLTA',42,799,24,green);draw('LABORATORIUM PLTA  /  LKPD DIGITAL',125,804,8,muted);page.drawLine({start:{x:42,y:781},end:{x:553,y:781},color:line,thickness:1});y=756;}
  function room(height){if(!page||y-height<62)fresh();}
  function heading(n,title){room(62);draw(n,42,y,8,muted);y-=25;draw(title,42,y,17,green);y-=25;}
  function paragraph(value,size=10){for(const l of wrap(value||'Belum diisi.',font,size,485)){room(17);draw(l,54,y,size);y-=15;}y-=10;}
  function answer(label,value){room(65);draw(label,54,y,10,green);y-=18;const lines=wrap(value||'Belum diisi.',font,10,459);let idx=0;while(idx<lines.length){room(48);const count=Math.min(lines.length-idx,Math.max(1,Math.floor((y-77)/16))),height=count*16+22;page.drawRectangle({x:42,y:y-height+12,width:511,height,color:white,borderColor:line,borderWidth:.7});for(let i=0;i<count;i++)draw(lines[idx+i],55,y-3-i*16,10);idx+=count;y-=height+7;if(idx<lines.length){fresh();draw(label+' (lanjutan)',54,y,10,green);y-=20;}}y-=8;}
  function observation(title,entries){room(55);draw(title,54,y,11,green);y-=20;for(const entry of entries)paragraph(entry,9.5);}
  fresh();draw('Amati. Catat. Jelaskan.',42,y,23,green);y-=27;draw(operator?'OPERASI WADUK':'PERCOBAAN DASAR',42,y,9,muted);y-=35;
  heading('01 / IDENTITAS KELOMPOK','Identitas peserta didik');
  for(const pair of [[['Kelas',f.kelas],['Kelompok',f.kelompok]],[['Tanggal percobaan',f.tanggal],['Mode',operator?'Operasi waduk':'Percobaan dasar']]]){const wrapped=pair.map(([label,val])=>({label,lines:wrap(val||'—',font,10,225)})),height=Math.max(...wrapped.map(v=>v.lines.length))*15+32;room(height+12);wrapped.forEach((item,j)=>{const x=42+j*263;page.drawRectangle({x,y:y-height,width:248,height,color:cream,borderColor:line,borderWidth:.6});draw(item.label,x+12,y-15,8,muted);item.lines.forEach((l,i)=>draw(l,x+12,y-33-i*15,10));});y-=height+24;}
  answer('Nama anggota kelompok',f.anggota);
  heading('02 / PERSIAPAN','Pahami sebelum mencoba.');paragraph(operator?'Amati hubungan pasokan sungai, bukaan pintu, tampungan, daya, dan energi. Bandingkan percobaan dengan durasi, skala waktu, serta kondisi awal yang sama.':'Percobaan 1: ubah tinggi air dengan debit tetap. Percobaan 2: ubah debit dengan tinggi tetap. Gunakan minimal tiga kondisi berbeda.');paragraph('Catat pengamatan di buku. Jelaskan pola dengan kata-kata sendiri sebelum mengumpulkan LKPD.');
  heading('03 / SEBELUM MENYELIDIKI','Apa dugaanmu?');answer('Hipotesis',f.hipotesis);
  fresh();heading('04 / HASIL DAN PEMBAHASAN','Hasil pengamatan');
  if(operator){
   const ops=payload.operatorRows||[];if(!ops.length)paragraph('Belum ada percobaan operasi yang dicatat.');
   ops.forEach((r,i)=>{const season={dry:'Kemarau',wet:'Musim hujan',transition:'Pancaroba',manual:'Manual'};observation('Percobaan operasi '+(i+1),[
    `Kondisi: ${season[r.season]||'Manual'} | Pintu ${r.initialGate}% → ${r.finalGate}%.`,
    `Tinggi awal → akhir: ${number(r.initialH)} → ${number(r.finalH)} m.`,
    `Energi: ${number(r.energy,3)} MWh | Air turbin: ${number(r.volume,0)} m³.`,
    `Daya rata-rata: ${number(r.averagePower)} MW | Daya akhir: ${number(r.finalPower)} MW.`,
    `Durasi percobaan: ${r.duration} detik | Skala: ${r.scale}× | Operasi: ${clock(r.seconds)}.`,
    `Air masuk: ${number(r.inflowVolume,0)} m³ | Pelepasan lain: ${number(r.otherVolume,0)} m³ | Pelimpah: ${number(r.spillVolume,0)} m³.`,
    `Pasokan sungai awal/akhir: ${number(r.initialInflow)} / ${number(r.finalInflow)} m³/s | Beban contoh: ${r.demand} MW.`]);
    for(const c of r.changes||[])paragraph(`${clock(c.seconds)} - ${c.variable}: ${c.value}`,9);
   });
  }else{
   for(const type of ['height','flow']){
    const title=type==='height'?'Percobaan 1 - Pengaruh ketinggian air':'Percobaan 2 - Pengaruh debit air',control=type==='height'?'Kontrol: debit air tetap. Manipulasi: ketinggian air.':'Kontrol: ketinggian air tetap. Manipulasi: debit air.';
    const widths=[29,79,79,82,103,139],headers=type==='height'?['No.','Debit air\n(m³/s)','Ketinggian\n(m)','Daya listrik\n(MW)','Pasokan beban','Waktu\nteramati / durasi']:['No.','Ketinggian\n(m)','Debit air\n(m³/s)','Daya listrik\n(MW)','Pasokan beban','Waktu\nteramati / durasi'];
    function cells(values,height,header=false){let x=42;values.forEach((val,j)=>{page.drawRectangle({x,y:y-height,width:widths[j],height,color:header?pale:white,borderColor:line,borderWidth:.65});const ls=wrap(String(val),font,header?8:9,widths[j]-12),lh=12,top=y-height/2+(ls.length-1)*lh/2-3;ls.forEach((l,i)=>draw(l,x+(widths[j]-font.widthOfTextAtSize(l,header?8:9))/2,top-i*lh,header?8:9,header?green:ink));x+=widths[j];});y-=height;}
    function tableHead(continued=false){room(120);draw(title+(continued?' (lanjutan)':''),42,y,12,green);y-=23;draw(control,42,y,9,muted);y-=19;cells(headers,42,true);}
    tableHead();const rows=payload.rows?.[type]||[];
    if(!rows.length)cells(['—','—','—','—','—','—'],36);
    rows.forEach((r,i)=>{const val=(k,d)=>r[k]===''||r[k]==null?'—':number(r[k],d),values=[String(i+1),val(type==='height'?'q':'h',1),val(type==='height'?'h':'q',1),val('p',2),r.led||'—',`${val('t',1)} / ${r.duration||'—'} detik`],height=Math.max(36,...values.map((v,j)=>wrap(v,font,9,widths[j]-12).length*12+18));if(y-height<70){fresh();tableHead(true);}cells(values,height);});y-=16;
    const extras=rows.map((r,i)=>r.energy!==''&&r.energy!=null?`Baris ${i+1}: energi ${number(r.energy,6)} MWh; beban ${r.demand||'—'} MW.`:'').filter(Boolean);for(const l of extras)paragraph(l,8);y-=14;
   }
  }
  fresh();heading('05 / MEMAKNAI HASIL','Analisis & kesimpulan');if(operator)answer('Operasi waduk - hubungan tampungan dan produksi',f.analisisOperator);else{answer('Percobaan 1 - Ketinggian air',f.analisis1);answer('Percobaan 2 - Debit air',f.analisis2);}answer('Kesimpulan',f.kesimpulan);
  if(operator&&Array.isArray(payload.charts)){
   const data=payload.charts.filter(r=>Number.isFinite(r.t)&&Number.isFinite(r.h)&&Number.isFinite(r.p)).slice(0,800);if(data.length>1){fresh();heading('LAMPIRAN / GRAFIK SESI TERAKHIR','Tinggi air & daya listrik');for(const [key,label,color]of [['h','Tinggi air (m)',green],['p','Daya listrik (MW)',rgb(.75,.48,.25)]]){const top=y;draw(label,54,top,12,green);const x=82,bottom=top-188,w=440,h=155,values=data.map(r=>r[key]),lo=Math.max(0,Math.min(...values)-.25),hi=Math.max(lo+1,Math.max(...values)+.25),end=Math.max(1,data.at(-1).t);for(let i=0;i<4;i++){const yy=bottom+i*h/3;page.drawLine({start:{x,y:yy},end:{x:x+w,y:yy},color:line,thickness:.5});draw(number(lo+(hi-lo)*i/3,1),42,yy-3,8,muted);}for(let i=1;i<data.length;i++)page.drawLine({start:{x:x+data[i-1].t/end*w,y:bottom+(data[i-1][key]-lo)/(hi-lo)*h},end:{x:x+data[i].t/end*w,y:bottom+(data[i][key]-lo)/(hi-lo)*h},color,thickness:1.5});draw('Waktu operasi: 0 → '+clock(end),82,bottom-21,9,muted);y=bottom-64;}}}
  const total=doc.getPageCount();for(const [i,p]of doc.getPages().entries()){page=p;page.drawLine({start:{x:42,y:45},end:{x:553,y:45},color:line,thickness:.7});draw(options.draft?'DRAF - isian belum lengkap':'PLTA - LKPD digital',42,29,8,muted);draw(`${i+1} / ${total}`,515,29,8,muted);}
  doc.setTitle('LKPD PLTA - '+(f.kelompok||'Draf'));doc.setAuthor('PLTA - Laboratorium Energi Terbarukan');return doc.save();
 }
 return Object.freeze({build,wrap});
});
