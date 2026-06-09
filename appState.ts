/**
 * appState.ts — single source of truth for all runtime state.
 */

import { useEffect, useState } from "react";
import type { Booking } from "./mockData";
import type { BookingDetailState } from "../components/BookingDetailDrawer";
import { makeEmptyDetailState } from "../components/BookingDetailDrawer";

/* ── Payment data model ──────────────────────────────────────────── */
export type PaymentMethod =
  | "cash"
  | "transfer"
  | "szep"
  | "booking"
  | "airbnb";

export type PaymentStatus = "pending" | "paid";

export interface PaymentData {
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
}

export function makeEmptyPayment(): PaymentData {
  return { amount: "", method: "transfer", status: "pending" };
}

/* ── Custom tasks ────────────────────────────────────────────────── */
export type CustomTaskRecurrence =
  | "once"
  | "daily"
  | "weekly_mon" | "weekly_tue" | "weekly_wed"
  | "weekly_thu" | "weekly_fri" | "weekly_sat" | "weekly_sun"
  | `date:${string}`;

export interface CustomTask {
  id:         string;
  label:      string;
  recurrence: CustomTaskRecurrence;
  done:       boolean;
  doneDate:   string | null; /* ISO date string, e.g. "2026-06-06" */
}

export const RECURRENCE_LABELS: Partial<Record<CustomTaskRecurrence, string>> & Record<string, string> = {
  once:        "Egyszer",
  daily:       "Minden nap",
  weekly_mon:  "Minden hétfőn",
  weekly_tue:  "Minden kedden",
  weekly_wed:  "Minden szerdán",
  weekly_thu:  "Minden csütörtökön",
  weekly_fri:  "Minden pénteken",
  weekly_sat:  "Minden szombaton",
  weekly_sun:  "Minden vasárnap",
};
export function isCustomTaskActiveToday(task: CustomTask): boolean {
  const today = new Date();
  const dow = today.getDay(); // 0=V, 1=H, 2=K, 3=Sze, 4=Cs, 5=P, 6=Szo

  if (task.recurrence === "once") return true;
  if (task.recurrence === "daily") return true;
  if (task.recurrence === "weekly_mon") return dow === 1;
  if (task.recurrence === "weekly_tue") return dow === 2;
  if (task.recurrence === "weekly_wed") return dow === 3;
  if (task.recurrence === "weekly_thu") return dow === 4;
  if (task.recurrence === "weekly_fri") return dow === 5;
  if (task.recurrence === "weekly_sat") return dow === 6;
  if (task.recurrence === "weekly_sun") return dow === 0;

  if (task.recurrence.startsWith("date:")) {
    const dateStr = task.recurrence.slice(5); // "2026.06.08"
    const todayStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    return dateStr === todayStr;
  }

  return false;
}
/* ── App state shape ─────────────────────────────────────────────── */
export interface AppState {
  detailStates: Record<string, BookingDetailState>;
  paymentData:  Record<string, PaymentData>;
  customTasks:  CustomTask[];
  userName:     string;
}

export interface AppStateActions {
  getDetail:           (id: string) => BookingDetailState;
  setDetail:           (id: string, next: BookingDetailState) => void;
  getPayment:          (id: string) => PaymentData;
  setPayment:          (id: string, next: PaymentData) => void;
  togglePaymentStatus: (id: string) => void;
  isPaymentPaid:       (id: string) => boolean;
  prevCleaningFor:     (arrivingId: string, liveBookings: Booking[]) => boolean | undefined;
  setUserName:         (name: string) => void;
  addCustomTask:       (label: string, recurrence: CustomTaskRecurrence) => void;
  toggleCustomTask:    (id: string) => void;
  deleteCustomTask:    (id: string) => void;
}

/* ── Hook ────────────────────────────────────────────────────────── */
export function useAppState(): AppState & AppStateActions {
const [detailStates, setDetailStates] =
    useState<Record<string, BookingDetailState>>(() => {
      try { return JSON.parse(localStorage.getItem("detailStates") || "{}"); }
      catch { return {}; }
    });
  const [paymentData, setPaymentData] =
    useState<Record<string, PaymentData>>(() => {
      try { return JSON.parse(localStorage.getItem("paymentData") || "{}"); }
      catch { return {}; }
    });  
  const [userName, setUserName] =
    useState(() => localStorage.getItem("userName") || "István");
  const [customTasks, setCustomTasks] =
    useState<CustomTask[]>(() => {
      try {
        return JSON.parse(localStorage.getItem("customTasks") || "[]");
      } catch { return []; }
    });

  useEffect(() => {
    localStorage.setItem("userName", userName);
  }, [userName]);
  useEffect(() => {
    localStorage.setItem("detailStates", JSON.stringify(detailStates));
  }, [detailStates]);

  useEffect(() => {
    localStorage.setItem("paymentData", JSON.stringify(paymentData));
  }, [paymentData]);
  useEffect(() => {
    localStorage.setItem("customTasks", JSON.stringify(customTasks));
  }, [customTasks]);

  function getDetail(id: string): BookingDetailState {
    return detailStates[id] ?? makeEmptyDetailState();
  }
  function setDetail(id: string, next: BookingDetailState) {
    setDetailStates((p) => ({ ...p, [id]: next }));
  }

  function getPayment(id: string): PaymentData {
    return paymentData[id] ?? makeEmptyPayment();
  }
  function setPayment(id: string, next: PaymentData) {
    setPaymentData((p) => ({ ...p, [id]: next }));
  }
  function togglePaymentStatus(id: string) {
    const current = getPayment(id);
    setPayment(id, {
      ...current,
      status: current.status === "paid" ? "pending" : "paid",
    });
  }
  function isPaymentPaid(id: string): boolean {
    return getPayment(id).status === "paid";
  }

  function prevCleaningFor(arrivingId: string, liveBookings: Booking[]): boolean | undefined {
    const arriving = liveBookings.find((b) => b.id === arrivingId);
    if (!arriving) return undefined;
    const linked = liveBookings.find(
      (b) => b.status === "departing" && b.apartment === arriving.apartment,
    );
    if (!linked) return undefined;
    return !!(detailStates[linked.id]?.cleaningDone);
  }

  function addCustomTask(label: string, recurrence: CustomTaskRecurrence) {
    const task: CustomTask = {
      id:         `custom-${Date.now()}`,
      label,
      recurrence,
      done:       false,
      doneDate:   null,
    };
    setCustomTasks((p) => [...p, task]);
  }

  function toggleCustomTask(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    setCustomTasks((p) =>
      p.map((t) => {
        if (t.id !== id) return t;
        const nowDone = !t.done;
        return { ...t, done: nowDone, doneDate: nowDone ? today : null };
      }),
    );
  }

  function deleteCustomTask(id: string) {
    setCustomTasks((p) => p.filter((t) => t.id !== id));
  }

  return {
    detailStates, paymentData, customTasks, userName,
    getDetail, setDetail,
    getPayment, setPayment,
    togglePaymentStatus, isPaymentPaid,
    prevCleaningFor, setUserName,
    addCustomTask, toggleCustomTask, deleteCustomTask,
  };
}

/* ── Derived tasks ───────────────────────────────────────────────── */
export type DerivedTaskType = "cleaning" | "payment" | "key" | "checkin" | "ntak";

export interface DerivedTask {
  id:        string;
  bookingId: string;
  apartment: string;
  type:      DerivedTaskType;
  label:     string;
  sublabel:  string;
  done:      boolean;
  urgent:    boolean;
}

export function deriveTasks(
  liveBookings: Booking[],
  detailStates: Record<string, BookingDetailState>,
  paymentData:  Record<string, PaymentData>,
): DerivedTask[] {
  const tasks: DerivedTask[] = [];

  for (const b of liveBookings) {
    const detail = detailStates[b.id] ?? makeEmptyDetailState();
    const pd     = paymentData[b.id]  ?? makeEmptyPayment();

    if (b.status === "arriving") {
      /* Kulcs előkészítve */
      tasks.push({
        id: `key-${b.id}`, bookingId: b.id, apartment: b.apartment,
        type: "key", label: `Kulcs előkészítése — ${b.apartment}`,
        sublabel: b.arrival, done: !!detail.keyReady, urgent: true,
      });
      /* Check-in infó elküldve */
      tasks.push({
        id: `checkin-${b.id}`, bookingId: b.id, apartment: b.apartment,
        type: "checkin", label: `Check-in infó küldése — ${b.apartment}`,
        sublabel: b.arrival, done: !!detail.checkinSent, urgent: false,
      });
      /* NTAK/VIZA */
      tasks.push({
        id: `ntak-${b.id}`, bookingId: b.id, apartment: b.apartment,
        type: "ntak", label: `NTAK/VIZA ellenőrzés — ${b.apartment}`,
        sublabel: b.arrival, done: !!detail.ntakDone, urgent: false,
      });
      /* Fizetés — ha még pending */
      if (pd.status === "pending") {
        tasks.push({
          id: `payment-${b.id}`, bookingId: b.id, apartment: b.apartment,
          type: "payment", label: `Fizetés ellenőrzése — ${b.apartment}`,
          sublabel: pd.amount ? `${pd.amount} · ${methodLabel(pd.method)}` : methodLabel(pd.method),
          done: false, urgent: true,
        });
      }
    }

    if (b.status === "staying") {
      /* Csak fizetés ha pending és van összeg */
      if (pd.status === "pending" && pd.amount.trim()) {
        tasks.push({
          id: `payment-${b.id}`, bookingId: b.id, apartment: b.apartment,
          type: "payment", label: `Fizetés ellenőrzése — ${b.apartment}`,
          sublabel: `${pd.amount} · ${methodLabel(pd.method)}`,
          done: false, urgent: false,
        });
      }
    }

    if (b.status === "departing") {
      /* Takarítás */
      tasks.push({
        id: `cleaning-${b.id}`, bookingId: b.id, apartment: b.apartment,
        type: "cleaning", label: `Takarítás — ${b.apartment}`,
        sublabel: "Ma távozik · Sürgős", done: !!detail.cleaningDone, urgent: true,
      });
      /* Fizetés ha még pending */
      if (pd.status === "pending") {
        tasks.push({
          id: `payment-${b.id}`, bookingId: b.id, apartment: b.apartment,
          type: "payment", label: `Fizetés ellenőrzése — ${b.apartment}`,
          sublabel: pd.amount ? `${pd.amount} · ${methodLabel(pd.method)}` : methodLabel(pd.method),
          done: false, urgent: true,
        });
      }
    }
  }

  return tasks;
}

export function methodLabel(m: PaymentMethod): string {
  return {
    cash:     "Készpénz",
    transfer: "Utalás",
    szep:     "SZÉP kártya",
    booking:  "Booking.com",
    airbnb:   "Airbnb",
  }[m];
}

/* ── Derived invoices ────────────────────────────────────────────── */
export interface DerivedInvoice {
  bookingId:     string;
  apartment:     string;
  amount:        string;
  method:        PaymentMethod;
  status:        PaymentStatus;
  displayStatus: "paid" | "pending" | "overdue";
  arrival:       string;
  departure:     string;
}

export function deriveInvoices(
  liveBookings: Booking[],
  paymentData: Record<string, PaymentData>,
): DerivedInvoice[] {
  return liveBookings
    .filter((b) => {
      const pd = paymentData[b.id] ?? makeEmptyPayment();
      return pd.amount.trim() || pd.status === "paid";
    })
    .map((b) => {
      const pd = paymentData[b.id] ?? makeEmptyPayment();
      const overdue = pd.status === "pending" && b.status === "departing";
      return {
        bookingId:     b.id,
        apartment:     b.apartment,
        amount:        pd.amount || "—",
        method:        pd.method,
        status:        pd.status,
        displayStatus: pd.status === "paid" ? "paid" : overdue ? "overdue" : "pending",
        arrival:       b.arrival,
        departure:     b.departure,
      };
    });
}