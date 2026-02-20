
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RestaurantProvider } from './context/RestaurantContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { KitchenDashboard } from './pages/Kitchen/KitchenDashboard';
import { BillingDashboard } from './pages/Billing/BillingDashboard';
import { Settings } from './pages/Settings/Settings';
import { CustomerPortal } from './customer/CustomerPortal';
import './assets/styles/App.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ maxWidth: '100%', overflowX: 'auto' }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRoutes = () => {
  return (
    <Routes>
      {/* Customer Side */}
      <Route path="/" element={<CustomerPortal />} />

      {/* Restaurant Side with Layout */}
      <Route
        path="/kitchen"
        element={
          <DashboardLayout>
            <KitchenDashboard />
          </DashboardLayout>
        }
      />
      <Route
        path="/billing"
        element={
          <DashboardLayout>
            <BillingDashboard />
          </DashboardLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        }
      />
      <Route
        path="/admin"
        element={<Navigate to="/kitchen" replace />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <RestaurantProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </RestaurantProvider>
    </ErrorBoundary>
  );
}

export default App;
