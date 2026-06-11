import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

export interface AuthState {
  user: User | null;
  loading: boolean;
  passwordRecovery: boolean;
  clearRecovery: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    /* Aktuális session lekérése */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    /* Session változás figyelése */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, passwordRecovery, clearRecovery: () => setPasswordRecovery(false) };
}
