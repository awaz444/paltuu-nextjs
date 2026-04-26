"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Switch, Tag, Typography, Card, InputNumber, Badge, Empty, Space, Modal, Tooltip, message, Input, Spin } from "antd";
import { DeleteOutlined, ShoppingCartOutlined, EditOutlined, EyeOutlined, SyncOutlined, PlusOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface VendorInventoryProps {
  items: any[];
  onUpdate: () => void;
}

const VendorInventory: React.FC<VendorInventoryProps> = ({ items: initialItems, onUpdate }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null);

  // Custom Product Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customSku, setCustomSku] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [stockCount, setStockCount] = useState<number | undefined>(undefined);
  const [savingCustom, setSavingCustom] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/vendors/inventory');
      const data = await res.json();
      if (res.ok) {
        setItems(data);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = (inventory_id: number) => {
    Modal.confirm({
      title: "Remove from Store?",
      content: "This product will no longer be visible to your customers.",
      okText: "Remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setLoadingActionId(inventory_id);
        try {
          const res = await fetch(`/api/v1/vendors/inventory/${inventory_id}`, { method: 'DELETE' });
          if (res.ok) {
            message.success("Product removed from inventory");
            fetchInventory();
            onUpdate();
          } else {
            throw new Error();
          }
        } catch {
          message.error("Failed to remove product");
        } finally {
          setLoadingActionId(null);
        }
      }
    });
  };

  const handlePriceChange = async (inventory_id: number, price: number) => {
    setLoadingActionId(inventory_id);
    try {
      const res = await fetch(`/api/v1/vendors/inventory/${inventory_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selling_price: price })
      });
      if (res.ok) {
        setItems(items.map(i => i.inventory_id === inventory_id ? { ...i, selling_price: price } : i));
      }
    } catch {
      message.error("Failed to update price");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleAvailabilityChange = async (inventory_id: number, checked: boolean) => {
    setLoadingActionId(inventory_id);
    try {
      const res = await fetch(`/api/v1/vendors/inventory/${inventory_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: checked })
      });
      if (res.ok) {
        setItems(items.map(i => i.inventory_id === inventory_id ? { ...i, is_available: checked } : i));
        message.info(checked ? "Product is now live!" : "Product is now hidden.");
      }
    } catch {
      message.error("Failed to update status");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleAddCustomProduct = async () => {
    if (!customTitle || sellingPrice === undefined) {
      message.error("Title and selling price are required");
      return;
    }

    setSavingCustom(true);
    try {
      const res = await fetch('/api/v1/vendors/inventory/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_title: customTitle,
          custom_sku: customSku,
          custom_description: customDescription,
          custom_image_url: customImageUrl,
          selling_price: sellingPrice,
          original_price: originalPrice,
          stock_count: stockCount || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      message.success("Custom product submitted successfully");
      setIsCustomModalOpen(false);
      setCustomTitle('');
      setCustomSku('');
      setCustomDescription('');
      setCustomImageUrl('');
      setSellingPrice(0);
      setOriginalPrice(0);
      setStockCount(undefined);
      fetchInventory();
      onUpdate();
    } catch (err: any) {
      message.error(err.message || "Failed to save custom product");
    } finally {
      setSavingCustom(false);
    }
  };

  const columns = [
    {
      title: "Product Details",
      dataIndex: "product_title",
      key: "title",
      render: (text: string, record: any) => {
        const titleText = text || record.custom_title;
        const imageUrl = record.images?.[0] || record.custom_image_url;
        const isCustom = !record.product_id;

        return (
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${!record.is_available ? 'opacity-50' : 'opacity-100'}`}>
            <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
              {imageUrl ? (
                <img src={imageUrl} alt={titleText} className={`w-full h-full object-cover ${!record.is_available ? 'grayscale' : ''}`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">P</div>
              )}
            </div>
            <div>
              <Text strong className={`block line-clamp-1 ${!record.is_available ? 'text-gray-400' : 'text-gray-800'}`}>{titleText}</Text>
              <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest">{record.product_sku || record.custom_sku || 'NO SKU'}</Text>
              {isCustom && <Tag color="orange" className="text-[8px] uppercase font-bold mt-1">Custom</Tag>}
            </div>
          </div>
        );
      }
    },
    {
      title: "Pricing (PKR)",
      dataIndex: "selling_price",
      key: "price",
      render: (price: number, record: any) => (
        <Space direction="vertical" size={0}>
           <div className="flex items-center gap-2">
             <InputNumber 
               className="w-28 rounded-xl !text-sm border-gray-200 hover:border-[#a03048] focus:border-[#a03048]"
               value={price} 
               onChange={(val) => handlePriceChange(record.inventory_id, val || 0)} 
               prefix={<span className="text-[10px] text-gray-400">Rs</span>}
             />
             {loadingActionId === record.inventory_id && <SyncOutlined spin className="text-[#a03048] text-xs" />}
           </div>
           {record.original_price > price && (
             <Text delete className="text-[10px] text-gray-400 ml-1">
               List: {record.original_price}
             </Text>
           )}
        </Space>
      )
    },
    {
      title: "Availability",
      dataIndex: "is_available",
      key: "status",
      render: (checked: boolean, record: any) => (
        <div className="flex flex-col items-center gap-1">
          <Switch 
             checked={checked} 
             size="small" 
             onChange={(val) => handleAvailabilityChange(record.inventory_id, val)}
             className={checked ? "bg-[#a03048]" : "bg-gray-200"}
             loading={loadingActionId === record.inventory_id}
          />
          <Text className={`text-[9px] font-bold uppercase ${checked ? 'text-green-600' : 'text-gray-400'}`}>
             {checked ? 'Public' : 'Hidden'}
          </Text>
        </div>
      )
    },
    {
      title: "Actions",
      key: "action",
      render: (record: any) => (
        <Space>
           <Tooltip title="Remove Listing">
              <Button 
                danger 
                type="text" 
                shape="circle"
                icon={<DeleteOutlined />} 
                onClick={() => handleDelete(record.inventory_id)}
                loading={loadingActionId === record.inventory_id}
              />
           </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) return <div className="p-20 text-center"><Spin tip="Loading inventory..." /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-red-900/5 flex flex-col md:flex-row justify-between items-center gap-6 border border-gray-100/50">
        <div className="text-center md:text-left">
           <Title level={3} className="!mb-1">My Pet Shop Inventory</Title>
           <Text className="text-gray-500 font-medium italic text-sm">Manage pricing and add custom items to your store.</Text>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="bg-gray-50 px-6 py-3 rounded-2xl text-center flex-1 md:flex-none border border-gray-100">
              <Text type="secondary" className="block text-[10px] uppercase font-bold tracking-widest mb-1">Live Listings</Text>
              <Title level={4} className="!mb-0 text-[#a03048]">{items.filter(i => i.is_available).length}</Title>
           </div>
           <Button 
             icon={<PlusOutlined />} 
             type="primary" 
             className="bg-[#a03048] border-none rounded-2xl h-14 px-8 font-bold shadow-lg shadow-red-900/10"
             onClick={() => setIsCustomModalOpen(true)}
           >Add Custom Product</Button>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-2xl shadow-red-900/5 overflow-hidden">
        {items.length === 0 ? (
          <Empty description="No products in your inventory. Add from the Catalogue!" />
        ) : (
          <Table 
            dataSource={items} 
            columns={columns} 
            rowKey="inventory_id" 
            pagination={{ pageSize: 12 }}
          />
        )}
      </Card>

      {/* Add Custom Product Modal */}
      <Modal
        title="Add Custom Product"
        open={isCustomModalOpen}
        onCancel={() => setIsCustomModalOpen(false)}
        onOk={handleAddCustomProduct}
        okButtonProps={{ loading: savingCustom, className: 'bg-[#a03048] border-none' }}
        okText="Add to Store"
      >
        <Space direction="vertical" className="w-full mt-4" size="middle">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Product Title *</label>
            <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. Premium Cat Leash" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">SKU</label>
            <Input value={customSku} onChange={(e) => setCustomSku(e.target.value)} placeholder="e.g. CAT-LEASH-01" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image URL</label>
            <Input value={customImageUrl} onChange={(e) => setCustomImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Selling Price (PKR) *</label>
            <InputNumber className="w-full" value={sellingPrice} onChange={(val) => setSellingPrice(val || 0)} min={0} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Original Price (PKR)</label>
            <InputNumber className="w-full" value={originalPrice} onChange={(val) => setOriginalPrice(val || 0)} min={0} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Initial Stock</label>
            <InputNumber className="w-full" value={stockCount} onChange={(val) => setStockCount(val || undefined)} min={0} placeholder="Unlimited" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
            <Input.TextArea value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} rows={3} placeholder="Describe your product..." />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default VendorInventory;
