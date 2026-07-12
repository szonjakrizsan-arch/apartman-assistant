import { ArrowLeft } from "lucide-react";

export type LegalDoc = "terms" | "privacy" | "contact";

const DOCS: Record<LegalDoc, { title: string; body: string }> = {
  terms: {
    title: "Általános Szerződési Feltételek",
    body: `
1. A szolgáltató

Név: dr. Krizsán Szonja Katalin (magánszemély)
Település: Torony
Email: szonjakrizsan@gmail.com
[ADÓSZÁM — kitöltendő vállalkozás indításakor]

2. A szolgáltatás

Az Apartman Assistant egy webes alkalmazás szálláshely-üzemeltetők
számára, amely a foglalási naptárak (iCal) összesítését, napi
feladatok követését és vendégadatok kezelését segíti.

3. A szolgáltatás igénybevétele

A szolgáltatás regisztrációhoz kötött. A regisztrációval a
felhasználó elfogadja a jelen feltételeket és az Adatkezelési
tájékoztatót.

[ÁR ÉS PRÓBAIDŐSZAK — kitöltendő az értékesítés indulásakor:
14 napos ingyenes próbaidőszak, ezt követően havi előfizetési díj.]

4. Felelősség

A szolgáltatás a foglalási platformok (Szállás.hu, Airbnb stb.)
által biztosított iCal naptárakból dolgozik. A megjelenített adatok
pontossága a forrásplatformok adataitól függ. A szolgáltató nem
vállal felelősséget a forrásadatok hibáiból eredő károkért.
A szolgáltatás "ahogy van" alapon érhető el.

5. Megszűnés

A felhasználó a fiókját bármikor megszüntetheti. A fiók törlésével
a tárolt adatok is törlésre kerülnek.

Hatályos: 2026. június
`,
  },
  privacy: {
    title: "Adatkezelési Tájékoztató",
    body: `
1. Az adatkezelő

Név: dr. Krizsán Szonja Katalin
Település: Torony
Email: szonjakrizsan@gmail.com

2. A kezelt adatok köre

a) A felhasználó adatai: név, email cím, jelszó (titkosítva).
b) A felhasználó által rögzített adatok: apartmanok nevei, naptár
(iCal) linkek, vendég-kapcsolattartási adatok (név, telefonszám,
email), fizetési feljegyzések, feladatok, megjegyzések.

3. Az adatkezelés célja és jogalapja

Az adatok kezelése a szolgáltatás nyújtásához szükséges
(szerződés teljesítése). A vendégadatok rögzítése a felhasználó
döntése; ezen adatok tekintetében a felhasználó adatkezelőnek,
a szolgáltatás technikai adatfeldolgozónak minősül.

4. Adattárolás és adatfeldolgozók

Az adatok titkosított kapcsolaton keresztül tárolódnak. Az
adatokhoz kizárólag a felhasználó fér hozzá (sorszintű
hozzáférés-védelem). Az adatkezelő az alábbi adatfeldolgozókat
veszi igénybe:

- Supabase (adatbázis és hitelesítés) — adattárolás
- Cloudflare (tárhelyszolgáltatás) — az alkalmazás futtatása
- Resend (email-küldés) — rendszerüzenetek kézbesítése
- Meta (Facebook) — a regisztráció sikeres lezárásának mérése hirdetési célból (Meta-képpont)

Az adatfeldolgozók az Európai Unió, illetve azzal megfelelő
adatvédelmi szintet biztosító országok szervereit használják.

5. Az érintettek jogai

A felhasználó kérheti adatai módosítását, törlését, illetve
tájékoztatást kérhet a kezelt adatokról a fenti email címen.
A fiók törlésével minden tárolt adat törlésre kerül.

6. Panasz

Adatkezelési panasszal a Nemzeti Adatvédelmi és Információ-
szabadság Hatósághoz (NAIH) fordulhat: naih.hu

Hatályos: 2026. június
`,
  },
  contact: {
    title: "Impresszum és kapcsolat",
    body: `
Üzemeltető: dr. Krizsán Szonja Katalin
Település: Torony

Email: szonjakrizsan@gmail.com

Kérdésed van az alkalmazással kapcsolatban, hibát találtál,
vagy javaslatod van? Írj bátran — igyekszem hamar válaszolni!
`,
  },
};

export function LegalScreen({ doc, onBack }: { doc: LegalDoc; onBack: () => void }) {
  const d = DOCS[doc];
  return (
    <div className="min-h-dvh bg-surface px-4 py-6">
      <div className="mx-auto w-full max-w-lg">
        <button type="button" onClick={onBack}
          className="pressable mb-5 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium"
          style={{ background: "rgb(86 176 187 / 0.12)", color: "#56b0bb" }}>
          <ArrowLeft className="h-4 w-4" /> Vissza
        </button>
        <h1 className="text-[18px] font-bold text-text-primary mb-4">{d.title}</h1>
        <div className="card-elevated rounded-2xl p-5">
          <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-secondary"
            style={{ fontFamily: "inherit" }}>
            {d.body.trim()}
          </pre>
        </div>
      </div>
    </div>
  );
}
