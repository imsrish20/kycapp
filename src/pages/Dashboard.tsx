import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { Building2, FileText, LogOut, Shield } from 'lucide-react';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">Vendor KYC Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome,</p>
              <p className="font-semibold text-gray-900">{profile?.full_name}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {profile?.role === 'admin' ? 'Admin Dashboard' : 'Vendor Portal'}
          </h1>
          <p className="text-xl text-gray-600">
            {profile?.role === 'admin'
              ? 'Review and manage vendor applications'
              : 'Submit and track your vendor application'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {profile?.role === 'vendor' && (
            <>
              <button
                onClick={() => navigate('/vendor/register')}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <FileText className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Register as Vendor</h2>
                <p className="text-gray-600">
                  Submit your business details and KYC documents for verification
                </p>
              </button>

              <button
                onClick={() => navigate('/vendor/status')}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Shield className="text-green-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Application</h2>
                <p className="text-gray-600">
                  View the current status and details of your vendor application
                </p>
              </button>
            </>
          )}

          {profile?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow text-left group md:col-span-2"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Shield className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Applications</h2>
              <p className="text-gray-600">
                View all vendor applications and approve or reject based on compliance
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
