import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useLocation } from './hooks/useNavigate';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VendorRegistration from './pages/VendorRegistration';
import VendorStatus from './pages/VendorStatus';
import AdminDashboard from './pages/AdminDashboard';

function Router() {
  const { user, profile, loading } = useAuth();
  const path = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (path === '/register') {
      return <Register />;
    }
    return <Login />;
  }

  switch (path) {
    case '/dashboard':
      return <Dashboard />;
    case '/vendor/register':
      return profile?.role === 'vendor' ? <VendorRegistration /> : <Dashboard />;
    case '/vendor/status':
      return profile?.role === 'vendor' ? <VendorStatus /> : <Dashboard />;
    case '/admin/dashboard':
      return profile?.role === 'admin' ? <AdminDashboard /> : <Dashboard />;
    default:
      return <Dashboard />;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
