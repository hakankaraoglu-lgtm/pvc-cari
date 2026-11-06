# PVC Cari Takip – Vercel kurulumu

## 1. GitHub'a yükleme
1. Zip dosyasını bilgisayarınızda açın.
2. github.com'da boş `pvc-cari` deposunu açın, "uploading an existing file" bağlantısına tıklayın.
3. Açtığınız klasörün **içindekileri** (api klasörü, public klasörü, package.json, vercel.json) sürükleyip bırakın ve "Commit changes" deyin.

## 2. Vercel'de proje oluşturma
1. vercel.com → Add New → Project → `pvc-cari` deposunu Import edin.
2. Framework Preset: **Other**. Başka bir ayarı değiştirmeyin → Deploy.

## 3. Veri tabanı (ücretsiz)
1. Projede Storage sekmesi → Create Database → **Upstash for Redis** (Free plan) seçin.
2. Projeye bağlayın. Bu işlem KV_REST_API_URL ve KV_REST_API_TOKEN değişkenlerini kendiliğinden ekler.

## 4. Ortam değişkenleri
Settings → Environment Variables bölümüne şunları ekleyin:
- `APP_PASSWORD` : ekibin giriş şifresi (uzun ve tahmin edilmesi zor olsun)
- `RESEND_API_KEY` : Resend hesabınızdaki API anahtarı
- `CRON_SECRET` : günlük yedek cron isteğini doğrulamak için en az 16 karakterlik rastgele bir gizli değer
- `RAPOR_FROM` (isteğe bağlı) : kendi alan adınızı Resend'de doğruladıysanız "Firma <rapor@alanadiniz.com>"

Her gün saat 09:00 Türkiye saatiyle, veritabanındaki kayıtlar JSON yedeğine dönüştürülerek `hakankaraoglu@gmail.com` adresine e-posta eki olarak gönderilir. Zamanlama Vercel cron'unda UTC 06:00 olarak ayarlanmıştır. Bu adres Resend hesabının izin verilen alıcılarından biri değilse, `RAPOR_FROM` için Resend'de doğrulanmış bir alan adı kullanın.

## 5. Yeniden yayınlama
Deployments sekmesinde son yayının ⋯ menüsünden **Redeploy** deyin. Sonra size verilen adresi açın, şifreyle girin.

## 6. Eski verileri taşıma
Claude üzerindeki eski uygulamada "Yedek indir" ile dosyayı alın, yeni adreste "Yedek yükle" ile yükleyin.

## Notlar
- Resend'de alan adı doğrulamadıysanız e-postalar yalnızca Resend hesabınızın e-posta adresine gider.
- Fatura belgeleri en fazla yaklaşık 600 KB'tır; fotoğraflar otomatik küçültülür, büyük PDF'ler kabul edilmez.
- Veri 8 saniyede bir yenilenir; iki kişi aynı anda kayıt girerse diğerinin kaydı en geç 8 saniyede görünür.
