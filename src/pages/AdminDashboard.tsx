import { useEffect, useState } from 'react';
import { supabase, Vendor, VendorDocument } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, Eye, FileText, Download } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');

  const handleDownloadDocument = async (documentUrl: string, documentType: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .download(documentUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType}_document`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredVendors(vendors);
    } else {
      setFilteredVendors(vendors.filter(v => v.status === filter));
    }
  }, [filter, vendors]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
      setFilteredVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (vendorId: string) => {
    try {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('*')
        .eq('vendor_id', vendorId);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setComments('');
    loadDocuments(vendor.id);
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedVendor || !user) return;

    setActionLoading(true);
    try {
      const previousStatus = selectedVendor.status;

      const updateData: any = {
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

      if (status === 'rejected' && comments) {
        updateData.rejection_reason = comments;
      }

      const { error: updateError } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', selectedVendor.id);

      if (updateError) throw updateError;

      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert([{
          vendor_id: selectedVendor.id,
          admin_id: user.id,
          action: status,
          previous_status: previousStatus,
          new_status: status,
          comments: comments || null,
        }]);

      if (auditError) throw auditError;

      setSelectedVendor(null);
      setComments('');
      loadVendors();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      alert('Failed to update vendor status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Review and manage vendor applications</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({vendors.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({vendors.filter(v => v.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved ({vendors.filter(v => v.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({vendors.filter(v => v.status === 'rejected').length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Business Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Submitted</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(vendor.status)}
                          {getStatusBadge(vendor.status)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{vendor.business_name}</p>
                          <p className="text-sm text-gray-500">{vendor.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="capitalize text-gray-700">
                          {vendor.business_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">{vendor.contact_number}</td>
                      <td className="py-4 px-4 text-gray-700">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleViewVendor(vendor)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={18} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedVendor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Vendor Details</h2>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(selectedVendor.status)}
                    {getStatusBadge(selectedVendor.status)}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Business Name</h3>
                    <p className="text-gray-900">{selectedVendor.business_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Business Type</h3>
                    <p className="text-gray-900 capitalize">
                      {selectedVendor.business_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Number</h3>
                    <p className="text-gray-900">{selectedVendor.contact_number}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-gray-900">{selectedVendor.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                    <p className="text-gray-900">
                      {selectedVendor.address}, {selectedVendor.city}, {selectedVendor.state} -{' '}
                      {selectedVendor.pincode}
                    </p>
                  </div>
                  {selectedVendor.gst_number && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">GST Number</h3>
                      <p className="text-gray-900">{selectedVendor.gst_number}</p>
                    </div>
                  )}
                  {selectedVendor.pan_number && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">PAN Number</h3>
                      <p className="text-gray-900">{selectedVendor.pan_number}</p>
                    </div>
                  )}
                </div>

                {documents.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-blue-600" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 capitalize">
                                {doc.document_type} Document
                              </p>
                              <p className="text-sm text-gray-500">
                                Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument(doc.document_url, doc.document_type)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Download size={16} />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVendor.status === 'pending' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Action</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                          Comments (Optional for approval, required for rejection)
                        </label>
                        <textarea
                          id="comments"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add any comments or notes..."
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => handleUpdateStatus('approved')}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={20} />
                          {actionLoading ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => {
                            if (!comments.trim()) {
                              alert('Please provide a reason for rejection');
                              return;
                            }
                            handleUpdateStatus('rejected');
                          }}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle size={20} />
                          {actionLoading ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedVendor.rejection_reason && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Rejection Reason</h3>
                    <p className="text-red-700 bg-red-50 p-4 rounded-lg">
                      {selectedVendor.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
