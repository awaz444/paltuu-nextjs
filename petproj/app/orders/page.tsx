'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, Truck, CreditCard, ExternalLink, RefreshCw } from 'lucide-react';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
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
      } else {
        console.warn('Update response', json);
      }
    } catch (e) {
      console.error('Failed to update order', e);
    }
  };

  const markDelivered = (o: any) => {
    updateOrder(o.order_id, { status: 'delivered', delivered_at: new Date().toISOString() });
  };

  const togglePayment = (o: any) => {
    const next = o.payment_status === 'paid' ? 'pending' : 'paid';
    updateOrder(o.order_id, { payment_status: next });
  };

  const setTracking = (o: any) => {
    const t = prompt('Enter tracking number', o.tracking_number || '');
    if (t !== null) updateOrder(o.order_id, { tracking_number: t });
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 bg-white rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-4">Access denied</h2>
          <p className="text-sm text-gray-600 mb-4">You must be signed in as an admin to view this page.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => router.push('/login')} className="px-4 py-2 bg-blue-600 text-white rounded">Sign in</button>
            <button onClick={() => router.push('/')} className="px-4 py-2 border rounded">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Orders Admin</h1>
          <div className="flex items-center gap-3">
            <select aria-label="Filter orders by status" value={filter} onChange={(e) => setFilter(e.target.value)} className="border p-2 rounded">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={fetchOrders} className="px-3 py-2 border rounded flex items-center gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button>
          </div>
        </div>

        <div className="bg-white rounded shadow divide-y">
          {loading && <div className="p-4 text-center">Loading...</div>}
          {!loading && orders.length === 0 && <div className="p-6 text-center text-gray-500">No orders found.</div>}
          {orders.map(o => (
            <div key={o.order_id} className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <div>
                <div className="text-sm text-gray-500">Order</div>
                <div className="font-mono text-gray-900">{o.order_number}</div>
                <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Customer</div>
                <div className="font-medium">{o.customer_name}</div>
                <div className="text-sm text-gray-500">{o.customer_email}</div>
                <div className="text-sm text-gray-500">{o.customer_phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Amount</div>
                <div className="font-semibold">Rs {(o.total_amount || 0).toLocaleString()}</div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${o.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{o.payment_status || 'pending'}</span>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${o.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{o.status || 'pending'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => router.push(`/order-confirmed?orderNumber=${encodeURIComponent(o.order_number)}`)} className="px-3 py-2 border rounded flex items-center gap-2"><ExternalLink className="w-4 h-4"/>View</button>
                  <button onClick={() => togglePayment(o)} className="px-3 py-2 bg-yellow-500 text-white rounded flex items-center gap-2"><CreditCard className="w-4 h-4"/>{o.payment_status === 'paid' ? 'Mark Pending' : 'Mark Paid'}</button>
                  <button onClick={() => markDelivered(o)} className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-2"><CheckCircle className="w-4 h-4"/>Mark Delivered</button>
                  <button onClick={() => setTracking(o)} className="px-3 py-2 border rounded flex items-center gap-2"><Truck className="w-4 h-4"/>Set Tracking</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
