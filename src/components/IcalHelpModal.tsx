import { useState } from "react";
import { X, ChevronRight } from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────── */
const T = {
  primary:   "#F4F0E8",
  secondary: "#C8D4D0",
} as const;

const TEAL = {
  line:   "rgb(86 176 187 / 0.35)",
  border: "rgb(86 176 187 / 0.22)",
  dim:    "rgb(86 176 187 / 0.12)",
} as const;

const CORAL = {
  bg:   "rgb(220 132 96 / 0.16)",
  text: "#F0D4C0",
  glow: "0 0 0 1px rgb(220 132 96 / 0.35), 0 0 8px rgb(220 132 96 / 0.12)",
} as const;

/* ─── Tab definitions ───────────────────────────────────────────── */
interface Tab {
  id: string;
  label: string;
  emoji: string;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

const TABS: Tab[] = [
  {
    id: "elso",
    label: "Első lépések",
    emoji: "🚀",
    color: "#7dd4dd",
    activeBg: "rgb(86 176 187 / 0.18)",
    activeBorder: "rgb(86 176 187 / 0.55)",
    activeText: "#7dd4dd",
  },
  {
    id: "airbnb",
    label: "Airbnb",
    emoji: "🟢",
    color: "#ff5a5f",
    activeBg: "rgb(255 90 95 / 0.14)",
    activeBorder: "rgb(255 90 95 / 0.50)",
    activeText: "#ff8a8e",
  },
  {
    id: "booking",
    label: "Booking.com",
    emoji: "🔵",
    color: "#003580",
    activeBg: "rgb(0 130 200 / 0.14)",
    activeBorder: "rgb(0 130 200 / 0.50)",
    activeText: "#5ab4f0",
  },
  {
    id: "szallas",
    label: "Szállás.hu",
    emoji: "🟠",
    color: "#f97316",
    activeBg: "rgb(249 115 22 / 0.14)",
    activeBorder: "rgb(249 115 22 / 0.50)",
    activeText: "#fb923c",
  },
  {
    id: "google",
    label: "Google Naptár",
    emoji: "🔴",
    color: "#ea4335",
    activeBg: "rgb(234 67 53 / 0.14)",
    activeBorder: "rgb(234 67 53 / 0.50)",
    activeText: "#f87171",
  },
  {
    id: "vrbo",
    label: "VRBO",
    emoji: "🟣",
    color: "#7c3aed",
    activeBg: "rgb(124 58 237 / 0.14)",
    activeBorder: "rgb(124 58 237 / 0.50)",
    activeText: "#a78bfa",
  },
  {
    id: "tripadvisor",
    label: "TripAdvisor",
    emoji: "⚫",
    color: "#34d399",
    activeBg: "rgb(52 211 153 / 0.12)",
    activeBorder: "rgb(52 211 153 / 0.45)",
    activeText: "#34d399",
  },
  {
    id: "expedia",
    label: "Expedia",
    emoji: "🟨",
    color: "#fbbf24",
    activeBg: "rgb(251 191 36 / 0.12)",
    activeBorder: "rgb(251 191 36 / 0.45)",
    activeText: "#fbbf24",
  },
];

/* ─── Step component ────────────────────────────────────────────── */
function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5"
        style={{ background: "rgb(86 176 187 / 0.20)", color: "#7dd4dd", outline: "1px solid rgb(86 176 187 / 0.35)" }}
      >
        {number}
      </span>
      <p className="text-[13px] leading-relaxed" style={{ color: T.primary }}>{text}</p>
    </div>
  );
}

/* ─── InfoBox component ─────────────────────────────────────────── */
function InfoBox({ children, type = "tip" }: { children: React.ReactNode; type?: "tip" | "warn" }) {
  const isTip = type === "tip";
  return (
    <div
      className="rounded-xl px-4 py-3 flex gap-3 items-start"
      style={{
        background: isTip ? "rgb(86 176 187 / 0.08)" : "rgb(249 115 22 / 0.10)",
        border: `1px solid ${isTip ? "rgb(86 176 187 / 0.25)" : "rgb(249 115 22 / 0.30)"}`,
      }}
    >
      <span className="text-base shrink-0">{isTip ? "💡" : "⚠️"}</span>
      <p className="text-[12px] leading-relaxed" style={{ color: isTip ? "#7dd4dd" : "#fb923c" }}>
        {children}
      </p>
    </div>
  );
}

/* ─── Tab content ───────────────────────────────────────────────── */
function ElsoLepesekContent() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[15px] font-semibold mb-1" style={{ color: T.primary }}>Üdvözlünk!</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: T.secondary }}>
          Ez a Segítségközpont végigvezet az Apartman Assistant első beállításain. Az útmutatók kezdők számára készültek, ezért minden fontos lépést részletesen bemutatnak.
        </p>
      </div>

      <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "rgb(38 46 44 / 0.50)", border: `1px solid ${TEAL.border}` }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.secondary }}>Mi az az iCal?</p>
        <p className="text-[13px] leading-relaxed" style={{ color: T.primary }}>
          Az iCal egy internetes naptárkapcsolat. Segítségével a különböző foglalási oldalak (pl. Booking.com vagy Airbnb) automatikusan meg tudják osztani foglalási naptárukat az Apartman Assistanttal — így nem kell kézzel felírnod a vendégek adatait.
        </p>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: T.secondary }}>Mielőtt elkezded</p>
        <div className="flex flex-col gap-2">
          {[
            "Egy Apartman Assistant fiók",
            "Legalább egy apartman hozzáadva",
            "A foglalási oldalról kimásolt iCal hivatkozás",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "rgb(86 176 187 / 0.06)", border: `1px solid ${TEAL.dim}` }}>
              <span className="text-[13px]">✓</span>
              <span className="text-[13px]" style={{ color: T.primary }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: T.secondary }}>iCal hivatkozás hozzáadása az apphoz</p>
        <div className="flex flex-col gap-3">
          {[
            "Koppints az + Új apartman hozzáadása gombra.",
            "Írd be az apartman nevét, majd válassz egy színt. Koppints a Hozzáadás gombra.",
            "Az apartman megjelenik a listában. Koppints a jobb oldalon lévő lefelé mutató nyílra.",
            "Koppints az + iCal feed hozzáadása gombra.",
            "Válaszd ki a foglalási szolgáltatót (Airbnb, Booking.com, Szállás.hu stb.).",
            "Illeszd be az iCal URL mezőbe a kimásolt hivatkozást (https://...). Koppints a Mentés gombra.",
            "Ha több foglalási oldalt használsz, ismételd meg a 4–6. lépéseket minden szolgáltatóhoz.",
          ].map((step, i) => (
            <Step key={i} number={i + 1} text={step} />
          ))}
        </div>
      </div>

      <InfoBox>
        A foglalások nem mindig jelennek meg azonnal — az új foglalás megjelenési ideje a foglalási szolgáltatótól függ. Ez teljesen normális.
      </InfoBox>

      <InfoBox>
        A foglalási oldalak időnként módosítják a felületüket. Ha egy gomb vagy menüpont máshol jelenik meg, mint az útmutatóban, keresd ugyanazt a funkciót az aktuális felületen.
      </InfoBox>
    </div>
  );
}

function AirbnbContent() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "rgb(255 90 95 / 0.08)", border: "1px solid rgb(255 90 95 / 0.25)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#ff8a8e" }}>Szükséges</p>
        <p className="text-[13px]" style={{ color: T.primary }}>Airbnb házigazdai fiók + hozzáférés a szálláshelyhez</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          "Nyisd meg az airbnb.com oldalt, és jelentkezz be a fiókodba.",
          "A jobb felső sarokban kattints a Házigazdai teendők gombra. Ha nem látod, válaszd a Váltás a vendégfogadásra lehetőséget.",
          "A felső menüsorban kattints a Hirdetések menüpontra.",
          "Kattints arra a szálláshelyre, amelyet össze szeretnél kapcsolni.",
          "A szálláshely adatlapján kattints az Árazás és elérhetőség fülre.",
          "Görgess le, amíg meg nem találod a Naptárszinkronizálás részt.",
          "Kattints a Naptár exportálása lehetőségre.",
          "Másold ki a megjelenő hivatkozást — ez az iCal URL.",
          "Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást az Airbnb feednél.",
        ].map((step, i) => <Step key={i} number={i + 1} text={step} />)}
      </div>
      <InfoBox>Az Airbnb felülete időnként változhat. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.</InfoBox>
    </div>
  );
}

function BookingContent() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "rgb(0 130 200 / 0.08)", border: "1px solid rgb(0 130 200 / 0.25)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#5ab4f0" }}>Szükséges</p>
        <p className="text-[13px]" style={{ color: T.primary }}>Booking.com szállásadói fiók + Extranet hozzáférés</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          "Nyisd meg a booking.com oldalt, és jelentkezz be a szállásadói fiókoddal.",
          "A sikeres bejelentkezés után nyisd meg a Booking.com Extranetet — itt tudod kezelni az apartmanodat.",
          "Az Extranet főmenüjében keresd meg a Szoba és elérhetőség (Rooms & Availability) vagy Naptár menüpontot.",
          "Nyisd meg a Naptárszinkronizálás (iCal sync / Calendar sync) részt.",
          "Keresd meg az iCal exportálás / Naptár exportálása lehetőséget.",
          "Másold ki a megjelenő hivatkozást — ez az iCal URL.",
          "Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a Booking.com feednél.",
        ].map((step, i) => <Step key={i} number={i + 1} text={step} />)}
      </div>
      <InfoBox>A Booking.com Extranet felülete és menüpontjai időnként változhatnak. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.</InfoBox>
    </div>
  );
}

function SzallasContent() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "rgb(249 115 22 / 0.08)", border: "1px solid rgb(249 115 22 / 0.25)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#fb923c" }}>Szükséges</p>
        <p className="text-[13px]" style={{ color: T.primary }}>Szállás.hu Partner fiók + hozzáférés a szálláshelyhez</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          "Nyisd meg a szallas.hu oldalt, és jelentkezz be a Partner Portálra a saját felhasználóneveddel és jelszavaddal.",
          "A főmenüben keresd meg az Árak és kapacitás menüpontot, majd kattints rá.",
          "A megjelenő lehetőségek közül válaszd a Naptár szinkron (iCal) menüpontot.",
          "Ha több apartmant vagy szobát kezelsz, válaszd ki azt, amelyet össze szeretnél kapcsolni.",
          "Kattints a Naptár exportálása gombra. A rendszer létrehoz egy egyedi iCal hivatkozást.",
          "Kattints a Link másolása gombra, vagy másold ki a megjelenő hivatkozást.",
          "Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a Szállás.hu feednél.",
        ].map((step, i) => <Step key={i} number={i + 1} text={step} />)}
      </div>
      <InfoBox>A Szállás.hu időről időre módosíthatja a Partner Portál felépítését. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.</InfoBox>
    </div>
  );
}

function GoogleContent() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "rgb(234 67 53 / 0.08)", border: "1px solid rgb(234 67 53 / 0.25)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#f87171" }}>Szükséges</p>
        <p className="text-[13px]" style={{ color: T.primary }}>Google-fiók + foglalási naptár Google Naptárban • Csak számítógépen</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          "Nyisd meg a calendar.google.com oldalt, és jelentkezz be a Google-fiókodba.",
          "A bal oldalon, a Saját naptárak részben keresd meg azt a naptárat, amelyet a szálláshelyedhez használsz.",
          "Vidd az egérmutatót a naptár neve fölé, majd kattints a megjelenő három függőleges pontra.",
          "A megjelenő menüből válaszd a Beállítások és megosztás lehetőséget.",
          "A bal oldali menüben keresd meg a Naptár integrálása menüpontot (görgess le, ha nem látod).",
          "Keresd meg a Titkos cím iCal formátumban részt. Ez tartalmazza az egyedi hivatkozást.",
          "Kattints a Másolás ikonra, vagy másold ki a teljes hivatkozást.",
          "Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a Google Naptár feednél.",
        ].map((step, i) => <Step key={i} number={i + 1} text={step} />)}
      </div>
      <InfoBox>A Google időről időre módosíthatja a Naptár felépítését. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.</InfoBox>
    </div>
  );
}

function VrboContent() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "rgb(124 58 237 / 0.08)", border: "1px solid rgb(124 58 237 / 0.25)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>Szükséges</p>
        <p className="text-[13px]" style={{ color: T.primary }}>VRBO szállásadói fiók + hozzáférés a szálláshelyhez</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          "Nyisd meg a vrbo.com oldalt, és jelentkezz be a szállásadói fiókodba (Owner Dashboard).",
          "Ha több ingatlant kezelsz, válaszd ki azt, amelyet össze szeretnél kapcsolni.",
          "A bal oldali menüben kattints a Naptár (Calendar) menüpontra.",
          "Keresd meg az Importálás és Exportálás (Import & Export) lehetőséget (két egymás felé mutató nyíl ikon).",
          "Kattints a Naptár exportálása (Export calendar) lehetőségre.",
          "A megjelenő ablakban kattints az URL másolása (Copy URL) gombra.",
          "Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a VRBO feednél.",
        ].map((step, i) => <Step key={i} number={i + 1} text={step} />)}
      </div>
      <InfoBox type="warn">
        A VRBO felületén előfordulhat egy „Include tentative reservations" jelölőnégyzet. Ha az iCal hivatkozást az Apartman Assistanthoz használod, hagyd ezt kikapcsolva.
      </InfoBox>
      <InfoBox>A VRBO időről időre módosíthatja a felületét. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.</InfoBox>
    </div>
  );
}

function TripadvisorContent() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "rgb(52 211 153 / 0.06)", border: "1px solid rgb(52 211 153 / 0.20)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#34d399" }}>Szükséges</p>
        <p className="text-[13px]" style={{ color: T.primary }}>TripAdvisor Rentals tulajdonosi fiók + hozzáférés a szálláshelyhez</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          "Nyisd meg a tripadvisor.com/rentals oldalt, és jelentkezz be a tulajdonosi fiókodba.",
          "Ha több szálláshelyet kezelsz, válaszd ki azt, amelyet össze szeretnél kapcsolni.",
          "A felső menüsorban kattints a Naptár (Calendar) fülre.",
          "A naptár oldalán keresd meg a Naptár exportálása (Export calendar) gombot (általában jobb oldalt vagy felül).",
          "A megjelenő ablakban kattints a Link másolása (Copy Link / Copy to clipboard) gombra.",
          "Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a TripAdvisor feednél.",
        ].map((step, i) => <Step key={i} number={i + 1} text={step} />)}
      </div>
      <InfoBox>A TripAdvisor Rentals felülete időről időre módosulhat. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.</InfoBox>
    </div>
  );
}

function ExpediaContent() {
  return (
    <div className="flex flex-col gap-5">
      <InfoBox type="warn">
        Az Expedia Partner Central felületén nem minden szálláshely esetében érhető el az iCal exportálás. Egyes szálláshelytípusoknál az Expedia kizárólag professzionális Channel Manager rendszer használatát támogatja.
      </InfoBox>
      <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "rgb(251 191 36 / 0.06)", border: "1px solid rgb(251 191 36 / 0.20)" }}>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#fbbf24" }}>Szükséges</p>
        <p className="text-[13px]" style={{ color: T.primary }}>Expedia Partner Central fiók + hozzáférés a szálláshelyhez</p>
      </div>
      <div className="flex flex-col gap-3">
        {[
          "Nyisd meg az expediapartnercentral.com oldalt, és jelentkezz be a szállásadói fiókoddal.",
          "A főmenüben keresd meg a Szobák és árak (Rooms and Rates) menüpontot.",
          "Válaszd a Szobatípusok és ártervek (Room types and Rate plans) menüpontot.",
          "Keresd meg a Naptárak összekapcsolása (Connect calendars) lehetőséget.",
          "Ha több szobát kezelsz, válaszd ki a megfelelő szálláshelyet.",
          "Görgess az Expedia Group naptár exportálása részhez, majd kattints a Link létrehozása (Create link) gombra.",
          "Másold ki a létrehozott hivatkozást.",
          "Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást az Expedia feednél.",
        ].map((step, i) => <Step key={i} number={i + 1} text={step} />)}
      </div>
      <InfoBox type="warn">
        Ha a „Naptárak összekapcsolása" menüpont nem jelenik meg, az Expedia az adott szálláshelyhez Channel Manager rendszert vár — iCal exportálás nem elérhető.
      </InfoBox>
      <InfoBox>Az Expedia Partner Central felülete időről időre módosulhat. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.</InfoBox>
    </div>
  );
}
/* ─── Plain text export ─────────────────────────────────────────── */
const TAB_TEXT: Record<string, string> = {
  elso: `APARTMAN ASSISTANT – iCal beállítási útmutató
Első lépések
============

Mi az az iCal?
Az iCal egy internetes naptárkapcsolat. Segítségével a különböző foglalási oldalak (pl. Booking.com vagy Airbnb) automatikusan meg tudják osztani foglalási naptárukat az Apartman Assistanttal — így nem kell kézzel felírnod a vendégek adatait.

Mielőtt elkezded:
- Egy Apartman Assistant fiók
- Legalább egy apartman hozzáadva
- A foglalási oldalról kimásolt iCal hivatkozás

iCal hivatkozás hozzáadása az apphoz:
1. Koppints az + Új apartman hozzáadása gombra.
2. Írd be az apartman nevét, majd válassz egy színt. Koppints a Hozzáadás gombra.
3. Az apartman megjelenik a listában. Koppints a jobb oldalon lévő lefelé mutató nyílra.
4. Koppints az + iCal feed hozzáadása gombra.
5. Válaszd ki a foglalási szolgáltatót (Airbnb, Booking.com, Szállás.hu stb.).
6. Illeszd be az iCal URL mezőbe a kimásolt hivatkozást (https://...). Koppints a Mentés gombra.
7. Ha több foglalási oldalt használsz, ismételd meg a 4–6. lépéseket minden szolgáltatóhoz.

Jó tudni: A foglalások nem mindig jelennek meg azonnal — az új foglalás megjelenési ideje a foglalási szolgáltatótól függ. Ez teljesen normális.`,

  airbnb: `APARTMAN ASSISTANT – iCal beállítási útmutató
Airbnb
======

Szükséges: Airbnb házigazdai fiók + hozzáférés a szálláshelyhez

1. Nyisd meg az airbnb.com oldalt, és jelentkezz be a fiókodba.
2. A jobb felső sarokban kattints a Házigazdai teendők gombra. Ha nem látod, válaszd a Váltás a vendégfogadásra lehetőséget.
3. A felső menüsorban kattints a Hirdetések menüpontra.
4. Kattints arra a szálláshelyre, amelyet össze szeretnél kapcsolni.
5. A szálláshely adatlapján kattints az Árazás és elérhetőség fülre.
6. Görgess le, amíg meg nem találod a Naptárszinkronizálás részt.
7. Kattints a Naptár exportálása lehetőségre.
8. Másold ki a megjelenő hivatkozást — ez az iCal URL.
9. Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást az Airbnb feednél.

Jó tudni: Az Airbnb felülete időnként változhat. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.`,

  booking: `APARTMAN ASSISTANT – iCal beállítási útmutató
Booking.com
===========

Szükséges: Booking.com szállásadói fiók + Extranet hozzáférés

1. Nyisd meg a booking.com oldalt, és jelentkezz be a szállásadói fiókoddal.
2. A sikeres bejelentkezés után nyisd meg a Booking.com Extranetet.
3. Az Extranet főmenüjében keresd meg a Szoba és elérhetőség vagy Naptár menüpontot.
4. Nyisd meg a Naptárszinkronizálás (iCal sync / Calendar sync) részt.
5. Keresd meg az iCal exportálás / Naptár exportálása lehetőséget.
6. Másold ki a megjelenő hivatkozást — ez az iCal URL.
7. Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a Booking.com feednél.

Jó tudni: A Booking.com Extranet felülete időnként változhat. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.`,

  szallas: `APARTMAN ASSISTANT – iCal beállítási útmutató
Szállás.hu
==========

Szükséges: Szállás.hu Partner fiók + hozzáférés a szálláshelyhez

1. Nyisd meg a szallas.hu oldalt, és jelentkezz be a Partner Portálra.
2. A főmenüben keresd meg az Árak és kapacitás menüpontot, majd kattints rá.
3. A megjelenő lehetőségek közül válaszd a Naptár szinkron (iCal) menüpontot.
4. Ha több apartmant kezelsz, válaszd ki a megfelelőt.
5. Kattints a Naptár exportálása gombra.
6. Kattints a Link másolása gombra, vagy másold ki a megjelenő hivatkozást.
7. Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a Szállás.hu feednél.

Jó tudni: A Szállás.hu időről időre módosíthatja a Partner Portál felépítését. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.`,

  google: `APARTMAN ASSISTANT – iCal beállítási útmutató
Google Naptár
=============

Szükséges: Google-fiók + foglalási naptár Google Naptárban • Csak számítógépen

1. Nyisd meg a calendar.google.com oldalt, és jelentkezz be.
2. A bal oldalon, a Saját naptárak részben keresd meg a szálláshelyedhez használt naptárat.
3. Vidd az egérmutatót a naptár neve fölé, majd kattints a három függőleges pontra.
4. Válaszd a Beállítások és megosztás lehetőséget.
5. A bal oldali menüben keresd meg a Naptár integrálása menüpontot.
6. Keresd meg a Titkos cím iCal formátumban részt.
7. Kattints a Másolás ikonra, vagy másold ki a teljes hivatkozást.
8. Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a Google Naptár feednél.

Jó tudni: A Google időről időre módosíthatja a Naptár felépítését. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.`,

  vrbo: `APARTMAN ASSISTANT – iCal beállítási útmutató
VRBO
====

Szükséges: VRBO szállásadói fiók + hozzáférés a szálláshelyhez

1. Nyisd meg a vrbo.com oldalt, és jelentkezz be a szállásadói fiókodba (Owner Dashboard).
2. Ha több ingatlant kezelsz, válaszd ki a megfelelőt.
3. A bal oldali menüben kattints a Naptár (Calendar) menüpontra.
4. Keresd meg az Importálás és Exportálás (Import & Export) lehetőséget.
5. Kattints a Naptár exportálása (Export calendar) lehetőségre.
6. Kattints az URL másolása (Copy URL) gombra.
7. Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a VRBO feednél.

Figyelem: A VRBO felületén előfordulhat egy "Include tentative reservations" jelölőnégyzet. Ha az Apartman Assistanthoz használod az iCal hivatkozást, hagyd ezt kikapcsolva.`,

  tripadvisor: `APARTMAN ASSISTANT – iCal beállítási útmutató
TripAdvisor
===========

Szükséges: TripAdvisor Rentals tulajdonosi fiók + hozzáférés a szálláshelyhez

1. Nyisd meg a tripadvisor.com/rentals oldalt, és jelentkezz be a tulajdonosi fiókodba.
2. Ha több szálláshelyet kezelsz, válaszd ki a megfelelőt.
3. A felső menüsorban kattints a Naptár (Calendar) fülre.
4. Keresd meg a Naptár exportálása (Export calendar) gombot (általában jobb oldalt vagy felül).
5. Kattints a Link másolása (Copy Link / Copy to clipboard) gombra.
6. Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást a TripAdvisor feednél.

Jó tudni: A TripAdvisor Rentals felülete időről időre módosulhat. Ha egy menüpont máshol jelenik meg, keresd ugyanazt a funkciót az aktuális felületen.`,

  expedia: `APARTMAN ASSISTANT – iCal beállítási útmutató
Expedia
=======

Figyelem: Az Expedia Partner Central felületén nem minden szálláshely esetében érhető el az iCal exportálás.

Szükséges: Expedia Partner Central fiók + hozzáférés a szálláshelyhez

1. Nyisd meg az expediapartnercentral.com oldalt, és jelentkezz be.
2. A főmenüben keresd meg a Szobák és árak (Rooms and Rates) menüpontot.
3. Válaszd a Szobatípusok és ártervek (Room types and Rate plans) menüpontot.
4. Keresd meg a Naptárak összekapcsolása (Connect calendars) lehetőséget.
5. Ha több szobát kezelsz, válaszd ki a megfelelő szálláshelyet.
6. Görgess az Expedia Group naptár exportálása részhez, majd kattints a Link létrehozása (Create link) gombra.
7. Másold ki a létrehozott hivatkozást.
8. Térj vissza az Apartman Assistantba, és add hozzá ezt a hivatkozást az Expedia feednél.

Figyelem: Ha a "Naptárak összekapcsolása" menüpont nem jelenik meg, az Expedia az adott szálláshelyhez Channel Manager rendszert vár — iCal exportálás nem elérhető.`,
};

function downloadTxt(tabId: string, label: string) {
  const text = TAB_TEXT[tabId] ?? "";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ical-utmutato-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
/* ─── Content router ────────────────────────────────────────────── */
function TabContent({ tabId }: { tabId: string }) {
  switch (tabId) {
    case "elso":        return <ElsoLepesekContent />;
    case "airbnb":      return <AirbnbContent />;
    case "booking":     return <BookingContent />;
    case "szallas":     return <SzallasContent />;
    case "google":      return <GoogleContent />;
    case "vrbo":        return <VrboContent />;
    case "tripadvisor": return <TripadvisorContent />;
    case "expedia":     return <ExpediaContent />;
    default:            return <ElsoLepesekContent />;
  }
}

/* ─── Main modal ────────────────────────────────────────────────── */
interface IcalHelpModalProps {
  onClose: () => void;
}

export function IcalHelpModal({ onClose }: IcalHelpModalProps) {
const [activeTab, setActiveTab] = useState("elso");
  const active = TABS.find(t => t.id === activeTab)!;
  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:px-4"
      style={{ background: "rgb(0 0 0 / 0.75)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      <div
        className="relative flex w-full flex-col rounded-t-3xl sm:max-w-2xl sm:rounded-3xl"
        style={{
          background: "#1C2422",
          boxShadow: "0 -8px 48px rgb(0 0 0 / 0.60), 0 0 0 1px rgb(86 176 187 / 0.18)",
          maxHeight: "92dvh",
        }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 px-5 pt-4 pb-4" style={{ borderBottom: `1px solid ${TEAL.border}` }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold" style={{ color: T.primary }}>📋 iCal beállítási útmutató</h2>
              <p className="text-[12px] mt-0.5" style={{ color: T.secondary }}>Válaszd ki a platformot, amelyet össze szeretnél kapcsolni</p>
            </div>
            <button
              type="button"
              onClick={() => downloadTxt(activeTab, active.label)}
              className="pressable flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-soft"
              style={{ background: "rgb(86 176 187 / 0.12)", color: "#7dd4dd", outline: "1px solid rgb(86 176 187 / 0.30)" }}
            >
              ⬇ Mentés .txt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="pressable flex h-8 w-8 items-center justify-center rounded-full transition-soft"
              style={{ background: CORAL.bg, boxShadow: CORAL.glow }}
              aria-label="Bezárás"
            >
              <X className="h-4 w-4" style={{ color: CORAL.text }} />
            </button>
          </div>

 {/* ── Tab bar ── */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(TABS[Math.max(0, activeIndex - 1)].id)}
              disabled={activeIndex === 0}
              className="pressable shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition-soft"
              style={{ background: "rgb(38 46 44 / 0.80)", color: activeIndex === 0 ? "rgb(86 176 187 / 0.25)" : T.secondary, outline: `1px solid ${TEAL.border}` }}
            >
              ‹
            </button>
            <div className="flex-1 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="pressable shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-soft"
                    style={isActive
                      ? { background: tab.activeBg, color: tab.activeText, outline: `1px solid ${tab.activeBorder}` }
                      : { background: "rgb(38 46 44 / 0.60)", color: T.secondary, outline: `1px solid ${TEAL.border}` }
                    }
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab(TABS[Math.min(TABS.length - 1, activeIndex + 1)].id)}
              disabled={activeIndex === TABS.length - 1}
              className="pressable shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition-soft"
              style={{ background: "rgb(38 46 44 / 0.80)", color: activeIndex === TABS.length - 1 ? "rgb(86 176 187 / 0.25)" : T.secondary, outline: `1px solid ${TEAL.border}` }}
            >
              ›
            </button>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(92dvh - 140px)" }}>
          <div className="px-5 py-5 pb-8">
            {/* Active tab title */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">{active.emoji}</span>
              <h3 className="text-[15px] font-bold" style={{ color: active.activeText }}>{active.label}</h3>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${active.activeBorder}, transparent)` }} />
            </div>
            <TabContent tabId={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
