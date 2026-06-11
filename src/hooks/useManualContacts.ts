import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

export interface ManualContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  note: string;
}

export function useManualContacts(userId: string | undefined) {
  const [contacts, setContacts] = useState<ManualContact[]>([]);

  const load = useCallback(async () => {
    setContacts([]);
    if (!userId) return;
    const { data } = await supabase
      .from("manual_contacts")
      .select("id, name, role, phone, email, note")
      .eq("user_id", userId)
      .order("created_at");
    setContacts((data ?? []).map((c) => ({
      id: c.id,
      name: c.name ?? "",
      role: c.role ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      note: c.note ?? "",
    })));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function addContact(c: Omit<ManualContact, "id">) {
    if (!userId) return;
    await supabase.from("manual_contacts").insert({
      user_id: userId,
      name: c.name, role: c.role, phone: c.phone, email: c.email, note: c.note,
    });
    await load();
  }

  async function deleteContact(id: string) {
    await supabase.from("manual_contacts").delete().eq("id", id);
    await load();
  }

  return { contacts, addContact, deleteContact };
}
