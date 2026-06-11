import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import type { Booking } from "./mockData";
import type { BookingDetailState } from "../components/BookingDetailDrawer";
import { makeEmptyDetailState } from "../components/BookingDetailDrawer";

export type PaymentMethod = "cash" | "transfer" | "szep" | "booking" | "airbnb";
export type PaymentStatus = "pending" | "paid";

export interface PaymentData {
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
}

export function makeEmptyPayment(): PaymentData {
  return { amount: "", method: "transfer", status: "pending" };
}

export type CustomTaskRecurrence =
  | "once" | "daily"
  | "weekly_mon" | "weekly_tue" | "weekly_wed"
  | "weekly_thu" | "weekly_fri" | "weekly_sat" | "weekly_sun"
  | `date:${string}`;

export interface CustomTask {
  id:         string;
  label:      string;
  recurrence: CustomTaskRecurrence;
  done:       boolean;
  doneDate:   string | null;
}

export const RECURRENCE_LABELS: Record<string, string> = {
  once: "Egyszer", daily: "Minden nap",
  weekly_mon: "Minden hétfőn", weekly_tue: "Minden kedden",
  weekly_wed: "Minden szerdán", weekly_thu: "Minden csütörtökön",
  weekly_fri: "Minden pénteken", weekly_sat: "Minden szombaton",
  weekly_sun: "Minden vasárnap",
};

export function isCustomTaskActiveToday(task: CustomTask): boolean {
  const today = new Date();
  const dow = today.getDay();
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
    const dateStr = task.recurrence.slice(5);
    const todayStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
    return dateStr === todayStr;
  }
  return false;
}

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

export function useAppState(userId?: string): AppState & AppStateActions {
  const [detailStates, setDetailStates] = useState<Record<string, BookingDetailState>>({});
  const [paymentData,  setPaymentData]  = useState<Record<string, PaymentData>>({});
  const [customTasks,  setCustomTasks]  = useState<CustomTask[]>([]);
  const [userName, setUserNameState]    = useState("");

  /* ── Load from Supabase ── */
  const loadAll = useCallback(async () => {
    setPaymentData({});
    setDetailStates({});
    setCustomTasks([]);
    setUserNameState("");
    if (!userId) return;

    const [{ data: payments }, { data: details }, { data: tasks }] = await Promise.all([
      supabase.from("payment_data").select("*").eq("user_id", userId),
      supabase.from("detail_states").select("*").eq("user_id", userId),
      supabase.from("custom_tasks").select("*").eq("user_id", userId),
    ]);

    if (payments) {
      const map: Record<string, PaymentData> = {};
      for (const p of payments) {
        map[p.booking_id] = { amount: p.amount ?? "", method: p.method ?? "transfer", status: p.status ?? "pending" };
      }
      setPaymentData(map);
    }

    if (details) {
      const map: Record<string, BookingDetailState> = {};
      for (const d of details) {
        map[d.booking_id] = {
          cleaningDone: d.cleaning_done ?? false,
          keyReady:     d.key_ready ?? false,
          checkinSent:  d.checkin_sent ?? false,
          ntakDone:     d.ntak_done ?? false,
          note:         d.note ?? "",
          contactName:  d.contact_name ?? "",
          contactPhone: d.contact_phone ?? "",
          contactEmail: d.contact_email ?? "",
          contactNote:  d.contact_note ?? "",
        };
      }
      setDetailStates(map);
    }

    if (tasks) {
      setCustomTasks(tasks.map((t) => ({
        id:         t.id,
        label:      t.label,
        recurrence: t.recurrence as CustomTaskRecurrence,
        done:       t.done ?? false,
        doneDate:   t.done_date ?? null,
      })));
    }
  }, [userId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("display_name").eq("id", userId).single()
      .then(({ data }) => {
        if (data?.display_name) setUserNameState(data.display_name);
      });
  }, [userId]);

  /* ── Detail state ── */
  function getDetail(id: string): BookingDetailState {
    return detailStates[id] ?? makeEmptyDetailState();
  }

  async function setDetail(id: string, next: BookingDetailState) {
    setDetailStates((p) => ({ ...p, [id]: next }));
    if (!userId) return;
    await supabase.from("detail_states").upsert({
      user_id:       userId,
      booking_id:    id,
      cleaning_done: next.cleaningDone,
      key_ready:     next.keyReady,
      checkin_sent:  next.checkinSent,
      ntak_done:     next.ntakDone,
      note:          next.note,
      contact_name:  next.contactName,
      contact_phone: next.contactPhone,
      contact_email: next.contactEmail,
      contact_note:  next.contactNote,
    }, { onConflict: "user_id,booking_id" });
  }

  /* ── Payment data ── */
  function getPayment(id: string): PaymentData {
    return paymentData[id] ?? makeEmptyPayment();
  }

  async function setPayment(id: string, next: PaymentData) {
    setPaymentData((p) => ({ ...p, [id]: next }));
    if (!userId) return;
    await supabase.from("payment_data").upsert({
      user_id:    userId,
      booking_id: id,
      amount:     next.amount,
      method:     next.method,
      status:     next.status,
    }, { onConflict: "user_id,booking_id" });
  }

  function togglePaymentStatus(id: string) {
    const current = getPayment(id);
    setPayment(id, { ...current, status: current.status === "paid" ? "pending" : "paid" });
  }

  function isPaymentPaid(id: string): boolean {
    return getPayment(id).status === "paid";
  }

  function prevCleaningFor(arrivingId: string, liveBookings: Booking[]): boolean | undefined {
    const arriving = liveBookings.find((b) => b.id === arrivingId);
    if (!arriving) return undefined;
    const linked = liveBookings.find((b) => b.status === "departing" && b.apartment === arriving.apartment);
    if (!linked) return undefined;
    return !!(detailStates[linked.id]?.cleaningDone);
  }

  /* ── Custom tasks ── */
  async function addCustomTask(label: string, recurrence: CustomTaskRecurrence) {
    if (!userId) return;
    const { data } = await supabase.from("custom_tasks").insert({
      user_id: userId, label, recurrence, done: false, done_date: null,
    }).select().single();
    if (data) {
      setCustomTasks((p) => [...p, {
        id: data.id, label: data.label, recurrence: data.recurrence,
        done: false, doneDate: null,
      }]);
    }
  }

  async function toggleCustomTask(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    setCustomTasks((p) => p.map((t) => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      return { ...t, done: nowDone, doneDate: nowDone ? today : null };
    }));
    const task = customTasks.find((t) => t.id === id);
    if (!task || !userId) return;
    const nowDone = !task.done;
    await supabase.from("custom_tasks").update({
      done: nowDone, done_date: nowDone ? today : null,
    }).eq("id", id);
  }

  async function deleteCustomTask(id: string) {
    setCustomTasks((p) => p.filter((t) => t.id !== id));
    await supabase.from("custom_tasks").delete().eq("id", id);
  }

  return {
    detailStates, paymentData, customTasks, userName,
    getDetail, setDetail, getPayment, setPayment,
    togglePaymentStatus, isPaymentPaid, prevCleaningFor,
    setUserName: (name: string) => {
      setUserNameState(name);
      if (userId) {
        supabase.from("profiles").upsert({ id: userId, display_name: name }).then(() => {});
      }
    },
    addCustomTask, toggleCustomTask, deleteCustomTask,
  };
}

/* ── Derived tasks ── */
export type DerivedTaskType = "cleaning" | "payment" | "key" | "checkin" | "ntak";

export interface DerivedTask {
  id: string; bookingId: string; apartment: string;
  type: DerivedTaskType; label: string; sublabel: string;
  done: boolean; urgent: boolean;
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
      tasks.push({ id: `key-${b.id}`, bookingId: b.id, apartment: b.apartment, type: "key", label: `Kulcs előkészítése — ${b.apartment}`, sublabel: b.arrival, done: !!detail.keyReady, urgent: true });
      tasks.push({ id: `checkin-${b.id}`, bookingId: b.id, apartment: b.apartment, type: "checkin", label: `Check-in infó küldése — ${b.apartment}`, sublabel: b.arrival, done: !!detail.checkinSent, urgent: false });
      tasks.push({ id: `ntak-${b.id}`, bookingId: b.id, apartment: b.apartment, type: "ntak", label: `NTAK/VIZA ellenőrzés — ${b.apartment}`, sublabel: b.arrival, done: !!detail.ntakDone, urgent: false });
      if (pd.status === "pending") tasks.push({ id: `payment-${b.id}`, bookingId: b.id, apartment: b.apartment, type: "payment", label: `Fizetés ellenőrzése — ${b.apartment}`, sublabel: pd.amount ? `${pd.amount} · ${methodLabel(pd.method)}` : methodLabel(pd.method), done: false, urgent: true });
    }
    if (b.status === "staying" && pd.status === "pending" && pd.amount.trim()) {
      tasks.push({ id: `payment-${b.id}`, bookingId: b.id, apartment: b.apartment, type: "payment", label: `Fizetés ellenőrzése — ${b.apartment}`, sublabel: `${pd.amount} · ${methodLabel(pd.method)}`, done: false, urgent: false });
    }
    if (b.status === "departing") {
      tasks.push({ id: `cleaning-${b.id}`, bookingId: b.id, apartment: b.apartment, type: "cleaning", label: `Takarítás — ${b.apartment}`, sublabel: "Ma távozik · Sürgős", done: !!detail.cleaningDone, urgent: true });
      if (pd.status === "pending") tasks.push({ id: `payment-${b.id}`, bookingId: b.id, apartment: b.apartment, type: "payment", label: `Fizetés ellenőrzése — ${b.apartment}`, sublabel: pd.amount ? `${pd.amount} · ${methodLabel(pd.method)}` : methodLabel(pd.method), done: false, urgent: true });
    }
  }
  return tasks;
}

export function methodLabel(m: PaymentMethod): string {
  return { cash: "Készpénz", transfer: "Utalás", szep: "SZÉP kártya", booking: "Booking.com", airbnb: "Airbnb" }[m];
}

export interface DerivedInvoice {
  bookingId: string; apartment: string; amount: string;
  method: PaymentMethod; status: PaymentStatus; displayStatus: "paid" | "pending" | "overdue";
  arrival: string; departure: string;
}

export function deriveInvoices(liveBookings: Booking[], paymentData: Record<string, PaymentData>): DerivedInvoice[] {
  return liveBookings
    .filter((b) => { const pd = paymentData[b.id] ?? makeEmptyPayment(); return pd.amount.trim() || pd.status === "paid"; })
    .map((b) => {
      const pd = paymentData[b.id] ?? makeEmptyPayment();
      const overdue = pd.status === "pending" && b.status === "departing";
      return { bookingId: b.id, apartment: b.apartment, amount: pd.amount || "—", method: pd.method, status: pd.status, displayStatus: pd.status === "paid" ? "paid" : overdue ? "overdue" : "pending", arrival: b.arrival, departure: b.departure };
    });
}
