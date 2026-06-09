import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import type { ApartmentAccent } from "../data/mockData";

export interface ApartmentRow {
  id: string;
  name: string;
  accent: ApartmentAccent;
}

export interface FeedRow {
  id: string;
  apartment_id: string;
  source: string;
  url: string;
}

export function useApartments(userId: string | undefined) {
  const [apartments, setApartments] = useState<ApartmentRow[]>([]);
  const [feeds, setFeeds]           = useState<FeedRow[]>([]);
  const [loading, setLoading]       = useState(true);

  async function load() {
    if (!userId) return;
    setLoading(true);

    const { data: apts } = await supabase
      .from("apartments")
      .select("id, name, accent")
      .eq("user_id", userId)
      .order("created_at");

    const { data: fds } = await supabase
      .from("ical_feeds")
      .select("id, apartment_id, source, url")
      .eq("user_id", userId);

    setApartments(apts ?? []);
    setFeeds(fds ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]);

  async function addApartment(name: string, accent: ApartmentAccent) {
    if (!userId) return;
    await supabase.from("apartments").insert({ user_id: userId, name, accent });
    await load();
  }

  async function deleteApartment(id: string) {
    await supabase.from("apartments").delete().eq("id", id);
    await load();
  }

  async function addFeed(apartmentId: string, source: string, url: string) {
    if (!userId) return;
    await supabase.from("ical_feeds").insert({ user_id: userId, apartment_id: apartmentId, source, url });
    await load();
  }

  async function deleteFeed(id: string) {
    await supabase.from("ical_feeds").delete().eq("id", id);
    await load();
  }

  return { apartments, feeds, loading, addApartment, deleteApartment, addFeed, deleteFeed };
}