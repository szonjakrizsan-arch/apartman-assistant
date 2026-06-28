import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Home, Eye, EyeOff } from "lucide-react";

export function ResetPasswordScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword]   = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");
    if (password.length < 6) { setError("A jelszó legalább 6 karakter legyen."); return; }
    if (password !== password2) { setError("A két jelszó nem egyezik."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
  if (error.message.includes("different from the old password")) {
    setError("Az új jelszó nem lehet ugyanaz, mint a régi.");
  } else {
    setError("Hiba történt. Kérjük próbáld újra.");
  }
  return;
}
 await supabase.auth.signOut();
setSuccess(true);
setTimeout(onDone, 2000);
  }

  const inputCls = "w-full rounded-xl border bg-surface-inset px-4 py-3 pr-12 text-[13px] text-text-primary outline-none input-teal";
  const inputStyle = { borderColor: "rgb(86 176 187 / 0.25)" } as React.CSSProperties;

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgb(99 190 162 / 0.15)", outline: "1px solid rgb(99 190 162 / 0.25)" }}>
            <Home className="h-6 w-6" style={{ color: "#63bea2" }} />
          </span>
          <div className="text-center">
            <h1 className="text-[18px] font-bold text-text-primary">Új jelszó beállítása</h1>
            <p className="text-[12px] text-text-muted mt-0.5">Add meg az új jelszavad</p>
          </div>
        </div>

        <div className="card-elevated rounded-2xl p-6 flex flex-col gap-4">
          {success ? (
            <p className="text-[13px] rounded-lg px-3 py-2 text-center"
              style={{ background: "rgb(90 191 138 / 0.12)", color: "#5abf8a" }}>
              Jelszó megváltoztatva! Átirányítás…
            </p>
          ) : (
            <>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Új jelszó" className={inputCls} style={inputStyle} />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "rgb(143 168 158 / 0.8)" }}
                  aria-label={showPassword ? "Jelszó elrejtése" : "Jelszó megjelenítése"}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input type={showPassword ? "text" : "password"} value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Új jelszó még egyszer" className={inputCls} style={inputStyle} />

              {error && (
                <p className="text-[12px] rounded-lg px-3 py-2"
                  style={{ background: "rgb(207 102 85 / 0.12)", color: "#cf6655" }}>
                  {error}
                </p>
              )}

              <button type="button" onClick={handleSubmit} disabled={loading}
                className="pressable w-full rounded-xl py-3 text-[13px] font-semibold transition-soft"
                style={{ background: "rgb(86 176 187 / 0.20)", color: "#56b0bb", outline: "1px solid rgb(86 176 187 / 0.30)" }}>
                {loading ? "..." : "Jelszó mentése"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
