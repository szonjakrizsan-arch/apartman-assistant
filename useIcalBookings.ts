/**
 * useIcalBookings.ts — React hook that fetches and refreshes iCal data.
 *
 * Provides a loading/error/data state. Falls back to empty arrays on
 * error so the rest of the app never crashes on a bad feed.
 */

import { useState, useEffect, useCallback } from "react";
import type { Booking, FutureBooking } from "./mockData";
import { FEEDS } from "./icalFeeds";
import { fetchAllBookings, fetchFutureBookings } from "./icalBookings";

export type IcalStatus = "idle" | "loading" | "success" | "error";

export interface IcalState {
  status:         IcalStatus;
  bookings:       Booking[];
  futureBookings: FutureBooking[];
  errors:         string[];
  lastFetched:    Date | null;
  refetch:        () => void;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; /* 5 minutes */

export function useIcalBookings(): IcalState {
  const [status,         setStatus]         = useState<IcalStatus>("idle");
  const [bookings,       setBookings]        = useState<Booking[]>([]);
  const [futureBookings, setFutureBookings]  = useState<FutureBooking[]>([]);
  const [errors,         setErrors]          = useState<string[]>([]);
  const [lastFetched,    setLastFetched]     = useState<Date | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [{ bookings: b, errors: e }, future] = await Promise.all([
        fetchAllBookings(FEEDS),
        fetchFutureBookings(FEEDS),
      ]);
      setBookings(b);
      setFutureBookings(future);
      setErrors(e);
      setStatus(e.length > 0 && b.length === 0 ? "error" : "success");
    } catch (err) {
      setErrors([String(err)]);
      setStatus("error");
    }
    setLastFetched(new Date());
  }, []);

  /* Initial load */
  useEffect(() => { load(); }, [load]);

  /* Refresh every 5 minutes */
  useEffect(() => {
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  return {
    status,
    bookings,
    futureBookings,
    errors,
    lastFetched,
    refetch: load,
  };
}
