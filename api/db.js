const {pipe,yetkili,hata}=require('./_lib');
const COLS=['cari','fatura','hareket','urun','cek','stok','teklif','ayar'];
module.exports=async(req,res)=>{try{
 if(!yetkili(req))return hata(res,401,'Giriş gerekli');
 if(req.method==='GET'){const r=await pipe(COLS.map(c=>['HGETALL','pvc:'+c]));const out={};
  COLS.forEach((c,i)=>{const a=r[i]||[],l=[];for(let k=1;k<a.length;k+=2){try{l.push(JSON.parse(a[k]))}catch(e){}}out[c]=l});return res.status(200).json(out)}
 if(req.method==='POST'){const b=req.body||{};if(!COLS.includes(b.col))return hata(res,400,'Geçersiz koleksiyon');
  if(b.op==='set'){if(!b.doc||!b.doc.id)return hata(res,400,'Kayıt yok');await pipe([['HSET','pvc:'+b.col,String(b.doc.id),JSON.stringify(b.doc)]])}
  else if(b.op==='del'){await pipe([['HDEL','pvc:'+b.col,String(b.id)]])}
  else return hata(res,400,'Geçersiz işlem');
  return res.status(200).json({ok:true})}
 hata(res,405,'Yöntem desteklenmiyor')}catch(e){hata(res,500,e.message)}};
