const {rd,yetkili,hata}=require('./_lib');
module.exports=async(req,res)=>{try{if(!yetkili(req))return hata(res,401,'Giriş gerekli');
 if(req.method==='GET'){const v=await rd(['HGET','pvc:dosya',String(req.query.id||'')]);if(!v)return hata(res,404,'Dosya yok');const d=JSON.parse(v);
  res.setHeader('Content-Type',d.tip);res.setHeader('Content-Disposition','inline');return res.status(200).send(Buffer.from(d.data,'base64'))}
 if(req.method==='POST'){const b=req.body||{};if(!b.data||b.data.length>800000)return hata(res,413,'Dosya çok büyük (en fazla yaklaşık 600 KB)');
  if(!/^(application\/pdf|image\/jpeg)$/.test(b.tip))return hata(res,415,'Yalnızca PDF veya fotoğraf');
  const id=Date.now().toString(36)+Math.random().toString(36).slice(2,8);await rd(['HSET','pvc:dosya',id,JSON.stringify({tip:b.tip,ad:b.ad,data:b.data})]);return res.status(200).json({id})}
 if(req.method==='DELETE'){await rd(['HDEL','pvc:dosya',String(req.query.id||'')]);return res.status(200).json({ok:true})}
 hata(res,405,'Yöntem desteklenmiyor')}catch(e){hata(res,500,e.message)}};
