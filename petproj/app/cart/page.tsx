"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, updateCartItem, removeCartItem } from '@/app/store/slices/cartSlice';
import type { RootState, AppDispatch } from '@/app/store/store';
import {
  X,
  Plus,
  Minus,
  Heart,
  Shield,
  Truck,
  ArrowLeft,
  Check,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string | number;
  title: string;
  qty: number;
  price: number;
  image?: string | null;
  code?: string | number | null;
  variantTitle?: string | null;
  attributes?: Array<{ name?: string; value?: string }> | any;
}

const CartPage = () => {
  useSetPrimaryColor();
  const dispatch = useDispatch<AppDispatch>();
  const cartState = useSelector((s: RootState) => s.cart);
  const cartItems: CartItem[] = cartState.items.map((it: any) => ({
    id: it.id,
    title: it.title,
    qty: it.qty,
    price: it.price,
    image: it.image,
  code: it.code ?? it.product_id ?? null,
  variantTitle: it.variantTitle ?? (it.variant ? it.variant.title : null),
  attributes: it.attributes ?? (it.variant && it.variant.attributes ? it.variant.attributes : []),
  }));
  const loading = cartState.loading;
  const [updatedItems, setUpdatedItems] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // ✅ Update quantity
  const updateQuantity = async (itemId: string | number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      setUpdatedItems((prev) => [...prev, String(itemId)]);
      setTimeout(() => {
        setUpdatedItems((prev) => prev.filter((id) => id !== String(itemId)));
      }, 2000);
      await dispatch(updateCartItem({ cartItemId: itemId, quantity: newQuantity }) as any);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  // ✅ Remove item
  const removeItem = async (itemId: string | number) => {
    try {
      await dispatch(removeCartItem({ cartItemId: itemId }) as any);
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  // ✅ Totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span>Marketplace</span>
          <span className="mx-2">/</span>
          <span className="text-primary">Cart</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Your Shopping Cart 🛒
          </h1>
          <button
            className="flex items-center text-primary hover:text-primary-dark font-medium"
            onClick={() => router.push('/marketplace')}
          >
            <ArrowLeft size={18} className="mr-1" />
            Continue Shopping
          </button>
        </div>

        {/* Cart Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <p className="text-gray-500">Loading cart...</p>
            ) : cartItems.length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              cartItems.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onUpdate={updateQuantity}
                  onRemove={removeItem}
                  updated={updatedItems.includes(String(item.id))}
                />
              ))
            )}

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-md mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Why shop with us?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TrustBadge
                  icon={<Truck className="w-6 h-6 text-primary" />}
                  title="Free Delivery"
                  desc="On orders over PKR 5,000"
                />
                <TrustBadge
                  icon={<Shield className="w-6 h-6 text-primary" />}
                  title="Secure Payment"
                  desc="100% secure payment"
                />
                <TrustBadge
                  icon={<Heart className="w-6 h-6 text-primary" />}
                  title="Pet Experts"
                  desc="24/7 customer support"
                />
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white shadow-lg rounded-2xl p-6 space-y-6 h-fit sticky top-28">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">
              Order Summary
            </h2>

            <div className="space-y-3">
              <SummaryRow
                label={`Subtotal (${cartItems.length} items)`}
                value={subtotal}
              />
            </div>

            <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition shadow-md">
              Proceed to Checkout
            </button>

            <div className="text-center">
              <p className="text-gray-500 text-sm">or</p>
              <button onClick={() => router.push('/marketplace')} className="text-primary border border-primary font-medium text-sm mt-2 px-4 py-2 rounded-xl hover:bg-primary/10 transition">
                Continue Shopping
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Free delivery</span> for orders
                above PKR 5,000. Your order is{" "}
                <span className="font-medium">
                  {subtotal >= 5000 ? "eligible" : "not eligible"}
                </span>{" "}
                for free delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CartPage;

/* ------------------ Components ------------------ */
function CartItemCard({
  item,
  onUpdate,
  onRemove,
  updated,
}: {
  item: CartItem;
  onUpdate: (id: string | number, qty: number) => void;
  onRemove: (id: string | number) => void;
  updated: boolean;
}) {
  const [localQuantity, setLocalQuantity] = useState(item.qty);

  useEffect(() => {
    setLocalQuantity(item.qty);
  }, [item.qty]);

  return (
    <div className="flex flex-col sm:flex-row items-start gap-6 bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden border">
        <img
          src={item.image ?? "https://via.placeholder.com/150?text=No+Image"}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
            <div className="text-xs text-gray-500">Item Code: <span className="font-mono text-gray-700">{(item as any).sku ?? item.code ?? '-'}</span></div>
            {/* Variant information if available */}
            {/* {item.variantTitle && (
              <div className="text-sm text-gray-600 mt-1">{item.variantTitle}</div>
            )} */}
            {/** Render attributes as labeled, unique lines */}
            {item.attributes && (() => {
              // normalize attributes into {name, value} pairs
              const normalize = (attrs: any): Array<{ name: string; value: string }> => {
                if (!attrs) return [];
                const capitalize = (s: string) => typeof s === 'string' && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s ?? '';

                // helper to extract name/value from an object
                const fromObj = (o: any) => {
                  const name = o?.name ?? o?.attribute_name ?? o?.key ?? o?.label ?? o?.title ?? '';
                  let value = o?.value ?? o?.attribute_value ?? o?.val ?? o?.attribute ?? o?.value_text ?? o?.attributes ?? '';
                  if (Array.isArray(value)) value = value.map(v => (v?.value ?? v)).join(', ');
                  if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
                  return { name: String(name || '').trim(), value: String(value ?? '').trim() };
                };

                if (Array.isArray(attrs)) {
                  return attrs.map((a: any) => {
                    if (typeof a === 'string') {
                      const s = a.trim();
                      // try to split on common separators like '::', ':' or '|'
                      const m = s.match(/^([^:|]+)::?\s*(.+)$/) || s.match(/^([^|]+)\|\s*(.+)$/) || s.match(/^([^:\-]+)-\s*(.+)$/);
                      if (m) return { name: capitalize(m[1].trim()), value: capitalize(m[2].trim()) };
                      // if no separator, treat as value-only
                      return { name: '', value: capitalize(s) };
                    }
                    return fromObj(a);
                  }).map(({ name, value }) => ({ name: name || '', value: value || '' }));
                }

                if (typeof attrs === 'object') {
                  // object map: {Color: 'Red', Size: '5kg'}
                  return Object.entries(attrs).map(([k, v]) => ({ name: capitalize(k), value: String(v ?? '') }));
                }
                return [];
              };

              const raw = normalize(item.attributes) || [];
              // dedupe by name+value using a simple loop to ensure an array
              const seen = new Set<string>();
              const deduped: Array<{ name: string; value: string }> = [];
              for (const cur of raw) {
                const key = `${cur?.name ?? ''}||${cur?.value ?? ''}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  deduped.push({ name: cur?.name ?? '', value: cur?.value ?? '' });
                }
              }

              if (!Array.isArray(deduped) || deduped.length === 0) return null;

              return (
                <div className="text-xs text-gray-500 mt-1">
                  {deduped.map((attr, idx) => (
                    <div key={idx} className="leading-snug">
                      {attr.name ? (
                        <span className="text-gray-600">{attr.name}: </span>
                      ) : null}
                      <span className="font-medium text-gray-800">{attr.value}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition"
            onClick={() => onRemove(item.id)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="mt-3 font-bold text-primary text-xl">
          PKR {item.price.toLocaleString()}
        </p>

        <div className="flex items-center mt-4 gap-3">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              className="p-2 bg-gray-100 hover:bg-gray-200 transition"
              onClick={() => setLocalQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus size={16} />
            </button>
            <span className="px-4 py-2 bg-white font-medium">
              {localQuantity}
            </span>
            <button
              className="p-2 bg-gray-100 hover:bg-gray-200 transition"
              onClick={() => setLocalQuantity((q) => q + 1)}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* ✅ Show Update button only if changed */}
          {localQuantity !== item.qty && (
            <button
              onClick={() => onUpdate(item.id, localQuantity)}
              className="ml-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Update Cart
            </button>
          )}

          {/* ✅ Show checkmark if updated */}
          {updated && (
            <span className="flex items-center text-green-600 font-medium ml-2">
              <Check size={18} className="mr-1" /> Updated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TrustBadge({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center">
      <div className="bg-primary/10 p-3 rounded-full mr-3">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  isDiscount,
}: {
  label: string;
  value: number;
  isDiscount?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${isDiscount ? "text-green-600" : ""}`}
    >
      <span className="text-gray-600">{label}</span>
      <span>
        {isDiscount
          ? `- PKR ${value.toLocaleString()}`
          : `PKR ${value.toLocaleString()}`}
      </span>
    </div>
  );
}
