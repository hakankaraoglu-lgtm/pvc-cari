const crypto = require('crypto');
const { pipe, hata } = require('./_lib');

const COLS = ['cari', 'fatura', 'hareket', 'urun', 'cek', 'stok', 'teklif', 'ayar'];
const RECIPIENT = 'hakankaraoglu@gmail.com';

function authorized(req, secret) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.authorization || '');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return hata(res, 405, 'Yöntem desteklenmiyor');

    const secret = process.env.CRON_SECRET;
    if (!secret) return hata(res, 500, 'CRON_SECRET ayarlanmamış');
    if (!authorized(req, secret)) return hata(res, 401, 'Yetkisiz cron isteği');

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return hata(res, 500, 'RESEND_API_KEY ayarlanmamış');

    const rows = await pipe(COLS.map((collection) => ['HGETALL', `pvc:${collection}`]));
    const backup = {};

    COLS.forEach((collection, index) => {
      const values = rows[index] || [];
      const records = [];
      for (let i = 1; i < values.length; i += 2) records.push(JSON.parse(values[i]));
      backup[collection] = records;
    });

    const date = new Date().toISOString().slice(0, 10);
    const content = Buffer.from(JSON.stringify(backup, null, 2)).toString('base64');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `pvc-cari-daily-backup-${date}`,
      },
      body: JSON.stringify({
        from: process.env.RAPOR_FROM || 'PVC Cari Takip <onboarding@resend.dev>',
        to: [RECIPIENT],
        subject: `PVC Cari günlük yedek - ${date}`,
        text: `${date} tarihli PVC Cari veritabanı yedeği ektedir.`,
        attachments: [{ filename: `cari-yedek-${date}.json`, content }],
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) return hata(res, 502, result.message || 'Yedek e-postası gönderilemedi');
    return res.status(200).json({ ok: true, date, emailId: result.id });
  } catch (error) {
    return hata(res, 500, 'Yedek hazırlanamadı veya gönderilemedi');
  }
};
