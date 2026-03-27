import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsBanner from './components/StatsBanner';
import AboutCMS from './components/AboutCMS';
import Benefits from './components/Benefits';
import FeaturesGrid from './components/FeaturesGrid';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import FeatureCards from './components/FeatureCards';

// Auth Components and Pages
import { ProtectedRoute, OnboardingRoute, PublicRoute } from './components/auth/RouteGuards';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Tenant from './pages/Tenant';
import Consents from './pages/Consents';
import Purposes from './pages/Purposes';
import PolicyVersions from './pages/PolicyVersions';
import AuditLogs from './pages/AuditLogs';
import APIKeys from './pages/APIKeys';
import Webhooks from './pages/Webhooks';
import DSRRequests from './pages/DSRRequests';
import Apps from './pages/apps';
import DataCatalog from './pages/DataCatalog';
import { Toaster } from 'react-hot-toast';

import RedirectConsent from './pages/consent/RedirectConsent';
import ConsentResult from './pages/consent/ConsentResult';

const LandingPage = () => (
  <div className="min-h-screen bg-slate-50 font-sans">
    <Navbar />
    <Hero />
    <FeatureCards />
    <StatsBanner />
    <AboutCMS />
    <Benefits />
    <FeaturesGrid />
    <FAQ />
    <Footer />
  </div>
);

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Consent Flow Pages */}
          <Route path="/consent/redirect" element={<RedirectConsent />} />
          <Route path="/consent/result" element={<ConsentResult />} />

          {/* Auth routes (Only unauthenticated users) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Onboarding route (Only users needing onboarding) */}
          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          {/* Protected SaaS routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/consents" element={<Consents />} />
              <Route path="/purposes" element={<Purposes />} />
              <Route path="/policy-versions" element={<PolicyVersions />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/api-keys" element={<APIKeys />} />
              <Route path="/tenant" element={<Tenant />} />
              <Route path="/webhooks" element={<Webhooks />} />
              <Route path="/dsr" element={<DSRRequests />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/data-catalog" element={<DataCatalog />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
