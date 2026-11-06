const crypto=require('crypto');
const U=()=>process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL,K=()=>process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
async function rd(cmd){const r=await fetch(U(),{method:'POST',headers:{Authorization:'Bearer '+K()},body:JSON.stringify(cmd)});const j=await r.json();if(j.error)throw new Error(j.error);return j.result}
async function pipe(cmds){const r=await fetch(U()+'/pipeline',{method:'POST',headers:{Authorization:'Bearer '+K()},body:JSON.stringify(cmds)});const j=await r.json();if(!Array.isArray(j))throw new Error(j.error||'Veri tabanı hatası');return j.map(x=>{if(x.error)throw new Error(x.error);return x.result})}
const tok=()=>crypto.createHash('sha256').update((process.env.APP_PASSWORD||'')+'|pvc-cari').digest('hex');
function yetkili(req){if(!process.env.APP_PASSWORD)return false;const m=/(?:^|;\s*)oturum=([a-f0-9]+)/.exec(req.headers.cookie||'');return !!m&&m[1]===tok()}
const hata=(res,k,m)=>res.status(k).json({hata:m});
module.exports={rd,pipe,tok,yetkili,hata};
