// supabase/functions/notify-registration/index.ts
//
// Ez a funkció két esetben küld emailt a Resend segítségével:
// 1) Amikor új sor jön létre a "profiles" táblában (új regisztráció)
//    -> értesítést kap az admin (apartmanasszisztens@gmail.com)
// 2) Amikor egy "profiles" sor "approved" mezője false-ról true-ra vált
//    (vagyis Szonja jóváhagyta a felhasználót)
//    -> a felhasználó kap egy üdvözlő emailt
//
// A funkciót Database Webhook hívja meg (Insert és Update eseményeknél).
//
// FONTOS: a magyar (apartmanassistant.hu) és a német (apartmentassistant.de)
// app UGYANAZT a Supabase projektet és "profiles" táblát használja. A
// "market" oszlop (értéke "hu" vagy "de", AuthScreen.tsx tölti ki
// regisztrációkor) mondja meg, melyik nyelven/márkával kell válaszolni.
//
// A leveleket egyelőre MINDKÉT piacnál a hitelesített apartmanassistant.hu
// domainről küldjük (Resend-nél a apartmentassistant.de domain nincs
// hitelesítve — Szonja 2026-08-06-án úgy döntött, hogy ezt egyelőre nem
// fizeti elő, amíg nem tudja, megéri-e a német piac). A SZÖVEG viszont
// piac szerint magyar vagy német.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ADMIN_EMAIL = "apartmanasszisztens@gmail.com";

// TODO: ha valaha hitelesítve lesz az apartmentassistant.de domain a
// Resendnél, ezt cseréld "Apartment Assistant <hello@apartmentassistant.de>"-re.
const FROM_EMAIL = "Apartman Assistant <hello@apartmanassistant.hu>";

type Market = "hu" | "de";

function getMarket(value: unknown): Market {
  return value === "de" ? "de" : "hu";
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Resend hiba:", res.status, errText);
  }
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    if (table !== "profiles") {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const market = getMarket(record?.market);

    // 1) ÚJ REGISZTRÁCIÓ -> admin értesítés (Szonjának mindig magyarul megy,
    //    csak a piac van jelölve, hogy tudja melyik oldalról jött)
    if (type === "INSERT") {
      const name = record?.display_name ?? "Ismeretlen név";
      const html = `
        <p>Új regisztráció érkezett (piac: <strong>${market.toUpperCase()}</strong>).</p>
        <p><strong>Név:</strong> ${name}</p>
        <p><strong>Felhasználó ID:</strong> ${record?.id}</p>
        <p>Jóváhagyáshoz állítsd az "approved" mezőt TRUE-ra a Supabase profiles táblájában.</p>
      `;
      const ok = await sendEmail(
        ADMIN_EMAIL,
        `Új regisztráció [${market.toUpperCase()}] - Apartment Assistant`,
        html
      );
      return new Response(JSON.stringify({ adminNotified: ok }), { status: 200 });
    }

    // 2) JÓVÁHAGYÁS (approved: false -> true) -> üdvözlő email a
    //    felhasználónak, a piaca szerinti nyelven
    if (
      type === "UPDATE" &&
      old_record?.approved === false &&
      record?.approved === true
    ) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase.auth.admin.getUserById(record.id);

      if (error || !data?.user?.email) {
        console.error("Nem sikerült lekérni a felhasználó emailjét:", error);
        return new Response(JSON.stringify({ error: "no user email" }), {
          status: 200,
        });
      }

      const userEmail = data.user.email;

      const html =
        market === "de"
          ? `
        <p>Hallo!</p>
        <p>Willkommen bei Apartment Assistant! Ihre Registrierung wurde
        bestätigt, ab sofort stehen Ihnen alle Funktionen zur Verfügung.</p>
        <p>Wir hoffen, die App erleichtert Ihren Alltag, damit Sie mehr Zeit
        für Ihre Gäste haben.</p>
        <p>Viel Erfolg und viele wiederkehrende Gäste wünscht Ihnen<br/>
        das Apartment-Assistant-Team</p>
      `
          : `
        <p>Kedves Felhasználó!</p>
        <p>Üdvözlünk az Apartman Assistantban! Regisztrációdat jóváhagytuk,
        így mostantól minden funkció elérhető számodra.</p>
        <p>Bízunk benne, hogy az alkalmazás megkönnyíti a mindennapi
        munkádat, hogy te még több időt fordíthass a vendégeidre.</p>
        <p>Sikeres munkát és sok visszatérő vendéget kívánunk!</p>
        <p>Üdvözlettel:<br/>Apartman Asszisztens csapata</p>
      `;

      const subject =
        market === "de"
          ? "Registrierung erfolgreich - Apartment Assistant"
          : "Sikeres regisztráció - Apartman Assistant";

      const ok = await sendEmail(userEmail, subject, html);
      return new Response(JSON.stringify({ userNotified: ok }), { status: 200 });
    }

    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  } catch (e) {
    console.error("Hiba a notify-registration függvényben:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
