// notify-registration
//
// Ez a funkció regisztrációkor (INSERT a "profiles" táblában) KÉT emailt
// küld a Resend segítségével, egyszerre, jóváhagyástól teljesen
// függetlenül (a jóváhagyás gate jelenleg mindkét appban ki van kapcsolva,
// a userek azonnal beengedve):
// 1) Admin-értesítés (apartmanasszisztens@gmail.com) — hogy Szonja tudja,
//    érkezett egy új regisztráció, és melyik piacról (HU/DE).
// 2) Üdvözlő email a frissen regisztrált usernek.
//
// A funkciót Database Webhook hívja meg (csak Insert eseménynél).
//
// FONTOS: a magyar (apartmanassistant.hu) és a német (apartmentassistant.de)
// app UGYANAZT a Supabase projektet és "profiles" táblát használja. A
// "market" oszlop ("hu" vagy "de", AuthScreen.tsx tölti ki regisztrációkor)
// mondja meg, melyik nyelven/márkával kell válaszolni.
//
// A leveleket egyelőre MINDKÉT piacnál a hitelesített apartmanassistant.hu
// domainről küldjük (a apartmentassistant.de domain még nincs hitelesítve
// a Resendnél — ez fizetős csomagot igényelne, amíg nem éri meg, Szonja
// nem fizeti elő). A SZÖVEG viszont piac szerint magyar vagy német.
//
// TÖRTÉNETI MEGJEGYZÉS: korábban az üdvözlő email a manuális jóváhagyáshoz
// (profiles.approved false -> true) volt kötve. Mivel a jóváhagyás-gate ma
// mindkét appban ki van kapcsolva, ez a lépés a gyakorlatban soha nem
// futott le, így az üdvözlő email valójában nem ment ki senkinek. Emiatt
// az üdvözlő email most a regisztrációhoz (INSERT) van kötve, közvetlenül.
// Ha egyszer (pl. fizetős indításkor) visszakapcsoljátok a jóváhagyást,
// ezt a logikát érdemes lesz újragondolni.

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

function welcomeEmailContent(market: Market): { subject: string; html: string } {
  if (market === "de") {
    return {
      subject: "Willkommen bei Apartment Assistant!",
      html: `
        <p>Hallo!</p>
        <p>Willkommen bei Apartment Assistant! Ihre Registrierung war
        erfolgreich, ab sofort stehen Ihnen alle Funktionen zur Verfügung.</p>
        <p>Wir hoffen, die App erleichtert Ihren Alltag, damit Sie mehr Zeit
        für Ihre Gäste haben.</p>
        <p>Viel Erfolg und viele wiederkehrende Gäste wünscht Ihnen<br/>
        das Apartment-Assistant-Team</p>
      `,
    };
  }
  return {
    subject: "Üdvözlünk az Apartman Assistantban!",
    html: `
      <p>Kedves Felhasználó!</p>
      <p>Üdvözlünk az Apartman Assistantban! Sikeresen regisztráltál, így
      mostantól minden funkció elérhető számodra.</p>
      <p>Bízunk benne, hogy az alkalmazás megkönnyíti a mindennapi
      munkádat, hogy te még több időt fordíthass a vendégeidre.</p>
      <p>Sikeres munkát és sok visszatérő vendéget kívánunk!</p>
      <p>Üdvözlettel:<br/>Apartman Asszisztens csapata</p>
    `,
  };
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, table, record } = payload;

    if (table !== "profiles") {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    // ÚJ REGISZTRÁCIÓ -> admin értesítés ÉS üdvözlő email a usernek,
    // egyszerre, jóváhagyás nélkül.
    if (type === "INSERT") {
      const market = getMarket(record?.market);
      const name = record?.display_name ?? "Ismeretlen név";

      const adminHtml = `
        <p>Új regisztráció érkezett (piac: <strong>${market.toUpperCase()}</strong>).</p>
        <p><strong>Név:</strong> ${name}</p>
        <p><strong>Felhasználó ID:</strong> ${record?.id}</p>
      `;
      const adminOk = await sendEmail(
        ADMIN_EMAIL,
        `Új regisztráció [${market.toUpperCase()}] - Apartment Assistant`,
        adminHtml
      );

      let userOk = false;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase.auth.admin.getUserById(record.id);

      if (error || !data?.user?.email) {
        console.error("Nem sikerült lekérni a felhasználó emailjét:", error);
      } else {
        const { subject, html } = welcomeEmailContent(market);
        userOk = await sendEmail(data.user.email, subject, html);
      }

      return new Response(
        JSON.stringify({ adminNotified: adminOk, userWelcomed: userOk }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  } catch (e) {
    console.error("Hiba a notify-registration függvényben:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
