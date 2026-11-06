const {pipe,yetkili,hata}=require('./_lib');
const COLS=['cari','fatura','hareket','urun','cek','stok','teklif','ayar'];
const ADI={cari:'Cari',fatura:'Fatura',hareket:'Tahsilat/Ödeme',urun:'Ürün',cek:'Çek/Senet',stok:'Stok hareketi',teklif:'Teklif'};
const RAPOR_TO=()=>(process.env.RAPOR_TO||'hakankaraoglu@gmail.com').split(',').map(x=>x.trim()).filter(Boolean);
const TL=n=>(Number(n)||0).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' SOM';
const tar=d=>{if(!d)return '';const p=String(d).split('-');return p.length===3?p[2]+'.'+p[1]+'.'+p[0]:String(d)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function ozet(col,d,cariAd){
 if(col==='fatura'){const alis=d.tip==='alis';return {konu:(alis?'Alış':'Satış')+' faturası · '+(d.no||'')+' · '+TL(d.toplam),satir:[['Cari',cariAd],['Fatura no',d.no],['Tarih',tar(d.tarih)],['Vade',tar(d.vade)],['Kalem sayısı',(d.kalem||[]).length],['KDV','%'+(d.kdv??0)],['Toplam',TL(d.toplam)]]}}
 if(col==='hareket'){const t=d.tip==='giris'?'Tahsilat':'Ödeme';return {konu:t+' · '+cariAd+' · '+TL(d.tutar),satir:[['Tür',t],['Cari',cariAd],['Tarih',tar(d.tarih)],['Tutar',TL(d.tutar)],['Yöntem',d.yontem],['Açıklama',d.aciklama]]}}
 if(col==='cari')return {konu:'Yeni cari · '+(d.ad||''),satir:[['Ad',d.ad],['Telefon',d.tel],['E-posta',d.mail||d.eposta],['Adres',d.adres]]};
 const ad=d.ad||d.no||d.aciklama||d.id;
 return {konu:'Yeni '+(ADI[col]||col).toLowerCase()+' · '+ad,satir:[['Kayıt',ad],['Cari',cariAd],['Tarih',tar(d.tarih)],['Tutar',d.tutar!=null?TL(d.tutar):(d.toplam!=null?TL(d.toplam):'')],['Miktar',d.miktar],['Açıklama',d.aciklama]]};
}

async function bildir(col,d){
 const k=process.env.RESEND_API_KEY;if(!k||col==='ayar')return;
 let cariAd='';if(d.cari){try{const [c]=await pipe([['HGET','pvc:cari',String(d.cari)]]);cariAd=c?JSON.parse(c).ad||'':''}catch(e){}}
 const o=ozet(col,d,cariAd||'Genel'),rows=o.satir.filter(([,v])=>v!==undefined&&v!==null&&String(v).trim()!=='');
 const text=['Yeni kayıt: '+(ADI[col]||col),...rows.map(([a,v])=>a+': '+v)].join('\n');
 const html=`<div style="font-family:Arial,sans-serif;color:#17212b"><h2 style="margin:0 0 12px;font-size:18px">Yeni kayıt: ${esc(ADI[col]||col)}</h2><table cellpadding="6" style="border-collapse:collapse;font-size:14px">${rows.map(([a,v])=>`<tr><td style="color:#5b6b7b;border-bottom:1px solid #e5e9ee">${esc(a)}</td><td style="border-bottom:1px solid #e5e9ee"><strong>${esc(v)}</strong></td></tr>`).join('')}</table><p style="color:#5b6b7b;font-size:12px;margin-top:16px">PVC Cari Takip otomatik bildirimi</p></div>`;
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+k,'Content-Type':'application/json','Idempotency-Key':'pvc-'+col+'-'+d.id},
  body:JSON.stringify({from:process.env.RAPOR_FROM||'PVC Cari Takip <onboarding@resend.dev>',to:RAPOR_TO(),subject:o.konu.slice(0,200),text,html})});
 if(!r.ok){const j=await r.json().catch(()=>({}));console.error('Resend bildirim hatası:',r.status,j.message||'')}
}

module.exports=async(req,res)=>{try{
 if(!yetkili(req))return hata(res,401,'Giriş gerekli');
 if(req.method==='GET'){const r=await pipe(COLS.map(c=>['HGETALL','pvc:'+c]));const out={};
  COLS.forEach((c,i)=>{const a=r[i]||[],l=[];for(let k=1;k<a.length;k+=2){try{l.push(JSON.parse(a[k]))}catch(e){}}out[c]=l});return res.status(200).json(out)}
 if(req.method==='POST'){const b=req.body||{};if(!COLS.includes(b.col))return hata(res,400,'Geçersiz koleksiyon');
  if(b.op==='set'){if(!b.doc||!b.doc.id)return hata(res,400,'Kayıt yok');
   const [yeni]=await pipe([['HSETNX','pvc:'+b.col,String(b.doc.id),JSON.stringify(b.doc)]]);
   if(yeni===1){try{await bildir(b.col,b.doc)}catch(e){console.error('Resend bildirim hatası:',e.message)}}
   else await pipe([['HSET','pvc:'+b.col,String(b.doc.id),JSON.stringify(b.doc)]])}
  else if(b.op==='del'){await pipe([['HDEL','pvc:'+b.col,String(b.id)]])}
  else return hata(res,400,'Geçersiz işlem');
  return res.status(200).json({ok:true})}
 hata(res,405,'Yöntem desteklenmiyor')}catch(e){hata(res,500,e.message)}};
