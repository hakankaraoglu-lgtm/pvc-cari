const {yetkili,hata}=require('./_lib');
module.exports=async(req,res)=>{try{if(!yetkili(req))return hata(res,401,'Giriş gerekli');if(req.method!=='POST')return hata(res,405,'Yöntem desteklenmiyor');
 const k=process.env.RESEND_API_KEY;if(!k)return hata(res,500,'RESEND_API_KEY ayarlanmamış');
 const b=req.body||{};const to=(b.to||[]).filter(x=>/^[^@\s]+@[^@\s]+$/.test(x));if(!to.length)return hata(res,400,'Alıcı yok');
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+k,'Content-Type':'application/json'},
  body:JSON.stringify({from:process.env.RAPOR_FROM||'PVC Cari Takip <onboarding@resend.dev>',to,subject:String(b.subject||'Rapor').slice(0,200),text:String(b.body||''),attachments:b.content?[{filename:b.filename||'rapor.pdf',content:b.content}]:[]})});
 const j=await r.json().catch(()=>({}));if(!r.ok)return hata(res,502,j.message||'E-posta gönderilemedi');res.status(200).json({id:j.id})}catch(e){hata(res,500,e.message)}};
