'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { Upload, AlertCircle, Copy, CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from "../../context/AuthContext";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { createClient } from "@supabase/supabase-js";

// Client Component that uses useSearchParams
function PaymentConfirmationClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cartData, setCartData] = useState<any>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get cart data from URL params (passed from checkout)
  useEffect(() => {
    const cartDataParam = searchParams.get('cartData');
    if (!cartDataParam) {
      router.push('/checkout');
      return;
    }

    try {
      const decoded = JSON.parse(decodeURIComponent(cartDataParam));
      setCartData(decoded);
      setLoading(false);
    } catch (error) {
      console.error('Failed to parse cart data:', error);
      router.push('/checkout');
    }
  }, [searchParams, router]);

  const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingProof(true);

      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase config:', { supabaseUrl, supabaseKey: supabaseKey ? 'present' : 'missing' });
        throw new Error('Supabase configuration missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file and restart the server.');
      }

      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false
        }
      });

      // Upload to Supabase Storage (bucket name: Payment)
      const timestamp = Date.now();
      const sessionId = getOrCreateGuestSessionId();
      const fileName = `payment-proof-${user?.id || sessionId}-${timestamp}.${file.name.split('.').pop()}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Payment')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('Payment')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      setPaymentProofUrl(imageUrl);

    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload payment proof: ' + error.message);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!paymentProofUrl) {
      alert('Please upload payment proof first');
      return;
    }

    if (!cartData) {
      alert('Cart data is missing');
      return;
    }

    try {
      setCreatingOrder(true);

      const sessionId = getOrCreateGuestSessionId();

      // Create order with payment proof
      const response = await fetch('/api/bazaar/orders/create-with-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || null,
          sessionId: sessionId,
          cartData: cartData,
          paymentProofUrl: paymentProofUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const result = await response.json();

      // Redirect to order confirmed page
      router.push(`/order-confirmed?orderNumber=${result.order.order_number}`);

    } catch (error: any) {
      console.error('Order creation error:', error);
      alert('Failed to create order: ' + error.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cartData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#a03048]/10 flex items-center justify-center">
            <CreditCard className="w-10 h-10 text-[#a03048]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Payment</h1>
          <p className="text-lg text-gray-600">
            Transfer the amount to our bank account and upload payment proof
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-primary/10">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900 font-medium">Rs {cartData.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Shipping:</span>
              <span className="text-gray-900 font-medium">Rs {cartData.shippingAmount.toLocaleString()}</span>
            </div>
            {cartData.discountAmount > 0 && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Discount:</span>
                <span className="text-green-600 font-medium">-Rs {cartData.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border-2 border-primary">
              <span className="text-gray-900 font-semibold text-lg">Total Amount:</span>
              <span className="text-primary font-bold text-2xl">Rs {cartData.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-lg border border-primary/10">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Bank Transfer Details</h3>

          <div className="bg-[#a03048]/10 rounded-xl p-6 mb-6 border border-[#a03048]/60">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#a03048]/80" />
              Transfer Exact Amount: <span className="text-primary text-xl">Rs {cartData.totalAmount.toLocaleString()}</span>
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600 font-medium">Bank Name:</span>
                <span className="font-semibold text-gray-900">Meezan Bank</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600 font-medium">Account Title:</span>
                <span className="font-semibold text-gray-900">Paltuu (Pvt) Ltd</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600 font-medium">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-gray-900">0123-4567-8901</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('0123-4567-8901');
                      alert('Account number copied!');
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copy account number"
                  >
                    <Copy className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600 font-medium">IBAN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-gray-900">PK36MEZN0001230123456789</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('PK36MEZN0001230123456789');
                      alert('IBAN copied!');
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copy IBAN"
                  >
                    <Copy className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Important Instructions */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-2">Important Instructions:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>Transfer the <strong>exact amount: Rs {cartData.totalAmount.toLocaleString()}</strong></li>
                  <li>Include your name in the transfer description</li>
                  <li>Take a clear screenshot or photo of the payment receipt</li>
                  <li>Upload the payment proof below to confirm your order</li>
                  <li>Your order will be created immediately after uploading proof</li>
                  <li>Our team will verify payment within 24 hours</li>
                  <li>Incase of any issue uploading, text +923394022468 on Whatsapp and type '7'</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Proof Upload */}
          {!paymentProofUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Upload Payment Proof</h4>
              <p className="text-sm text-gray-600 mb-4">
                After transferring the amount, upload a screenshot or photo of your payment receipt
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentProofUpload}
                  className="hidden"
                  disabled={uploadingProof}
                />
                <span className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {uploadingProof ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Choose File
                    </>
                  )}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2">Supported: JPG, PNG, WebP (Max 5MB)</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Proof Uploaded Successfully!</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Your payment proof has been uploaded. Click "Confirm Order" below to complete your purchase.
                  </p>
                  <a
                    href={paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View uploaded proof →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Checkout
          </button>

          <button
            onClick={handleConfirmOrder}
            disabled={!paymentProofUrl || creatingOrder}
            className="flex items-center px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingOrder ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Creating Order...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm Order
              </>
            )}
          </button>
        </div>

        {/* Help Section */}
        <div className="text-center p-6 bg-white rounded-2xl border border-primary/10">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">Having trouble with the payment? Our support team is here to help</p>
          <a
            href="mailto:support@paltuu.pk"
            className="inline-block px-6 py-2 bg-gray-100 text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function PaymentConfirmationPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <PaymentConfirmationClient />
    </Suspense>
  );
}
