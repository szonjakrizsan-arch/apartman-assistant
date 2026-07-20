/**
 * demo-ical.ts — dinamikusan generált, fiktív iCal feed a demo apartmanhoz.
 *
 * A dátumok mindig a mai naphoz képest relatívak, így a demo adatok
 * sosem "avulnak el" — akárki, akármikor kapcsolja be a demót,
 * friss (közelgő/aktuális) foglalásokat lát.
 */

function fmt(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export const onRequestGet: PagesFunction = async () => {
  const today = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())
  );

  const bookings = [
    { uid: "demo-1", startOffset: 0, endOffset: 3, summary: "Foglalva - Teszt Elek" },
    { uid: "demo-2", startOffset: 4,  endOffset: 7, summary: "Foglalva - Kovács Anna" },
    { uid: "demo-3", startOffset: 9,  endOffset: 12, summary: "Foglalva - Nagy Béla" },
  ];

  const events = bookings
    .map(
      (b) => `BEGIN:VEVENT
UID:${b.uid}@demo.apartmanassistant.hu
DTSTART;VALUE=DATE:${fmt(addDays(today, b.startOffset))}
DTEND;VALUE=DATE:${fmt(addDays(today, b.endOffset))}
DTSTAMP:${fmt(today)}T000000Z
SUMMARY:${b.summary}
END:VEVENT`
    )
    .join("\n");

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Apartman Assistant//Demo Feed//HU
CALSCALE:GREGORIAN
${events}
END:VCALENDAR`;

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
