'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Truck, CreditCard, ExternalLink, RefreshCw, Eye, X, Check, XCircle, Clock, Package } from 'lucide-react';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [paymentProof, setPaymentProof] = useState<any | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // only fetch when signed-in user is admin
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    fetchOrders();
  }, [filter, isAuthenticated, user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('admin', 'true');
      if (filter) q.set('status', filter);
      const res = await fetch(`/api/bazaar/orders?${q.toString()}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch orders', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (orderId: string, updates: any) => {
    try {
      const res = await fetch('/api/bazaar/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, updates })
      });
      const json = await res.json();
      if (json?.order) {
        setOrders(prev => prev.map(o => (o.order_id === json.order.order_id ? json.order : o)));
        alert('Order updated successfully');
      } else {
        console.warn('Update response', json);
      }
    } catch (e) {
      console.error('Failed to update order', e);
      alert('Failed to update order');
    }
  };

  const markDelivered = (o: any) => {
    if (!confirm('Mark this order as delivered?')) return;
    updateOrder(o.order_id, {
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      // For COD, mark as paid when delivered
      ...(o.payment_method === 'cod' ? { payment_status: 'paid' } : {})
    });
  };

  const markConfirmed = (o: any) => {
    if (!confirm('Confirm this order?')) return;
    updateOrder(o.order_id, { status: 'confirmed' });
  };

  const markDispatched = (o: any) => {
    if (!confirm('Mark this order as dispatched?')) return;
    updateOrder(o.order_id, {
      status: 'dispatched',
      shipped_at: new Date().toISOString()
    });
  };

  const togglePayment = (o: any) => {
    const next = o.payment_status === 'paid' ? 'pending' : 'paid';
    if (!confirm(`Mark payment as ${next}?`)) return;
    updateOrder(o.order_id, { payment_status: next });
  };

  const setTracking = (o: any) => {
    const t = prompt('Enter tracking number', o.tracking_number || '');
    if (t !== null) updateOrder(o.order_id, { tracking_number: t });
  };

  const viewPaymentProof = async (orderId: number) => {
    try {
      const res = await fetch(`/api/bazaar/payment-proofs?orderId=${orderId}`);
      const data = await res.json();
      if (data.proof) {
        setPaymentProof(data.proof);
        setShowPaymentProofModal(true);
      } else {
        alert('No payment proof uploaded for this order');
      }
    } catch (e) {
      console.error('Failed to fetch payment proof', e);
      alert('Failed to fetch payment proof');
    }
  };

  const verifyPaymentProof = async (proofId: number, status: 'approved' | 'rejected', notes: string = '') => {
    try {
      const res = await fetch('/api/bazaar/payment-proofs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofId,
          status,
          adminNotes: notes,
          adminUserId: user?.id
        })
      });

      if (!res.ok) throw new Error('Failed to verify payment proof');

      alert(`Payment proof ${status}`);
      setShowPaymentProofModal(false);
      setPaymentProof(null);
      fetchOrders(); // Refresh orders

    } catch (e) {
      console.error('Failed to verify payment proof', e);
      alert('Failed to verify payment proof');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-indigo-100 text-indigo-800',
      'dispatched': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 bg-white rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-4">Access denied</h2>
          <p className="text-sm text-gray-600 mb-4">You must be signed in as an admin to view this page.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => router.push('/auth')} className="px-4 py-2 bg-blue-600 text-white rounded">Sign in</button>
            <button onClick={() => router.push('/')} className="px-4 py-2 border rounded">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              aria-label="Filter orders by status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4"/>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Confirmed</div>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'confirmed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Delivered</div>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading orders...</p>
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found</p>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map(o => (
                    <tr key={o.order_id} className="hover:bg-gray-50 transition-colors">
                      {/* Order Info */}
                      <td className="px-4 py-4">
                        <div className="font-mono text-sm font-semibold text-gray-900">{o.order_number}</div>
                        <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleTimeString()}</div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{o.customer_name}</div>
                        <div className="text-sm text-gray-500">{o.customer_email}</div>
                        <div className="text-sm text-gray-500">{o.customer_phone}</div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">Rs {(o.total_amount || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-500 uppercase">{o.payment_method || 'COD'}</div>
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(o.payment_status)}`}>
                          {o.payment_status || 'pending'}
                        </span>
                        {o.payment_method === 'bank_transfer' && o.payment_status === 'pending' && (
                          <button
                            onClick={() => viewPaymentProof(o.order_id)}
                            className="ml-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Proof
                          </button>
                        )}
                      </td>

                      {/* Order Status */}
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
                          {o.status || 'pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => router.push(`/order-confirmed?orderNumber=${encodeURIComponent(o.order_number)}`)}
                            className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                            title="View Order"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </button>

                          {o.status === 'pending' && (
                            <button
                              onClick={() => markConfirmed(o)}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                              title="Confirm Order"
                            >
                              <Check className="w-3 h-3" />
                              Confirm
                            </button>
                          )}

                          {(o.status === 'confirmed' || o.status === 'processing') && (
                            <button
                              onClick={() => markDispatched(o)}
                              className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                              title="Mark as Dispatched"
                            >
                              <Truck className="w-3 h-3" />
                              Dispatch
                            </button>
                          )}

                          {o.status === 'dispatched' && (
                            <button
                              onClick={() => markDelivered(o)}
                              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                              title="Mark as Delivered"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Deliver
                            </button>
                          )}

                          <button
                            onClick={() => togglePayment(o)}
                            className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
                            title="Toggle Payment Status"
                          >
                            <CreditCard className="w-3 h-3" />
                            {o.payment_status === 'paid' ? 'Unpaid' : 'Paid'}
                          </button>

                          <button
                            onClick={() => setTracking(o)}
                            className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                            title="Set Tracking Number"
                          >
                            <Truck className="w-3 h-3" />
                            Track
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Proof Modal */}
      {showPaymentProofModal && paymentProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Payment Proof Verification</h3>
                <button
                  onClick={() => {
                    setShowPaymentProofModal(false);
                    setPaymentProof(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Order Number:</span>
                      <span className="ml-2 font-semibold">{paymentProof.order_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <span className="ml-2 font-semibold">{paymentProof.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2">{paymentProof.customer_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Uploaded:</span>
                      <span className="ml-2">{new Date(paymentProof.uploaded_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Proof Image */}
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={paymentProof.image_url}
                    alt="Payment Proof"
                    className="w-full h-auto"
                  />
                </div>

                {/* Current Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${paymentProof.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                      paymentProof.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {paymentProof.verification_status}
                  </span>
                </div>

                {/* Admin Notes */}
                {paymentProof.admin_notes && (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-semibold text-gray-700 mb-1">Admin Notes:</div>
                    <div className="text-sm text-gray-600">{paymentProof.admin_notes}</div>
                  </div>
                )}

                {/* Verification Actions */}
                {paymentProof.verification_status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        const notes = prompt('Add notes (optional):');
                        verifyPaymentProof(paymentProof.proof_id, 'approved', notes || '');
                      }}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium"
                    >
                      <Check className="w-5 h-5" />
                      Approve Payment
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Reason for rejection:');
                        if (notes) {
                          verifyPaymentProof(paymentProof.proof_id, 'rejected', notes);
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-medium"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
