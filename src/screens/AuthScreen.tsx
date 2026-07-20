import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Home, Eye, EyeOff } from "lucide-react";
import { LegalScreen } from "./LegalScreen";
import type { LegalDoc } from "./LegalScreen";
import { trackRegistrationComplete } from "../lib/metaPixel";

type AuthMode = "login" | "register" | "forgot";

export function AuthScreen() {
  const [mode, setMode]       = useState<AuthMode>("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function handleSubmit() {
    setError(""); setSuccess(""); setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("Hibás email vagy jelszó.");

    } else if (mode === "register") {
      if (!name.trim()) { setError("Kérjük adja meg a nevét."); setLoading(false); return; }
      if (!accepted) { setError("A regisztrációhoz el kell fogadnod a feltételeket."); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: name } }
      });
      if (error) setError("Regisztráció sikertelen: " + error.message);
      else if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("Ez az email cím már regisztrálva van. Jelentkezz be, vagy állítsd vissza a jelszavad.");
      } else {
        setSuccess("Sikeres regisztráció! A fiókod jóváhagyásra vár — hamarosan értesítünk.");
        trackRegistrationComplete();
      }

    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) setError("Hiba: " + error.message);
      else setSuccess("Jelszó visszaállító email elküldve!");
    }

    setLoading(false);
  }

  if (legalDoc) {
    return <LegalScreen doc={legalDoc} onBack={() => setLegalDoc(null)} />;
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgb(99 190 162 / 0.15)", outline: "1px solid rgb(99 190 162 / 0.25)" }}>
            <Home className="h-6 w-6" style={{ color: "#63bea2" }} />
          </span>
          <div className="text-center">
            <h1 className="text-[18px] font-bold text-text-primary">Apartman Assistant</h1>
            <p className="text-[12px] text-text-muted mt-0.5">Apartmankezelő rendszer</p>
          </div>
        </div>

        {/* Card */}
        <div className="card-elevated rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-[15px] font-semibold text-text-primary">
            {mode === "login" ? "Bejelentkezés" : mode === "register" ? "Regisztráció" : "Jelszó visszaállítás"}
          </h2>

          {mode === "register" && (
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Teljes neve"
              className="w-full rounded-xl border bg-surface-inset px-4 py-3 text-[13px] text-text-primary outline-none input-teal"
              style={{ borderColor: "rgb(86 176 187 / 0.25)" }} />
          )}

          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email cím"
            className="w-full rounded-xl border bg-surface-inset px-4 py-3 text-[13px] text-text-primary outline-none input-teal"
            style={{ borderColor: "rgb(86 176 187 / 0.25)" }} />

          {mode !== "forgot" && (
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Jelszó"
                className="w-full rounded-xl border bg-surface-inset px-4 py-3 pr-12 text-[13px] text-text-primary outline-none input-teal"
                style={{ borderColor: "rgb(86 176 187 / 0.25)" }} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: "rgb(143 168 158 / 0.8)" }}
                aria-label={showPassword ? "Jelszó elrejtése" : "Jelszó megjelenítése"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}

          {mode === "register" && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#56b0bb]" />
              <span className="text-[12px] leading-relaxed text-text-secondary">
                Elolvastam és elfogadom az{" "}
                <button type="button" onClick={() => setLegalDoc("terms")}
                  className="underline" style={{ color: "#56b0bb" }}>ÁSZF-et</button>
                {" "}és az{" "}
                <button type="button" onClick={() => setLegalDoc("privacy")}
                  className="underline" style={{ color: "#56b0bb" }}>Adatkezelési tájékoztatót</button>.
              </span>
            </label>
          )}

          {error && (
            <p className="text-[12px] rounded-lg px-3 py-2" style={{ background: "rgb(207 102 85 / 0.12)", color: "#cf6655" }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-[12px] rounded-lg px-3 py-2" style={{ background: "rgb(90 191 138 / 0.12)", color: "#5abf8a" }}>
              {success}
            </p>
          )}

          <button type="button" onClick={handleSubmit} disabled={loading}
            className="pressable w-full rounded-xl py-3 text-[13px] font-semibold transition-soft"
            style={{ background: "rgb(86 176 187 / 0.20)", color: "#56b0bb", outline: "1px solid rgb(86 176 187 / 0.30)" }}>
            {loading ? "..." : mode === "login" ? "Bejelentkezés" : mode === "register" ? "Regisztráció" : "Küldés"}
          </button>

          {/* Mode switcher */}
          <div className="flex flex-col gap-1 pt-1">
            {mode === "login" && (
              <>
                <button type="button" onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                  className="text-[12px] text-text-secondary hover:text-text-primary transition-soft">
                  Még nincs fiókja? Regisztráljon
                </button>
                <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                  className="text-[12px] text-text-muted hover:text-text-secondary transition-soft">
                  Elfelejtett jelszó
                </button>
              </>
            )}
            {mode !== "login" && (
              <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="text-[12px] text-text-secondary hover:text-text-primary transition-soft">
                Vissza a bejelentkezéshez
              </button>
            )}
          </div>
        </div>

        {/* Jogi linksor */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button type="button" onClick={() => setLegalDoc("terms")}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-soft">ÁSZF</button>
          <span className="text-[11px] text-text-muted" aria-hidden>·</span>
          <button type="button" onClick={() => setLegalDoc("privacy")}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-soft">Adatkezelés</button>
          <span className="text-[11px] text-text-muted" aria-hidden>·</span>
          <button type="button" onClick={() => setLegalDoc("contact")}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-soft">Impresszum</button>
        </div>
      </div>
    </div>
  );
}
