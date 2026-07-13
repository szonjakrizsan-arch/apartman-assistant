import { useEffect, useState } from "react";
import { AppHeader }      from "./components/AppHeader";
import { SideNav }        from "./components/SideNav";
import { BottomNav }      from "./components/BottomNav";
import { HomeScreen }     from "./screens/HomeScreen";
import { BookingsScreen } from "./screens/BookingsScreen";
import { TasksScreen }    from "./screens/TasksScreen";
import { InvoicesScreen } from "./screens/InvoicesScreen";
import { ContactsScreen } from "./screens/ContactsScreen";
import { AuthScreen }     from "./screens/AuthScreen";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen";
import { useAppState }    from "./data/appState";
import { useIcalBookings } from "./data/useIcalBookings";
import { useAuth }        from "./hooks/useAuth";
import type { TabId }     from "./types/navigation";
import type { Booking }   from "./data/mockData";
import { useApartments } from "./hooks/useApartments";
import { ApartmentsScreen } from "./screens/ApartmentsScreen";
import { supabase } from "./supabaseClient";
import { trackRegistrationComplete } from "./lib/metaPixel";

export default function App() {
  const [tab, setTab] = useState<TabId>("home");
  const [openBooking, setOpenBooking] = useState<Booking | null>(null);
  const { user, loading, passwordRecovery, clearRecovery } = useAuth();
  const appState = useAppState(user?.id);
  const { apartments, feeds, addApartment, deleteApartment, addFeed, deleteFeed } = useApartments(user?.id);
  const ical = useIcalBookings(apartments, feeds, user?.id);

  const [approved, setApproved] = useState<boolean | null>(null);
  const [approvedLoading, setApprovedLoading] = useState(false);

  useEffect(() => {
    if (!user) { setApproved(null); return; }
    setApprovedLoading(true);
    supabase.from("profiles").select("approved").eq("id", user.id).single()
      .then(({ data }) => {
        setApproved(data?.approved ?? false);
        setApprovedLoading(false);
      });
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  if (loading || approvedLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <p className="text-text-muted text-[13px]">Betöltés...</p>
      </div>
    );
  }

  if (passwordRecovery) {
    return <ResetPasswordScreen onDone={clearRecovery} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (approved === false) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgb(99 190 162 / 0.15)", outline: "1px solid rgb(99 190 162 / 0.25)" }}>
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-[18px] font-bold text-text-primary">Jóváhagyásra vár</h1>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            A fiókod regisztrálva van, de még nem lett jóváhagyva. Hamarosan értesítünk!
          </p>
          <button type="button"
            onClick={() => supabase.auth.signOut()}
            className="mt-2 text-[12px] text-text-muted underline">
            Kijelentkezés
          </button>
        </div>
      </div>
    );
  }

  return (
   <div key={user.id} className="min-h-dvh bg-surface flex">
      <SideNav active={tab} onChange={setTab} />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader tab={tab} />
        {/* TEMP DEBUG — remove after Meta Pixel testing is confirmed working */}
        <button type="button"
          onClick={() => { trackRegistrationComplete(); alert("CompleteRegistration esemény elküldve."); }}
          style={{ position: "fixed", bottom: 12, right: 12, zIndex: 9999, background: "#e07a5f", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>
          TEST: fire CompleteRegistration
        </button>
        {/* END TEMP DEBUG */}
        <main className="mx-auto w-full max-w-2xl px-4 pt-5 pb-24 md:pb-8 md:px-8">
          {tab === "home" && (
            <HomeScreen onNavigate={setTab} appState={appState} ical={ical} hasApartments={apartments.length > 0} />
          )}
          <div className={tab === "bookings" ? undefined : "hidden"}>
            <BookingsScreen appState={appState} ical={ical} openBooking={openBooking} setOpenBooking={setOpenBooking} />
          </div>
          {tab === "tasks" && (
            <TasksScreen appState={appState} ical={ical} />
          )}
          {tab === "invoices" && <InvoicesScreen appState={appState} ical={ical} />}
          {tab === "contacts" && <ContactsScreen appState={appState} ical={ical} userId={user.id} />}
          {tab === "apartments" && <ApartmentsScreen userId={user.id} shared={{ apartments, feeds, addApartment, deleteApartment, addFeed, deleteFeed }} />}
        </main>
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
