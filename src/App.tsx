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
import { useApartments } from "./hooks/useApartments";
import { ApartmentsScreen } from "./screens/ApartmentsScreen";

export default function App() {
  const [tab, setTab] = useState<TabId>("home");

  const { user, loading, passwordRecovery, clearRecovery } = useAuth();
  const appState = useAppState(user?.id);
const { apartments, feeds, addApartment, deleteApartment, addFeed, deleteFeed } = useApartments(user?.id);
const ical = useIcalBookings(apartments, feeds);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  /* Betöltés közben */
  if (loading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <p className="text-text-muted text-[13px]">Betöltés...</p>
      </div>
    );
  }

  /* Jelszó visszaállítás folyamatban */
  if (passwordRecovery) {
    return <ResetPasswordScreen onDone={clearRecovery} />;
  }
  /* Nincs bejelentkezve */
  if (!user) {
    return <AuthScreen />;
  }

  /* Bejelentkezve */
  return (
    <div key={user.id} className="min-h-dvh bg-surface flex">
      <SideNav active={tab} onChange={setTab} />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader tab={tab} />
        <main className="mx-auto w-full max-w-2xl px-4 pt-5 pb-24 md:pb-8 md:px-8">
          {tab === "home" && (
            <HomeScreen onNavigate={setTab} appState={appState} ical={ical} hasApartments={apartments.length > 0} />
          )}
          {tab === "bookings" && (
            <BookingsScreen appState={appState} ical={ical} />
          )}
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
