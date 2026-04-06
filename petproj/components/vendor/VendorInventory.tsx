"use client";
import React, { useState } from "react";
import { Table, Button, Switch, Tag, Typography, Card, InputNumber, Badge, Empty, Space, Modal, Tooltip, message } from "antd";
import { DeleteOutlined, ShoppingCartOutlined, AppstoreOutlined, UnorderedListOutlined, EditOutlined, EyeOutlined, EyeInvisibleOutlined, SyncOutlined } from "@ant-design/icons";
import { VendorInventoryItem } from "../../lib/mockVendorData";

const { Text, Title } = Typography;

interface VendorInventoryProps {
  items: VendorInventoryItem[];
  onUpdate: (items: VendorInventoryItem[]) => void;
}

const VendorInventory: React.FC<VendorInventoryProps> = ({ items, onUpdate }) => {
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null);

  const handleDelete = (inventory_id: number) => {
    Modal.confirm({
      title: "Remove from Store?",
      content: "This product will no longer be visible to your customers. You can add it back later from the Catalogue Browser.",
      okText: "Remove",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        setLoadingActionId(inventory_id);
        setTimeout(() => {
          onUpdate(items.filter(i => i.inventory_id !== inventory_id));
          setLoadingActionId(null);
          message.success("Product removed from your store inventory.");
        }, 600);
      }
    });
  };

  const handlePriceChange = (inventory_id: number, price: number) => {
    setLoadingActionId(inventory_id);
    setTimeout(() => {
      onUpdate(items.map(i => i.inventory_id === inventory_id ? { ...i, selling_price: price } : i));
      setLoadingActionId(null);
    }, 400);
  };

  const handleAvailabilityChange = (inventory_id: number, checked: boolean) => {
    setLoadingActionId(inventory_id);
    setTimeout(() => {
      onUpdate(items.map(i => i.inventory_id === inventory_id ? { ...i, is_available: checked } : i));
      setLoadingActionId(null);
      message.info(checked ? "Product is now live!" : "Product is now hidden from customers.");
    }, 500);
  };

  const columns = [
    {
      title: "Product Details",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: VendorInventoryItem) => (
        <div className={`flex items-center gap-3 transition-opacity duration-300 ${!record.is_available ? 'opacity-50' : 'opacity-100'}`}>
          <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
            {record.image_url ? (
              <img src={record.image_url} alt={text} className={`w-full h-full object-cover ${!record.is_available ? 'grayscale' : ''}`} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">P</div>
            )}
          </div>
          <div>
            <Text strong className={`block line-clamp-1 ${!record.is_available ? 'text-gray-400' : 'text-gray-800'}`}>{text}</Text>
            <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest">{record.sku}</Text>
            {!record.is_available && <Tag className="text-[8px] uppercase font-black bg-gray-200 text-gray-400 border-none mt-1">Inactive</Tag>}
          </div>
        </div>
      )
    },
    {
      title: "Pricing (PKR)",
      dataIndex: "selling_price",
      key: "price",
      render: (price: number, record: VendorInventoryItem) => (
        <Space direction="vertical" size={0}>
           <div className="flex items-center gap-2">
             <InputNumber 
               className="w-28 rounded-xl !text-sm border-gray-200 hover:border-[#a03048] focus:border-[#a03048]"
               value={price} 
               status={record.selling_price > record.original_price ? "warning" : ""}
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
      title: "Discount",
      dataIndex: "discount_percent",
      key: "discount",
      render: (percent: number, record: VendorInventoryItem) => (
        <Badge count={percent > 0 ? `${percent}% OFF` : 0} color={record.is_available ? "#52c41a" : "#d9d9d9"} />
      )
    },
    {
       title: "Availability",
       dataIndex: "is_available",
       key: "status",
       render: (checked: boolean, record: VendorInventoryItem) => (
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
      render: (record: VendorInventoryItem) => (
        <Space>
           <Tooltip title="Preview Landing Page">
              <Button type="text" shape="circle" icon={<EyeOutlined className="text-gray-400" />} />
           </Tooltip>
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

  if (items.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed border-2 py-20 text-center bg-transparent">
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-4">
              <Title level={4} className="text-gray-400">Inventory Empty</Title>
              <Text type="secondary" className="block max-w-xs mx-auto">Build your shop inventory by browsing the master catalogue and adding products!</Text>
              <Button 
                icon={<ShoppingCartOutlined />} 
                type="primary" 
                className="bg-[#a03048] border-none px-8 rounded-xl h-12 font-bold"
              >
                Go to Catalogue
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-red-900/5 flex flex-col md:flex-row justify-between items-center gap-6 border border-gray-100/50">
        <div className="text-center md:text-left">
           <Title level={3} className="!mb-1">My Pet Shop Inventory</Title>
           <Text className="text-gray-500 font-medium font-serif italic italic text-sm">Fine-tune your pricing and showcase the best products.</Text>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="bg-gray-50 px-6 py-3 rounded-2xl text-center flex-1 md:flex-none border border-gray-100">
              <Text type="secondary" className="block text-[10px] uppercase font-bold tracking-widest mb-1">Live Listings</Text>
              <Title level={4} className="!mb-0 text-[#a03048]">{items.filter(i => i.is_available).length}</Title>
           </div>
           <Button icon={<EyeOutlined />} type="primary" className="bg-[#a03048] border-none rounded-2xl h-14 px-8 font-bold shadow-lg shadow-red-900/10">View My Storefront</Button>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-2xl shadow-red-900/5 overflow-hidden">
        <Table 
          dataSource={items} 
          columns={columns} 
          rowKey="inventory_id" 
          pagination={{ pageSize: 12, className: "custom-pagination px-4" }}
          className="vendor-inventory-table"
        />
      </Card>

      <style jsx global>{`
        .vendor-inventory-table .ant-table-thead > tr > th {
          background-color: transparent !important;
          border-bottom: 2px solid #f9fafb !important;
          color: #9ca3af !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 24px 16px !important;
        }
        .vendor-inventory-table .ant-table-tbody > tr > td {
          padding: 20px 16px !important;
          border-bottom: 1px solid #f9fafb !important;
        }
        .vendor-inventory-table .ant-table-row:hover {
          background-color: #fafbfc !important;
        }
      `}</style>
    </div>
  );
};

export default VendorInventory;
