export type TabId = "home" | "bookings" | "tasks" | "invoices" | "contacts" | "apartments";
export interface TabItem {
  id: TabId;
  label: string;
  badge?: number;
}