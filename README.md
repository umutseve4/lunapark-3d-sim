# 🎢 Lunapark 3D — Uludağ Ekspres & Bursa Gözü

Tarayıcıda çalışan, **fizik tabanlı**, etkileşimli 3D lunapark sahnesi (Three.js r160).

> **build by Opus 5.5**

## Çalıştırma
- **GitHub Pages:** Settings → Pages → Branch: `main` / root → `index.html` yayınlanır.
- **Yerelde:** ES modülleri `file://` üzerinden yüklenmediği için klasörde `python -m http.server` çalıştırıp `http://localhost:8000` açın.
- Kodlar: `core.js` (fizik çekirdeği), `track.js` (ray yerleşimi), `scene-coaster.js` (sahne + hızlı tren), `rides-fx.js` (dönme dolap, atlıkarınca, konfeti, havai fişek, modlar, kamera).

## 🎢 Hızlı Tren — Uludağ Ekspres
- **Ray geometrisi:** Centripetal Catmull-Rom spline → Gauss yumuşatma (G2 süreklilik, sarsıntısız eğrilik) → yay uzunluğuna göre yeniden örnekleme (4000 örnek).
- **Ray çerçevesi:** Paralel taşıma (rotation-minimizing frame) + kapalı devre burulma düzeltmesi; looping içinde ray ters dönmez/kırılmaz.
- **Fiziksel yatış (banking):** Beklenen hız (enerji korunumu) ve eğrilik vektöründen, hissedilen kuvvet ray normaline hizalanacak şekilde yatış açısı hesaplanır (yanal G ≈ 0, maks ~80°).
- **Looping:** Eğrilik integrasyonuyla üretilen, G-profili kontrollü (altta ~3.6 g, tepede ~1.2 g) simetrik clothoid/gözyaşı looping; giriş-çıkış 7 m yanal kaydırmalı.
- **Zikzak:** Hava-zamanı (airtime) tepecikli S-virajlar, virajlarda otomatik yatış.
- **Tren dinamiği:** 5 vagon tek rijit gövde olarak raya bağlı; ivme = −g·(vagonların ortalama eğimi) − yuvarlanma sürtünmesi − hava direnci. Zincirli yokuş (anti-rollback), istasyon tekerlekleri, manyetik fren hattı, istasyonda duruş/biniş döngüsü.
- **Vagon bağlantısı:** Her vagon ön/arka boji noktaları arasındaki kirişe göre konumlanır; vagonlar arası kaplin çubukları ray üzerindeki gerçek bağlantı noktalarına bağlıdır.
- **Doğrulanmış değerler (offline test):** dikey G −0.47 … 4.03 g, maks yanal |G| 1.21 g, maks hız ≈ 90 km/h, tur ≈ 75 s, ray parçaları arası min. açıklık 6.5 m, serbest sürüşte min. hız 7.4 m/s.

## 🎡 Dönme Dolap — Bursa Gözü
- 18 m yarıçap, 16 kabin, çift jant + kafes kirişler, A-çerçeve kuleler.
- Kabinler serbest asılı: pivot ivmesi (teğetsel + merkezcil) ve rüzgârla sürülen sönümlü sarkaç: `θ'' = [(−aₓ + rüzgâr)·cosθ − (g + a_y)·sinθ] / L − c·θ'`.
- Çalışma döngüsü: ~40 s dönüş, yavaşlama, 7 s biniş molası.

## Modlar
| Mod | Açıklama |
|---|---|
| ☀️ Gündüz | Güneş, gölgeler, mavi gökyüzü |
| 🌙 Gece | Yıldızlar, ay, parlayan ampuller (bloom), nokta ışıklar |
| 🎉 Festival | Renk kaydırmalı ışıklar + fiziksel konfeti yağmuru + havai fişekler |

## Kontroller
- Kamera: 🎥 Serbest · 🎢 Tren POV · 🎡 Dolap POV · 🎬 Sinematik
- Treni park et/kaldır, dolabı durdur/başlat, simülasyon hızı, rüzgâr şiddeti
- Klavye: `1/2/3` mod, `C` kamera
