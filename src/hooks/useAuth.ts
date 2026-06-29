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
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");
    if (isRecovery) {
      sessionStorage.setItem("passwordRecovery", "true");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const recovering = sessionStorage.getItem("passwordRecovery") === "true";
      if (recovering && session?.user) {
        setPasswordRecovery(true);
        setUser(session.user);
      } else if (event !== "TOKEN_REFRESHED") {
          setUser(session?.user ?? null);
        }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          sessionStorage.setItem("passwordRecovery", "true");
          setPasswordRecovery(true);
          setUser(session?.user ?? null);
        } else if (event === "SIGNED_OUT") {
          sessionStorage.removeItem("passwordRecovery");
          setPasswordRecovery(false);
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    passwordRecovery,
    clearRecovery: () => {
      sessionStorage.removeItem("passwordRecovery");
      setPasswordRecovery(false);
    }
  };
}
