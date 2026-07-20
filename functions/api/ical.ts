const ALLOWED_ORIGINS = [
  "szallas.hu",
  "airbnb.com",
  "airbnb.hu",
  "booking.com",
  "google.com",
  "calendar.google.com",
  "vrbo.com",
  "homeaway.com",
  "tripadvisor.com",
  "expedia.com",
  "githubusercontent.com",
  "apartmanassistant.hu",
];

function isAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_ORIGINS.some((o) => hostname === o || hostname.endsWith(`.${o}`));
  } catch {
    return false;
  }
}

export const onRequestGet: PagesFunction = async (context) => {
  const { request } = context;
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing ?url= parameter", { status: 400 });
  }
  if (!isAllowed(targetUrl)) {
    return new Response("Domain not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ApartmanAssistant/1.0)",
        "Accept": "text/calendar, */*",
      },
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(`Upstream fetch failed: ${String(err)}`, { status: 502 });
  }
};
