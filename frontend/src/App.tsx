import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ShellProvider } from "./shell";
import { AuthProvider } from "./auth";
import { CurrencyProvider } from "./currency";
import { AccessibilityProvider, AccessibilityMenu } from "./accessibility";
import { SiteNav } from "./SiteNav";
import { HomePage } from "./HomePage";
import { DiscoverPage } from "./DiscoverPage";
import { ConciergePage } from "./ConciergePage";
import { BookingPage } from "./BookingPage";
import { DashboardPage } from "./DashboardPage";
import { ForYouPage } from "./ForYouPage";
import { PlanTripPage } from "./PlanTripPage";
import { ItineraryPage } from "./ItineraryPage";
import { MyTripsPage } from "./MyTripsPage";
import { BookingsPage } from "./BookingsPage";
import { BookingDetailPage } from "./BookingDetailPage";
import { TravelWalletPage } from "./TravelWalletPage";
import { LiveAssistancePage } from "./LiveAssistancePage";
import { TripMemoriesPage } from "./TripMemoriesPage";
import { ProfilePage } from "./ProfilePage";
import { ConversationPage } from "./ConversationPage";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";
import { CheckoutPage } from "./CheckoutPage";
import { AdminPage } from "./AdminPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShellProvider>
          <CurrencyProvider>
          <AccessibilityProvider>
          <main className="page">
            <SiteNav />
            <AccessibilityMenu />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/concierge" element={<ConciergePage />} />
              <Route path="/book" element={<BookingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/for-you" element={<ForYouPage />} />
              <Route path="/plan" element={<PlanTripPage />} />
              <Route path="/itinerary" element={<ItineraryPage />} />
              <Route path="/my-trips" element={<MyTripsPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/wallet" element={<TravelWalletPage />} />
              <Route path="/live-assistance" element={<LiveAssistancePage />} />
              <Route path="/memories" element={<TripMemoriesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/conversation" element={<ConversationPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          </AccessibilityProvider>
          </CurrencyProvider>
        </ShellProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
