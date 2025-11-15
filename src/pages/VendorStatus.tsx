import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Vendor, VendorDocument, AuditLog } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

export default function VendorStatus() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadVendorData();
    }
  }, [user]);

  const loadVendorData = async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      if (vendorData) {
        const { data: docsData, error: docsError } = await supabase
          .from('vendor_documents')
          .select('*')
          .eq('vendor_id', vendorData.id);

        if (docsError) throw docsError;
        setDocuments(docsData || []);

        const { data: logsData, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;
        setAuditLogs(logsData || []);
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Application Found</h2>
          <p className="text-gray-600 mb-6">You haven't submitted a vendor application yet.</p>
          <a
            href="/vendor/register"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Submit Application
          </a>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (vendor.status) {
      case 'approved':
        return <CheckCircle className="text-green-600" size={48} />;
      case 'rejected':
        return <XCircle className="text-red-600" size={48} />;
      default:
        return <Clock className="text-yellow-600" size={48} />;
    }
  };

  const getStatusColor = () => {
    switch (vendor.status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = () => {
    switch (vendor.status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Application Status</h1>
            <div className="flex items-center gap-3">
              {getStatusIcon()}
            </div>
          </div>

          <div className={`border rounded-lg p-4 mb-6 ${getStatusColor()}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Status</p>
                <p className="text-2xl font-bold mt-1">{getStatusText()}</p>
              </div>
              {vendor.reviewed_at && (
                <div className="text-right">
                  <p className="text-sm">Reviewed on</p>
                  <p className="font-medium">
                    {new Date(vendor.reviewed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {vendor.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
              <p className="text-red-700">{vendor.rejection_reason}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Business Name</h3>
              <p className="text-gray-900">{vendor.business_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Business Type</h3>
              <p className="text-gray-900 capitalize">{vendor.business_type.replace('_', ' ')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Number</h3>
              <p className="text-gray-900">{vendor.contact_number}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
              <p className="text-gray-900">{vendor.email}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
              <p className="text-gray-900">
                {vendor.address}, {vendor.city}, {vendor.state} - {vendor.pincode}
              </p>
            </div>
            {vendor.gst_number && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">GST Number</h3>
                <p className="text-gray-900">{vendor.gst_number}</p>
              </div>
            )}
            {vendor.pan_number && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">PAN Number</h3>
                <p className="text-gray-900">{vendor.pan_number}</p>
              </div>
            )}
          </div>

          {documents.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText size={20} className="text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {doc.document_type} Document
                      </p>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {auditLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity History</h2>
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 capitalize">{log.action}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Status changed to: <span className="font-medium capitalize">{log.new_status}</span>
                  </p>
                  {log.comments && (
                    <p className="text-sm text-gray-600 mt-1">
                      Comments: {log.comments}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
