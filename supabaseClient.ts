import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://iptsxjlrqjbgealxgbux.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdHN4amxycWpiZ2VhbHhnYnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Mzk2MTcsImV4cCI6MjA5NjUxNTYxN30.y7uyI9fP8Nip-Vh_Bvq_wieC1YWVZLuIPv8XkurhCos";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);