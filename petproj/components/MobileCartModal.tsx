"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import {
  updateCartItem,
  removeCartItem,
  setCartItems,
} from "@/app/store/slices/cartSlice";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface MobileCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileCartModal = ({ isOpen, onClose }: MobileCartModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const cartState = useSelector((state: RootState) => state.cart);
  const cartItems = cartState.items ?? [];

  const [loadingItems, setLoadingItems] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [updatedItems, setUpdatedItems] = useState<string[]>([]);
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Initialize local quantities
  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    cartItems.forEach((item) => {
      const key = `${item.id}-${item.variantTitle ?? ""}-${JSON.stringify(item.attributes ?? [])}`;
      initialQuantities[key] = item.qty;
    });
    setLocalQuantities(initialQuantities);
  }, [cartItems]);

  // ✅ Variant-safe quantity handler
  const handleQuantityChange = (key: string, newQty: number) => {
    if (newQty < 1) return;
    setLocalQuantities((prev) => ({
      ...prev,
      [key]: newQty,
    }));
  };

  // ✅ Variant-safe update
  const updateQuantity = async (item: any, key: string) => {
    if (loadingItems[key]) return;
    setLoadingItems((prev) => ({ ...prev, [key]: true }));

    try {
      await dispatch(
        updateCartItem({
          cartItemId: item.id,
          quantity: localQuantities[key],
        }) as any
      );

      dispatch(
        setCartItems(
          cartItems.map((i) => {
            const itemKey = `${i.id}-${i.variantTitle ?? ""}-${JSON.stringify(
              i.attributes ?? []
            )}`;
            return itemKey === key ? { ...i, qty: localQuantities[key] } : i;
          })
        )
      );

      setUpdatedItems((prev) => [...prev, key]);
      setTimeout(
        () => setUpdatedItems((prev) => prev.filter((k) => k !== key)),
        2000
      );
    } catch (err) {
      toast.error("Failed to update quantity. Try again.");
      console.error(err);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ✅ Variant-safe delete
  const confirmRemoveItem = (item: any) => {
    const key = `${item.id}-${item.variantTitle ?? ""}-${JSON.stringify(
      item.attributes ?? []
    )}`;
    setItemToDelete(key);
  };

  const cancelRemoveItem = () => setItemToDelete(null);

  const removeItem = async () => {
    if (!itemToDelete) return;

    const item = cartItems.find((i) => {
      const key = `${i.id}-${i.variantTitle ?? ""}-${JSON.stringify(
        i.attributes ?? []
      )}`;
      return key === itemToDelete;
    });

    if (!item) return;

    const key = itemToDelete;
    setLoadingItems((prev) => ({ ...prev, [key]: true }));

    try {
      await dispatch(removeCartItem({ cartItemId: item.id }) as any);

      dispatch(
        setCartItems(
          cartItems.filter((i) => {
            const k = `${i.id}-${i.variantTitle ?? ""}-${JSON.stringify(
              i.attributes ?? []
            )}`;
            return k !== itemToDelete;
          })
        )
      );

      toast.success("Item removed from cart");
    } catch (err) {
      toast.error("Failed to remove item");
      console.error(err);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [key]: false }));
      setItemToDelete(null);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const key = `${item.id}-${item.variantTitle ?? ""}-${JSON.stringify(
      item.attributes ?? []
    )}`;
    const qty = localQuantities[key] || item.qty;
    return sum + item.price * qty;
  }, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[9998] lg:hidden transform transition-transform duration-300 max-h-[70vh] overflow-hidden flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">
            Your Cart ({cartItems.length} items)
          </h2>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Your cart is empty
            </p>
          ) : (
            <div className="space-y-4 py-2">
              {cartItems.map((item, index) => {
                const key = `${item.id}-${item.variantTitle ?? ""}-${JSON.stringify(
                  item.attributes ?? []
                )}`;
                const qty = localQuantities[key] || item.qty;
                const hasChanged = qty !== item.qty;

                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 py-2 border-b border-gray-100"
                  >
                    {/* Image */}
                    <Image
                      src={item.image || "/placeholder-product.jpg"}
                      alt={item.title || "Product"}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>

                      {item.variantTitle && (
                        <p className="text-xs text-gray-500">
                          {item.variantTitle}
                        </p>
                      )}

                      {/* 🧩 Variant attributes */}
                {Array.isArray(item.attributes) && item.attributes.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {item.attributes
                      .map((attr: { name?: string; value?: string }) => `${attr.name ?? ""}: ${attr.value ?? ""}`)
                      .join(", ")}
                  </div>
                )}

                      <p className="text-sm text-gray-600 mt-1">
                        PKR {item.price.toLocaleString()}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => handleQuantityChange(key, qty - 1)}
                          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-sm">{qty}</span>
                        <button
                          onClick={() => handleQuantityChange(key, qty + 1)}
                          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          +
                        </button>

                        {hasChanged && (
                          <button
                            onClick={() => updateQuantity(item, key)}
                            disabled={loadingItems[key]}
                            className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded disabled:opacity-50"
                          >
                            {loadingItems[key] ? "Updating..." : "Update"}
                          </button>
                        )}

                        {updatedItems.includes(key) && (
                          <span className="text-green-600 text-sm ml-2">
                            ✓ Updated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price + Delete */}
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-semibold">
                        PKR {(item.price * qty).toLocaleString()}
                      </p>
                      <button
                        onClick={() => confirmRemoveItem(item)}
                        disabled={loadingItems[key]}
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
            <span className="font-semibold">
              PKR {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                router.push("/cart");
              }}
              className="flex-1 py-3 border border-primary text-primary rounded-lg font-medium"
            >
              View Cart
            </button>
            <button
              onClick={() => {
                onClose();
                router.push("/checkout");
              }}
              className="flex-1 py-3 bg-primary text-white rounded-lg font-medium"
            >
              Checkout
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {itemToDelete && (
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-4">Remove Item</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove this item from your cart?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelRemoveItem}
                  className="flex-1 py-2 border border-primary text-primary rounded-lg font-medium"
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
