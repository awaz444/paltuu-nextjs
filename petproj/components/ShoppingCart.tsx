import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X, Package } from 'lucide-react';

interface CartItem {
  cart_item_id: number;
  product_id: number;
  variant_id?: number;
  quantity: number;
  product_title: string;
  product_price: number;
  variant_title?: string;
  variant_price?: number;
  effective_price: number;
  image_url?: string;
  product_stock: number;
  variant_stock?: number;
}

interface Cart {
  cart_id: number;
  user_id?: number;
  session_id?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

interface ShoppingCartProps {
  userId?: number;
  sessionId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingCartComponent: React.FC<ShoppingCartProps> = ({
  userId,
  sessionId,
  isOpen,
  onClose,
}) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && (userId || sessionId)) {
      fetchCart();
    }
  }, [isOpen, userId, sessionId]);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId.toString());
      if (sessionId) params.append('sessionId', sessionId);

      const response = await fetch(`/api/bazaar/cart?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCart(data.cart);
        setItems(data.items);
      } else {
        setError(data.error || 'Failed to fetch cart');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    try {
      const response = await fetch('/api/v1/bazaar/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity: newQuantity }),
      });

      if (response.ok) {
        if (newQuantity <= 0) {
          setItems(items.filter(item => item.cart_item_id !== cartItemId));
        } else {
          setItems(items.map(item =>
            item.cart_item_id === cartItemId
              ? { ...item, quantity: newQuantity }
              : item
          ));
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update quantity');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      const response = await fetch(`/api/bazaar/cart?cartItemId=${cartItemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(items.filter(item => item.cart_item_id !== cartItemId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove item');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.effective_price * item.quantity), 0);
  };

  const handleCheckout = () => {
    // Redirect to checkout page or open checkout modal
    window.location.href = '/bazaar/checkout';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Shopping Cart</h2>
              {items.length > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  {items.length}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-gray-100"
              title="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading cart...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-red-600">
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={fetchCart}
                    className="mt-2 text-xs underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Your cart is empty</p>
                  <p className="text-xs">Add some products to get started</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.cart_item_id} className="flex space-x-3 border-b pb-4">
                    {/* Product Image */}
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_title}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.product_title}
                      </h3>
                      {item.variant_title && (
                        <p className="text-xs text-gray-500">{item.variant_title}</p>
                      )}
                      <p className="text-sm font-medium text-gray-900">
                        PKR {item.effective_price.toLocaleString()}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                          className="rounded-md border p-1 hover:bg-gray-50"
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="rounded-md border p-1 hover:bg-gray-50"
                          disabled={item.quantity >= (item.variant_stock || item.product_stock)}
                          title="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.cart_item_id)}
                          className="ml-auto rounded-md p-1 text-red-600 hover:bg-red-50"
                          title="Remove item"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>PKR {calculateTotal().toLocaleString()}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full rounded-md bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCartComponent;
