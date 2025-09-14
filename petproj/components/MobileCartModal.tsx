"use client";

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import { updateCartItem, removeCartItem, setCartItems } from '@/app/store/slices/cartSlice';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface MobileCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileCartModal = ({ isOpen, onClose }: MobileCartModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const cartState = useSelector((state: RootState) => state.cart);
  const cartItems = cartState.items ?? [];
  const [loadingItems, setLoadingItems] = useState<{ [key: string]: boolean }>({});
  const [updatedItems, setUpdatedItems] = useState<string[]>([]);
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});
  const [itemToDelete, setItemToDelete] = useState<string | number | null>(null);

  // Initialize local quantities when cart items change
  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    cartItems.forEach(item => {
      initialQuantities[String(item.id)] = item.qty;
    });
    setLocalQuantities(initialQuantities);
  }, [cartItems]);

  const updateQuantity = async (itemId: string | number) => {
    const id = String(itemId);
    if (loadingItems[id]) return;

    setLoadingItems((prev) => ({ ...prev, [id]: true }));

    try {
      // Wait for API confirmation
      await dispatch(updateCartItem({ 
        cartItemId: itemId, 
        quantity: localQuantities[id] 
      }) as any);

      // Only update Redux after success
      dispatch(
        setCartItems(
          cartItems.map((item) =>
            item.id === itemId ? { ...item, qty: localQuantities[id] } : item
          )
        )
      );

      // Show checkmark animation
      setUpdatedItems((prev) => [...prev, id]);
      setTimeout(
        () => setUpdatedItems((prev) => prev.filter((itemId) => itemId !== id)),
        2000
      );
    } catch (err) {
      console.error("Failed to update quantity:", err);
      toast.error("Failed to update quantity. Please try again.");
    } finally {
      setLoadingItems((prev) => ({ ...prev, [id]: false }));
    }
  };

  const confirmRemoveItem = (itemId: string | number) => {
    setItemToDelete(itemId);
  };

  const cancelRemoveItem = () => {
    setItemToDelete(null);
  };

  const removeItem = async () => {
    if (!itemToDelete) return;
    
    const id = String(itemToDelete);
    if (loadingItems[id]) return;

    setLoadingItems((prev) => ({ ...prev, [id]: true }));

    try {
      // Wait for API confirmation
      await dispatch(removeCartItem({ cartItemId: itemToDelete }) as any);

      // Only update Redux after success
      dispatch(setCartItems(cartItems.filter((item) => item.id !== itemToDelete)));
      toast.success("Item removed from cart");
    } catch (err) {
      console.error("Failed to remove item:", err);
      toast.error("Failed to remove item. Please try again.");
    } finally {
      setLoadingItems((prev) => ({ ...prev, [id]: false }));
      setItemToDelete(null);
    }
  };

  const handleQuantityChange = (itemId: string | number, newQty: number) => {
    if (newQty < 1) return;
    setLocalQuantities(prev => ({
      ...prev,
      [String(itemId)]: newQty
    }));
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const qty = localQuantities[String(item.id)] || item.qty;
    return sum + item.price * qty;
  }, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[9998] md:hidden transform transition-transform duration-300 max-h-[70vh] overflow-hidden flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Your Cart ({cartItems.length} items)</h2>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Your cart is empty</p>
          ) : (
            <div className="space-y-4 py-2">
              {cartItems.map((item) => {
                const itemId = String(item.id);
                const localQty = localQuantities[itemId] || item.qty;
                const hasChanged = localQty !== item.qty;
                
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <Image
                      src={item.image || '/placeholder-product.jpg'}
                      alt={item.title || 'Product'}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <p className="text-sm text-gray-600">PKR {item.price.toLocaleString()}</p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => handleQuantityChange(item.id, localQty - 1)}
                          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-sm">{localQty}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, localQty + 1)}
                          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          +
                        </button>
                        
                        {hasChanged && (
                          <button
                            onClick={() => updateQuantity(item.id)}
                            disabled={loadingItems[itemId]}
                            className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded disabled:opacity-50"
                          >
                            {loadingItems[itemId] ? 'Updating...' : 'Update'}
                          </button>
                        )}
                        
                        {updatedItems.includes(itemId) && (
                          <span className="text-green-600 text-sm ml-2">✓ Updated</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-semibold">PKR {(item.price * localQty).toLocaleString()}</p>
                      <button
                        onClick={() => confirmRemoveItem(item.id)}
                        disabled={loadingItems[itemId]}
                        className="text-red-500 disabled:opacity-50 p-1"
                        title="Remove item"
                      >
                        <i className="bi bi-trash text-lg"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold">Subtotal:</span>
            <span className="font-semibold">PKR {subtotal.toLocaleString()}</span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                router.push('/cart');
              }}
              className="flex-1 py-3 border border-primary text-primary rounded-lg font-medium"
            >
              View Cart
            </button>
            <button
              onClick={() => {
                onClose();
                router.push('/checkout');
              }}
              className="flex-1 py-3 bg-primary text-white rounded-lg font-medium"
            >
              Checkout
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {itemToDelete && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-4">Remove Item</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to remove this item from your cart?</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelRemoveItem}
                  className="flex-1 py-2 border border-1 border-primary text-primary rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={removeItem}
                  className="flex-1 py-2 bg-primary text-white rounded-lg font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileCartModal;