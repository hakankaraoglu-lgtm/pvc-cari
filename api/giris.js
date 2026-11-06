const {tok,hata}=require('./_lib');
module.exports=async(req,res)=>{if(req.method!=='POST')return hata(res,405,'Yöntem desteklenmiyor');const p=process.env.APP_PASSWORD;
 if(!p)return hata(res,500,'APP_PASSWORD ayarlanmamış');
 if((req.body||{}).sifre!==p)return hata(res,401,'Şifre hatalı');
 res.setHeader('Set-Cookie','oturum='+tok()+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000');res.status(200).json({ok:true})};
