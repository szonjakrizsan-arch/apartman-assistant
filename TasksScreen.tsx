import { Sparkles, Check, AlertCircle, Banknote, Key, Send, ClipboardCheck, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { AppState, AppStateActions, DerivedTask, CustomTask } from "../data/appState";
import { deriveTasks, RECURRENCE_LABELS, isCustomTaskActiveToday } from "../data/appState";
import type { CustomTaskRecurrence } from "../data/appState";
import type { IcalState } from "../data/useIcalBookings";

interface TasksScreenProps {
  appState: AppState & AppStateActions;
  ical: IcalState;
}

const TASK_CONFIG = {
  cleaning: { color: "#56b0bb", urgentColor: "#dc8460", bg: "rgb(86 176 187 / 0.12)", Icon: Sparkles,      label: "Takarítás" },
  payment:  { color: "#ddb055", urgentColor: "#e08060", bg: "rgb(217 171 78 / 0.12)", Icon: Banknote,      label: "Fizetés ellenőrzése" },
  key:      { color: "#56b0bb", urgentColor: "#56b0bb", bg: "rgb(86 176 187 / 0.12)", Icon: Key,           label: "Kulcs előkészítése" },
  checkin:  { color: "#56b0bb", urgentColor: "#56b0bb", bg: "rgb(86 176 187 / 0.12)", Icon: Send,          label: "Check-in infó" },
  ntak:     { color: "#56b0bb", urgentColor: "#56b0bb", bg: "rgb(86 176 187 / 0.12)", Icon: ClipboardCheck, label: "NTAK/VIZA" },
} as const;

/* ── Arriving: apartment block with header ───────────────────────── */
function ApartmentBlock({ apartment, tasks, onToggle }: {
  apartment: string;
  tasks: DerivedTask[];
  onToggle: (task: DerivedTask) => void;
}) {
  const doneCount = tasks.filter((t) => t.done).length;
  const allDone   = doneCount === tasks.length;

  return (
    <div className="overflow-hidden rounded-xl" style={{
      outline: "1px solid rgb(255 255 255 / 0.13)",
      outlineOffset: "-1px",
      opacity: allDone ? 0.6 : 1,
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{
        background: "rgb(255 255 255 / 0.07)",
        borderBottom: "1px solid rgb(255 255 255 / 0.10)",
      }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold"
            style={{ background: "rgb(86 176 187 / 0.25)", color: "#7dd4dd" }}>
            {apartment.slice(0, 2).toUpperCase()}
          </span>
          <span className="text-[14px] font-bold tracking-wide" style={{ color: "#F4F0E8" }}>
            {apartment.toUpperCase()}
          </span>
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: allDone ? "#5abf8a" : "rgb(255 255 255 / 0.35)" }}>
          {doneCount}/{tasks.length}
        </span>
      </div>
      {/* Tasks */}
      <div style={{ background: "rgb(0 0 0 / 0.18)" }}>
        {tasks.map((t, i) => {
          const cfg   = TASK_CONFIG[t.type];
          const color = t.urgent ? cfg.urgentColor : cfg.color;
          const Icon  = cfg.Icon;
          return (
            <button key={t.id} type="button" onClick={() => onToggle(t)}
              className="pressable flex w-full items-center gap-3 px-4 py-3 text-left"
              style={i < tasks.length - 1 ? { borderBottom: "1px solid rgb(255 255 255 / 0.05)" } : {}}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: t.done ? "rgb(90 191 138 / 0.14)" : cfg.bg, color: t.done ? "#5abf8a" : color }}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="flex-1 text-[13px] font-medium" style={{
                color: t.done ? "#5abf8a" : "#F4F0E8",
                textDecoration: t.done ? "line-through" : "none",
                opacity: t.done ? 0.7 : 1,
              }}>
                {cfg.label}
              </span>
              {t.urgent && !t.done && (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color }} />
              )}
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-soft ${
                t.done ? "border-[#5abf8a] bg-[#5abf8a]" : "border-border-subtle bg-surface-raised"
              }`}>
                {t.done && <Check className="h-2.5 w-2.5 text-surface" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Flat list row (payment, cleaning) ───────────────────────────── */
function FlatTaskRow({ task, onToggle }: { task: DerivedTask; onToggle: () => void }) {
  const cfg   = TASK_CONFIG[task.type];
  const color = task.urgent ? cfg.urgentColor : cfg.color;
  const Icon  = cfg.Icon;

  return (
    <button type="button" onClick={onToggle}
      className="pressable flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left card-elevated"
      style={task.urgent && !task.done ? { borderColor: `${color}40`, background: `linear-gradient(135deg, ${color}0a, #2a3230)` } : {}}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: task.done ? "rgb(90 191 138 / 0.14)" : cfg.bg, color: task.done ? "#5abf8a" : color }}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[13px] font-medium" style={{
          color: task.done ? "#5abf8a" : "#F4F0E8",
          textDecoration: task.done ? "line-through" : "none",
          opacity: task.done ? 0.7 : 1,
        }}>
          {task.apartment}
        </span>
        <span className="ml-2 text-[11px]" style={{ color: task.done ? "#5abf8a" : "rgb(255 255 255 / 0.40)" }}>
          — {cfg.label}
        </span>
      </span>
      {task.urgent && !task.done && (
        <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      )}
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-soft ${
        task.done ? "border-[#5abf8a] bg-[#5abf8a]" : "border-border-subtle bg-surface-raised"
      }`}>
        {task.done && <Check className="h-2.5 w-2.5 text-surface" strokeWidth={3} />}
      </span>
    </button>
  );
}

/* ── Collapsible section wrapper ─────────────────────────────────── */
function SectionHeader({ title, color, count, doneCount, totalCount, onToggle, collapsed }: {
  title: string; color: string; count: number;
  doneCount: number; totalCount: number;
  onToggle: () => void; collapsed: boolean;
}) {
  return (
    <button type="button" onClick={onToggle} className="pressable mb-2 flex w-full items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
        {title} · {count}
      </p>
      <span className="flex items-center gap-1.5 text-[10px] tabular-nums" style={{ color: "rgb(255 255 255 / 0.35)" }}>
        {doneCount}/{totalCount}
        {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

/* ── Custom task row ─────────────────────────────────────────────── */
function recurrenceLabel(r: CustomTaskRecurrence): string {
  if (r.startsWith("date:")) return r.slice(5);
  return RECURRENCE_LABELS[r] ?? r;
}

function CustomTaskRow({ task, onToggle, onDelete }: { task: CustomTask; onToggle: () => void; onDelete: () => void }) {
  return (
    <li>
      <div className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 card-elevated ${task.done ? "opacity-50" : ""}`}>
        <button type="button" onClick={onToggle} className="pressable flex flex-1 items-center gap-3 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: task.done ? "rgb(90 191 138 / 0.14)" : "rgb(86 176 187 / 0.12)", color: task.done ? "#5abf8a" : "#56b0bb" }}>
            <Check className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-[13px] font-medium" style={{
              color: task.done ? "#5abf8a" : "#F4F0E8",
              textDecoration: task.done ? "line-through" : "none",
              opacity: task.done ? 0.7 : 1,
            }}>
              {task.label}
            </span>
            <span className="mt-0.5 block text-[11px] text-text-secondary">
              {recurrenceLabel(task.recurrence)}
            </span>
          </span>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-soft ${
            task.done ? "border-[#5abf8a] bg-[#5abf8a]" : "border-border-subtle bg-surface-raised"
          }`}>
            {task.done && <Check className="h-2.5 w-2.5 text-surface" strokeWidth={3} />}
          </span>
        </button>
        <button type="button" onClick={onDelete}
          className="pressable ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ color: "rgb(220 132 96 / 0.6)" }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

/* ── Add custom task form ────────────────────────────────────────── */
function AddCustomTaskForm({ onAdd }: { onAdd: (label: string, recurrence: CustomTaskRecurrence) => void }) {
  const [label, setLabel]           = useState("");
  const [mode, setMode]             = useState<"preset" | "date">("preset");
  const [recurrence, setRecurrence] = useState<CustomTaskRecurrence>("once");
  const [dateInput, setDateInput]   = useState("");
  const [open, setOpen]             = useState(false);
  const [dateError, setDateError]   = useState("");

  function handleAdd() {
    if (!label.trim()) return;
    if (mode === "date") {
      const clean = dateInput.trim().replace(/\.$/, "");
      if (!/^\d{4}\.\d{2}\.\d{2}$/.test(clean)) {
        setDateError("Helyes formátum: 2026.06.08.");
        return;
      }
      onAdd(label.trim(), `date:${clean}` as CustomTaskRecurrence);
    } else {
      onAdd(label.trim(), recurrence);
    }
    setLabel(""); setRecurrence("once"); setDateInput(""); setDateError(""); setOpen(false);
  }

  if (!open) return (
    <button type="button" onClick={() => setOpen(true)}
      className="pressable flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-3 text-left"
      style={{ borderColor: "rgb(86 176 187 / 0.25)", color: "#56b0bb" }}>
      <Plus className="h-4 w-4" />
      <span className="text-[13px] font-medium">Egyéni feladat hozzáadása</span>
    </button>
  );

  return (
    <div className="card-elevated flex flex-col gap-3 rounded-xl border p-4"
      style={{ borderColor: "rgb(86 176 187 / 0.25)" }}>
      <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
        placeholder="Feladat neve (pl. Szemétszállítás)"
        className="w-full rounded-lg border bg-transparent px-3 py-2 text-[13px] text-text-primary outline-none"
        style={{ borderColor: "rgb(86 176 187 / 0.25)" }} autoFocus />
      <div className="flex gap-2">
        {(["preset", "date"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className="pressable flex-1 rounded-lg py-1.5 text-[12px] font-semibold"
            style={{
              background: mode === m ? "rgb(86 176 187 / 0.20)" : "transparent",
              color: mode === m ? "#56b0bb" : "#6b7280",
              outline: `1px solid ${mode === m ? "rgb(86 176 187 / 0.30)" : "rgb(86 176 187 / 0.10)"}`,
            }}>
            {m === "preset" ? "Ismétlődés" : "Dátum"}
          </button>
        ))}
      </div>
      {mode === "preset" ? (
        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as CustomTaskRecurrence)}
          className="w-full rounded-lg border bg-surface-raised px-3 py-2 text-[13px] text-text-primary outline-none"
          style={{ borderColor: "rgb(86 176 187 / 0.25)" }}>
          {(Object.entries(RECURRENCE_LABELS) as [CustomTaskRecurrence, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      ) : (
        <div className="flex flex-col gap-1">
          <input type="text" value={dateInput}
            onChange={(e) => { setDateInput(e.target.value); setDateError(""); }}
            placeholder="2026.06.08."
            className="w-full rounded-lg border bg-transparent px-3 py-2 text-[13px] text-text-primary outline-none"
            style={{ borderColor: dateError ? "rgb(220 132 96 / 0.6)" : "rgb(86 176 187 / 0.25)" }} />
          {dateError && <span className="text-[11px]" style={{ color: "#e08060" }}>{dateError}</span>}
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={handleAdd}
          className="pressable flex-1 rounded-lg py-2 text-[13px] font-semibold"
          style={{ background: "rgb(86 176 187 / 0.18)", color: "#56b0bb" }}>
          Hozzáadás
        </button>
        <button type="button" onClick={() => { setOpen(false); setDateError(""); }}
          className="pressable flex-1 rounded-lg py-2 text-[13px] font-semibold text-text-muted">
          Mégse
        </button>
      </div>
    </div>
  );
}

/* ── Group by apartment ──────────────────────────────────────────── */
function groupByApartment(tasks: DerivedTask[]): { apartment: string; tasks: DerivedTask[] }[] {
  const map = new Map<string, DerivedTask[]>();
  for (const t of tasks) {
    if (!map.has(t.apartment)) map.set(t.apartment, []);
    map.get(t.apartment)!.push(t);
  }
  return Array.from(map.entries()).map(([apartment, tasks]) => ({ apartment, tasks }));
}

/* ── Main screen ─────────────────────────────────────────────────── */
export function TasksScreen({ appState, ical }: TasksScreenProps) {
  const { detailStates, paymentData, customTasks, getDetail, setDetail, getPayment, setPayment, addCustomTask, toggleCustomTask, deleteCustomTask } = appState;
  const tasks = deriveTasks(ical.bookings, detailStates, paymentData);

  const arrivingTasks     = tasks.filter((t) => t.type === "key" || t.type === "checkin" || t.type === "ntak");
  const paymentTasks      = tasks.filter((t) => t.type === "payment");
  const cleaningTasks     = tasks.filter((t) => t.type === "cleaning");
  const activeTodayCustom = customTasks.filter((t) => isCustomTaskActiveToday(t));

  const arrivingGroups = groupByApartment(arrivingTasks);

  const doneCount   = tasks.filter((t) => t.done).length + activeTodayCustom.filter((t) => t.done).length;
  const totalCount  = tasks.length + activeTodayCustom.length;
  const urgentCount = tasks.filter((t) => t.urgent && !t.done).length;
  const progress    = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const [arrCollapsed,     setArrCollapsed]     = useState(false);
  const [payCollapsed,     setPayCollapsed]      = useState(false);
  const [cleanCollapsed,   setCleanCollapsed]    = useState(false);
  const [customCollapsed,  setCustomCollapsed]   = useState(false);

  function toggleTask(task: DerivedTask) {
    if (task.type === "cleaning") {
      const c = getDetail(task.bookingId); setDetail(task.bookingId, { ...c, cleaningDone: !c.cleaningDone });
    } else if (task.type === "key") {
      const c = getDetail(task.bookingId); setDetail(task.bookingId, { ...c, keyReady: !c.keyReady });
    } else if (task.type === "checkin") {
      const c = getDetail(task.bookingId); setDetail(task.bookingId, { ...c, checkinSent: !c.checkinSent });
    } else if (task.type === "ntak") {
      const c = getDetail(task.bookingId); setDetail(task.bookingId, { ...c, ntakDone: !c.ntakDone });
    } else {
      const c = getPayment(task.bookingId); setPayment(task.bookingId, { ...c, status: "paid" });
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-2">

      {/* Summary header */}
      <div className="rounded-2xl border px-4 py-3.5"
        style={{ background: "linear-gradient(148deg, #1e2e2a 0%, #1a2c2e 100%)", borderColor: "rgb(86 176 187 / 0.18)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">Mai feladatok</p>
            <p className="mt-0.5 text-[15px] font-semibold" style={{ color: "#F4F0E8" }}>
              {doneCount} / {totalCount} elvégezve
              {urgentCount > 0 && <span className="ml-2 text-[12px] font-medium text-[#dc8460]">· {urgentCount} sürgős</span>}
            </p>
          </div>
          {totalCount > 0 && (
            <span className="rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums" style={{
              background: doneCount === totalCount ? "rgb(90 191 138 / 0.16)" : "rgb(86 176 187 / 0.12)",
              color: doneCount === totalCount ? "#5abf8a" : "#56b0bb",
              outline: `1px solid ${doneCount === totalCount ? "rgb(90 191 138 / 0.30)" : "rgb(86 176 187 / 0.22)"}`,
            }}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
        {totalCount > 0 && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ background: "rgb(86 176 187 / 0.10)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${progress}%`,
              background: doneCount === totalCount ? "linear-gradient(90deg, #5abf8a, #4dd9a0)" : "linear-gradient(90deg, #56b0bb, #6abccc)",
            }} />
          </div>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center"
          style={{ borderColor: "rgb(86 176 187 / 0.18)" }}>
          <Sparkles className="h-8 w-8 text-text-muted" />
          <p className="text-[13px] text-text-secondary">Nincs aktív feladat.</p>
          <p className="text-[11px] text-text-muted">Feladatok automatikusan jelennek meg a foglalásokból.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* ÉRKEZŐK — apartment blocks */}
          {arrivingGroups.length > 0 && (
            <section>
              <SectionHeader title="Érkezők" color="#56b0bb"
                count={arrivingGroups.length}
                doneCount={arrivingTasks.filter((t) => t.done).length}
                totalCount={arrivingTasks.length}
                collapsed={arrCollapsed} onToggle={() => setArrCollapsed((v) => !v)} />
              {!arrCollapsed && (
                <div className="flex flex-col gap-3">
                  {arrivingGroups.map((g) => (
                    <ApartmentBlock key={g.apartment} apartment={g.apartment} tasks={g.tasks} onToggle={toggleTask} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* FIZETÉSEK — flat list */}
          {paymentTasks.length > 0 && (
            <section>
              <SectionHeader title="Fizetések" color="#ddb055"
                count={paymentTasks.length}
                doneCount={paymentTasks.filter((t) => t.done).length}
                totalCount={paymentTasks.length}
                collapsed={payCollapsed} onToggle={() => setPayCollapsed((v) => !v)} />
              {!payCollapsed && (
                <div className="flex flex-col gap-2">
                  {paymentTasks.map((t) => <FlatTaskRow key={t.id} task={t} onToggle={() => toggleTask(t)} />)}
                </div>
              )}
            </section>
          )}

          {/* TAKARÍTÁS — flat list */}
          {cleaningTasks.length > 0 && (
            <section>
              <SectionHeader title="Távozók · Takarítás" color="#dc8460"
                count={cleaningTasks.length}
                doneCount={cleaningTasks.filter((t) => t.done).length}
                totalCount={cleaningTasks.length}
                collapsed={cleanCollapsed} onToggle={() => setCleanCollapsed((v) => !v)} />
              {!cleanCollapsed && (
                <div className="flex flex-col gap-2">
                  {cleaningTasks.map((t) => <FlatTaskRow key={t.id} task={t} onToggle={() => toggleTask(t)} />)}
                </div>
              )}
            </section>
          )}

          {/* EGYÉNI — flat list */}
          {activeTodayCustom.length > 0 && (
            <section>
              <SectionHeader title="Egyéni feladatok" color="#9b8ecf"
                count={activeTodayCustom.length}
                doneCount={activeTodayCustom.filter((t) => t.done).length}
                totalCount={activeTodayCustom.length}
                collapsed={customCollapsed} onToggle={() => setCustomCollapsed((v) => !v)} />
              {!customCollapsed && (
                <ul className="flex flex-col gap-2">
                  {activeTodayCustom.map((t) => (
                    <CustomTaskRow key={t.id} task={t} onToggle={() => toggleCustomTask(t.id)} onDelete={() => deleteCustomTask(t.id)} />
                  ))}
                </ul>
              )}
            </section>
          )}

        </div>
      )}

      <AddCustomTaskForm onAdd={addCustomTask} />
    </div>
  );
}