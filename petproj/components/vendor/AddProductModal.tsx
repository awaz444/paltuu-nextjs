"use client";
import React, { useState, useEffect } from "react";
import { Modal, InputNumber, Switch, Button, Divider, Space, Typography } from "antd";
import { VendorInventoryItem } from "../../lib/mockVendorData";

const { Text, Title } = Typography;

interface AddProductModalProps {
  visible: boolean;
  onCancel: () => void;
  onAdd: (item: VendorInventoryItem) => void;
  product: any; // The master product from the catalogue
}

const AddProductModal: React.FC<AddProductModalProps> = ({ visible, onCancel, onAdd, product }) => {
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [stockCount, setStockCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (product) {
      setSellingPrice(product.price || 0);
      setOriginalPrice(product.price || 0);
      setIsAvailable(true);
    }
  }, [product]);

  const discountPercent = originalPrice > 0 
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) 
    : 0;

  const handleAdd = () => {
    if (!product) return;

    const newItem: VendorInventoryItem = {
      inventory_id: Date.now(), // Mock ID
      product_id: product.product_id,
      title: product.title,
      image_url: product.images?.[0] || "",
      sku: product.sku,
      selling_price: sellingPrice,
      original_price: originalPrice,
      discount_percent: Math.max(0, discountPercent),
      is_available: isAvailable,
      stock_count: stockCount
    };

    onAdd(newItem);
    onCancel();
  };

  return (
    <Modal
      title={<Title level={4}>Add to My Store</Title>}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="submit" type="primary" className="bg-[#a03048] border-none" onClick={handleAdd}>
          Confirm Addition
        </Button>
      ]}
      width={400}
      className="rounded-2xl overflow-hidden"
    >
      <div className="py-4">
        <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-xl">
           {product?.images?.[0] ? (
             <img src={product.images[0]} alt={product.title} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
           ) : (
             <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-400">?</div>
           )}
           <div className="flex-1">
             <Text strong className="block line-clamp-1">{product?.title}</Text>
             <Text type="secondary" className="text-xs uppercase font-bold">{product?.sku}</Text>
           </div>
        </div>

        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">My Selling Price (PKR)</label>
            <InputNumber 
              className="w-full p-1 rounded-lg"
              value={sellingPrice}
              onChange={(val) => setSellingPrice(val || 0)}
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Original Price (Show as crossed out)</label>
            <InputNumber 
              className="w-full p-1 rounded-lg"
              value={originalPrice}
              onChange={(val) => setOriginalPrice(val || 0)}
              min={0}
            />
          </div>

          {discountPercent > 0 && (
            <div className="bg-green-50 text-green-700 p-2 rounded-lg text-center font-bold text-sm">
               Effective Discount: {discountPercent}% OFF
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Stock (Optional)</label>
            <InputNumber 
              className="w-full p-1 rounded-lg"
              value={stockCount}
              onChange={(val) => setStockCount(val || undefined)}
              min={0}
              placeholder="Leave empty for unlimited"
            />
          </div>

          <Divider style={{ margin: "12px 0" }} />

          <div className="flex items-center justify-between">
             <Text strong>Available for Sale</Text>
             <Switch 
               checked={isAvailable} 
               onChange={setIsAvailable} 
               className={isAvailable ? "bg-[#a03048]" : ""} 
             />
          </div>
        </Space>
      </div>
    </Modal>
  );
};

export default AddProductModal;
