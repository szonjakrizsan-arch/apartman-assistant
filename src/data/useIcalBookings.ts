/**
 * useIcalBookings.ts — React hook that fetches and refreshes iCal data.
 *
 * Az "first checkin" mechanizmus: a Szállás.hu naponta levágja a
 * múltbeli napokat a feedből, ezért az először látott érkezési
 * dátumot Supabase-be mentjük (booking_starts), és mindig azt használjuk.
 */
import { useState, useEffect, useCallback } from "react";
import type { Booking, FutureBooking } from "./mockData";
import type { FeedConfig } from "./icalFeeds";
import type { ApartmentRow, FeedRow } from "../hooks/useApartments";
import { proxy } from "./icalFeeds";
import { fetchAllBookings, fetchFutureBookings } from "./icalBookings";
import { supabase } from "../supabaseClient";

export type IcalStatus = "idle" | "loading" | "success" | "error";

export interface IcalState {
  status:         IcalStatus;
  bookings:       Booking[];
  futureBookings: FutureBooking[];
  errors:         string[];
  lastFetched:    Date | null;
  refetch:        () => void;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useIcalBookings(
  apartments: ApartmentRow[],
  feeds: FeedRow[],
  userId?: string,
): IcalState {
  const [status,         setStatus]        = useState<IcalStatus>("idle");
  const [bookings,       setBookings]       = useState<Booking[]>([]);
  const [futureBookings, setFutureBookings] = useState<FutureBooking[]>([]);
  const [errors,         setErrors]         = useState<string[]>([]);
  const [lastFetched,    setLastFetched]    = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!apartments || !feeds || !apartments.length || !feeds.length) {
      setBookings([]);
      setFutureBookings([]);
      setErrors([]);
      return;
    }

    /* Supabase adatokból FeedConfig[] összerakása */
    const feedConfigs: FeedConfig[] = feeds.flatMap((f) => {
      const apt = apartments.find((a) => a.id === f.apartment_id);
      if (!apt) return [];
      return [{
        apartment: apt.name,
        accent:    apt.accent,
        source:    f.source as FeedConfig["source"],
        url:       proxy(f.url),
      }];
    });

    setStatus("loading");
    try {
      /* 1. Ismert foglalások betöltése (kezdő + vég dátum) */
      let firstCheckins: Record<string, string> = {};
      let knownBookings: Record<string, { firstCheckin: string; lastCheckout: string; apartment: string; accent: string; source: string }> = {};
      if (userId) {
        const { data } = await supabase
          .from("booking_starts")
          .select("booking_key, first_checkin, last_checkout")
          .eq("user_id", userId);
        for (const row of data ?? []) {
          firstCheckins[row.booking_key] = row.first_checkin;
          /* A kulcsból kiolvassuk az apartman/forrás adatot: "Kalóz::20260614::szallas" */
          const parts = (row.booking_key as string).split("::");
          knownBookings[row.booking_key] = {
            firstCheckin: row.first_checkin,
            lastCheckout: row.last_checkout ?? "",
            apartment:    parts[0] ?? "",
            accent:       "coral",
            source:       parts[2] ?? "szallas",
          };
        }
      }

      /* Az apartman accent-jét a feedConfigs-ból pótoljuk (pontosabb, mint a default) */
      for (const key in knownBookings) {
        const apt = apartments.find((a) => a.name === knownBookings[key].apartment);
        if (apt) knownBookings[key].accent = apt.accent;
      }

      /* 2. Feed-ek letöltése a már ismert adatokkal */
      const [{ bookings: b, errors: e }, future] = await Promise.all([
        fetchAllBookings(feedConfigs, firstCheckins, knownBookings),
        fetchFutureBookings(feedConfigs),
      ]);

      /* 3. Foglalások mentése/frissítése (kezdő + vég dátum) */
      if (userId) {
        const toSave = b.filter((bk) => (bk as any)._stableKey && bk._checkinRaw && bk._checkoutRaw);
        if (toSave.length > 0) {
          await supabase.from("booking_starts").upsert(
            toSave.map((bk) => ({
              user_id:       userId,
              booking_key:   (bk as any)._stableKey,
              first_checkin: firstCheckins[(bk as any)._stableKey] ?? bk._checkinRaw!,
              last_checkout: bk._checkoutRaw!,
            })),
            { onConflict: "user_id,booking_key" },
          );
        }
      }

      setBookings(b);
      setFutureBookings(future);
      setErrors(e);
      setStatus(e.length > 0 && b.length === 0 ? "error" : "success");
    } catch (err) {
      setErrors([String(err)]);
      setStatus("error");
    }
    setLastFetched(new Date());
  }, [apartments, feeds, userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return { status, bookings, futureBookings, errors, lastFetched, refetch: load };
}
