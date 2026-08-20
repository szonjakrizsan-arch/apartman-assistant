/**
 * functions/api/cleaning/[token]/manifest.json.ts
 *
 * Apartman-specifikus web-app manifestet ad vissza a nyilvános
 * takarítói oldalhoz. Így a takarító a „Kezdőképernyőhöz adás"
 * funkcióval saját kis ikonként mentheti el az oldalt —
 * az adott apartman nevével, egy generikus
 * böngésző-könyvjelző helyett, amit WhatsAppban kellene megkeresni.
 */

interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const SUPABASE_URL = "https://iptsxjlrqjbgealxgbux.supabase.co";

async function findApartmentName(env: Env, token: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/apartments?cleaning_token=eq.${encodeURIComponent(token)}&select=name&limit=1`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as any[];
  return rows[0]?.name ?? null;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const token = params.token as string;
  const name = (await findApartmentName(env, token)) ?? "Takarítás";

  const manifest = {
    name: `Takarítás — ${name}`,
    short_name: name.length > 12 ? name.slice(0, 12) + "…" : name,
    start_url: `/api/cleaning/${token}`,
    scope: `/api/cleaning/${token}`,
    display: "standalone",
    background_color: "#1C2422",
    theme_color: "#1C2422",
    icons: [
      { src: "https://app.apartmanassistant.hu/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "https://app.apartmanassistant.hu/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
};
