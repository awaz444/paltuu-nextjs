'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Package, Truck, Calendar, Download, ArrowLeft, Copy, User, Mail, Phone, MapPin } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from "../../context/AuthContext";
import { useOrderProtection } from "@/hooks/useOrderProtection";

const OrderConfirmedContent  = () => {
  const { isAuthenticated, user } = useAuth();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Order protection - redirect if no valid order
  const { isChecking, isValidOrder } = useOrderProtection({
    redirectTo: '/marketplace',
    showMessage: true
  });

  useEffect(() => {
    const orderNumber = searchParams.get('orderNumber');
    if (!orderNumber) return setLoading(false);
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/bazaar/orders?orderNumber=${encodeURIComponent(orderNumber)}`);
        if (!res.ok) throw new Error('Order fetch failed');
        const list = await res.json();
        setOrder(Array.isArray(list) ? list[0] : list);
      } catch (e) {
        console.warn('Failed to fetch order', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);
  
  
  useEffect(() => {
    const check = () => {
      if (!isAuthenticated || !user) {
        return;
      }
      
      setLoading(false);
    };
    const t = setTimeout(check, 100);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, router]);

  const copyOrderNumber = async () => {
    if (!order?.order_number) return;
    await navigator.clipboard.writeText(order.order_number);
    alert('Order number copied');
  };

  const continueShopping = () => {
    router.push('/marketplace');
  };

  const generateReceiptHtml = (o: any) => {
    const logoUrl = (typeof window !== 'undefined' && (window as any).location)
      ? `${(window as any).location.origin}/paltuu.png`
      : '/paltuu.png';
    const itemsHtml = (o?.items || [])
      .map((it: any) => `
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; vertical-align: top;">
            <strong>${escapeHtml(it.product_title || 'N/A')}</strong>
          </td>
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; vertical-align: top;">
            ${escapeHtml(it.variant_title || 'Standard')}
          </td>
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center; vertical-align: top;">
            ${Number(it.quantity || 0)}
          </td>
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: right; vertical-align: top;">
            Rs ${Number(it.unit_price || 0).toLocaleString()}
          </td>
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: right; vertical-align: top; font-weight: bold;">
            Rs ${Number(it.total_price || 0).toLocaleString()}
          </td>
        </tr>
      `)
      .join('');

    const shipping = o?.shipping_amount || 0;
    const discount = o?.discount_amount || 0;
    const total = o?.total_amount || 0;

    // return a fragment (no <html>/<head>) so html2canvas/html2pdf can render the node reliably
    return `
      <div style="font-family: Arial, sans-serif; color: #000000; padding: 20px; background: #ffffff; max-width: 750px; margin: 0 auto; border: 1px solid #e0e0e0;">
        <!-- Header with Logo and Title -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #a03048; padding-bottom: 20px;">
          <div>
            <h1 style="margin: 0; font-size: 28px; color: #a03048; font-weight: bold;">RECEIPT</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Order #${escapeHtml(o?.order_number || '')}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">${new Date(o?.created_at || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          <img src="${logoUrl}" alt="Paltuu" style="height: 140px; margin-left: 20px; margin-bottom: 50px;" />
        </div>

        <!-- Customer Information -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Customer Information</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 3px 0; font-weight: bold; width: 100px;">Name:</td>
              <td style="padding: 3px 0;">${escapeHtml(o?.customer_name || 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-weight: bold;">Email:</td>
              <td style="padding: 3px 0;">${escapeHtml(o?.customer_email || 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-weight: bold;">Phone:</td>
              <td style="padding: 3px 0;">${escapeHtml(o?.customer_phone || 'N/A')}</td>
            </tr>
          </table>
        </div>

        <!-- Shipping Address -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Shipping Address</h3>
          <div style="font-size: 14px; line-height: 1.4;">
            ${escapeHtml((o?.shipping_address && (o.shipping_address.address || o.shipping_address.line1)) || 'N/A')}<br/>
            ${escapeHtml((o?.shipping_address && (o.shipping_address.city || '')) || '')} ${escapeHtml((o?.shipping_address && o.shipping_address.postalCode) || '')}
          </div>
        </div>

        <!-- Order Items -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; font-weight: bold;">Product</th>
                <th style="padding: 12px 8px; text-align: left; border: 1px solid #dee2e6; font-weight: bold;">Variant</th>
                <th style="padding: 12px 8px; text-align: center; border: 1px solid #dee2e6; font-weight: bold;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">Unit Price</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Order Summary -->
        <div style="margin-bottom: 25px;">
          <div style="max-width: 300px; margin-left: auto;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; text-align: left;">Subtotal:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">Rs ${Number(o?.subtotal || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; text-align: left;">Shipping:</td>
                <td style="padding: 8px 0; text-align: right;">Rs ${Number(shipping).toLocaleString()}</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="padding: 8px 0; text-align: left; color: #28a745;">Discount:</td>
                <td style="padding: 8px 0; text-align: right; color: #28a745;">-Rs ${Number(discount).toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #a03048;">
                <td style="padding: 12px 0 8px 0; text-align: left; font-size: 16px; font-weight: bold;">TOTAL:</td>
                <td style="padding: 12px 0 8px 0; text-align: right; font-size: 16px; font-weight: bold; color: #a03048;">Rs ${Number(total).toLocaleString()}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Payment Information -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment Information</h3>
          <p style="margin: 0; font-size: 14px;">Payment Method: <strong>${escapeHtml(o?.payment_method?.toUpperCase() || 'COD')}</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Status: <strong style="color: #28a745;">CONFIRMED</strong></p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">
            Thank you for choosing Paltuu!<br/>
            For support, visit <a href="https://www.paltuu.pk" style="color: #a03048; text-decoration: none; font-weight: bold;">paltuu.pk</a> or contact us at support@paltuu.pk
          </p>
          <p style="margin: 10px 0 0 0; font-size: 10px; color: #999;">
            This is a computer-generated receipt. No signature required.
          </p>
        </div>
      </div>
    `;
  };

  const escapeHtml = (str: any) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const waitForImages = (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    return Promise.all(imgs.map(img => {
      if (img.complete) return Promise.resolve(true);
      return new Promise((res) => { img.onload = img.onerror = () => res(true); });
    }));
  };

  const loadHtml2Pdf = () => new Promise((resolve, reject) => {
    const win = window as any;
    if (win.html2pdf) return resolve(win.html2pdf);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js';
    s.onload = () => resolve((window as any).html2pdf);
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });

  const downloadReceipt = async () => {
    if (!order) return alert('Order not loaded');
    try {
      // load html2pdf first
      await loadHtml2Pdf();

      // create visible container temporarily
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.background = '#ffffff';
      container.style.padding = '20px';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.color = '#000000';
      container.style.zIndex = '-1000';
      container.innerHTML = generateReceiptHtml(order);
      document.body.appendChild(container);

      // wait for images to load
      await waitForImages(container);

      // small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `paltuu-receipt-${(order.order_number || 'receipt').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 800,
          height: container.scrollHeight
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      await (window as any).html2pdf().set(opt).from(container).save();

      // cleanup
      container.remove();

    } catch (e) {
      console.error('Failed to generate receipt PDF', e);
      alert('Failed to generate receipt PDF: ' + (e as Error).message);
    }
  };

  // Show loading while checking order validity
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if no valid order (user will be redirected)
  if (!isValidOrder) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-primary/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                Order Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Order Number:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-mono font-semibold">{order?.order_number ?? '—'}</span>
                    <button onClick={copyOrderNumber} className="p-2 rounded-lg hover:bg-primary/10 transition-colors" aria-label="Copy order number" title="Copy order number">
                      <Copy className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="text-gray-900 font-medium">{order?.created_at ? new Date(order.created_at).toLocaleString() : '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="text-primary font-semibold text-lg">{order ? `Rs ${(order.total_amount || 0).toLocaleString()}` : '—'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="text-gray-900 font-medium capitalize">{order?.payment_method ?? '—'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                Shipping Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-medium">{order?.customer_name ?? '—'}</p>
                  </div>
                </div>
                {order?.customer_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-gray-600">{order.customer_email}</p>
                  </div>
                )}
                {order?.customer_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-gray-600">{order.customer_phone}</p>
                  </div>
                )}
                {order?.shipping_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-gray-600">
                      <p>{order.shipping_address.address || order.shipping_address.line1 || ''}</p>
                      <p>{order.shipping_address.city || ''} {order.shipping_address.postalCode || ''}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        {order?.items && Array.isArray(order.items) && (
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-primary/10">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              Order Items
            </h3>
            <div className="space-y-4">
              {order.items.map((it: any) => (
                <div key={it.order_item_id} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">{it.product_title}</div>
                    <div className="text-sm text-gray-500">{it.variant_title || ''} • Qty {it.quantity}</div>
                  </div>
                  <div className="text-primary font-semibold">Rs {(it.total_price || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Timeline */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-primary/10">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Timeline</h3>
          <div className="space-y-8 relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary/20"></div>
            {[
              {
                icon: CheckCircle,
                title: 'Order Confirmed',
                description: 'Your order has been received and is being processed',
                time: 'Just now',
                status: 'completed'
              },
              {
                icon: Package,
                title: 'Preparing for Shipment',
                description: 'Your items are being picked and packed',
                time: 'Within 2-4 hours',
                status: 'pending'
              },
              {
                icon: Truck,
                title: 'Shipped',
                description: 'Your order is on its way to you',
                time: '1-2 business days',
                status: 'upcoming'
              },
              {
                icon: Calendar,
                title: 'Delivered',
                description: 'Your order will be delivered to your address',
                time: '3-5 business days',
                status: 'upcoming'
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-4 relative">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10
                  ${item.status === 'completed'
                    ? 'bg-primary border-primary text-white shadow-lg'
                    : item.status === 'pending'
                    ? 'bg-primary border-primary text-white shadow-lg animate-pulse'
                    : 'border-primary/30 text-primary/30 bg-white'}
                `}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-gray-900 font-medium">{item.title}</h4>
                  <p className="text-gray-600">{item.description}</p>
                  <p className="text-primary font-medium text-sm mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={continueShopping}
            className="flex items-center px-8 py-3 bg-white text-primary border border-primary rounded-xl hover:bg-primary/5 transition-colors duration-200 font-medium shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Continue Shopping
          </button>

          <button onClick={downloadReceipt} className="flex items-center px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium shadow-lg">
            <Download className="w-5 h-5 mr-2" />
            Download Receipt
          </button>
        </div>

        {/* Login Prompt (only show if user is not logged in) */}
        {!user && (
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-primary/10 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Create an account or log in
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Store your order details permanently and unlock all Paltuu features
              like order history, faster checkout, and exclusive offers.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors duration-200 shadow-lg"
            >
              Login / Sign Up
            </button>
          </div>
        )}

        {/* Contact Support */}
        <div className="text-center p-8 bg-primary/5 rounded-2xl border border-primary/10">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help with your order?</h3>
          <p className="text-gray-600 mb-4">Our support team is here to help</p>
          <button className="px-6 py-2 bg-white text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors duration-200 font-medium">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <OrderConfirmedContent />
    </Suspense>
  );
}