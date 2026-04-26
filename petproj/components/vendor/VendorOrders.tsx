"use client";
import React, { useState, useEffect } from "react";
import { Table, Button, Tag, Typography, Card, Space, Badge, Modal, List, Divider, message, Select, Spin } from "antd";
import { 
  CheckCircleOutlined, 
  SyncOutlined, 
  CarOutlined, 
  HomeOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  EyeOutlined
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface VendorOrdersProps {
  orders: any[];
  onUpdateStatus: () => void;
}

const VendorOrders: React.FC<VendorOrdersProps> = ({ orders: initialOrders, onUpdateStatus }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('Out of stock');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/vendors/orders');
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: number, nextStatus: string, reason?: string) => {
    setLoadingOrderId(orderId);
    try {
      const res = await fetch(`/api/v1/vendors/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, ...(reason && { cancellation_reason: reason }) })
      });

      if (res.ok) {
        message.success(`Order status updated to ${nextStatus}`);
        setIsCancelModalOpen(false);
        fetchOrders();
        onUpdateStatus();
      } else {
        throw new Error();
      }
    } catch {
      message.error("Failed to update status");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending': return <Tag color="warning" icon={<SyncOutlined spin />}>Pending</Tag>;
      case 'confirmed': return <Tag color="processing">Confirmed</Tag>;
      case 'preparing': return <Tag color="blue" icon={<SyncOutlined spin />}>Preparing</Tag>;
      case 'dispatched': return <Tag color="purple" icon={<CarOutlined />}>Dispatched</Tag>;
      case 'delivered': return <Tag color="success" icon={<CheckCircleOutlined />}>Delivered</Tag>;
      case 'cancelled': return <Tag color="error">Cancelled</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const renderActions = (record: any) => {
    const isUpdating = loadingOrderId === record.vendor_order_id;

    if (record.status === 'pending') {
      return (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            className="bg-green-600 border-none rounded-lg"
            loading={isUpdating}
            onClick={() => handleStatusUpdate(record.vendor_order_id, 'confirmed')}
          >
            Confirm
          </Button>
          <Button 
            danger 
            size="small" 
            loading={isUpdating}
            onClick={() => {
              setCancellingOrderId(record.vendor_order_id);
              setIsCancelModalOpen(true);
            }}
          >
            Cancel
          </Button>
        </Space>
      );
    }
    if (record.status === 'confirmed') {
      return (
        <Button 
          type="primary" 
          size="small" 
          className="bg-blue-600 border-none rounded-lg"
          loading={isUpdating}
          onClick={() => handleStatusUpdate(record.vendor_order_id, 'preparing')}
        >
          Start Preparing
        </Button>
      );
    }
    if (record.status === 'preparing') {
      return (
        <Button 
          type="primary" 
          size="small" 
          className="bg-purple-600 border-none rounded-lg"
          icon={<CarOutlined />}
          loading={isUpdating}
          onClick={() => handleStatusUpdate(record.vendor_order_id, 'dispatched')}
        >
          Dispatch
        </Button>
      );
    }
    if (record.status === 'dispatched') {
      return (
        <Button 
          type="primary" 
          size="small" 
          className="bg-green-700 border-none rounded-lg"
          icon={<HomeOutlined />}
          loading={isUpdating}
          onClick={() => handleStatusUpdate(record.vendor_order_id, 'delivered')}
        >
          Delivered
        </Button>
      );
    }
    return <Text type="secondary" className="text-xs italic">Complete</Text>;
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "vendor_order_id",
      key: "vendor_order_id",
      render: (id: number, record: any) => (
        <div>
          <Text strong className="block">#VO-{id}</Text>
          <Text type="secondary" className="text-[10px]">
            {new Date(record.created_at).toLocaleString()}
          </Text>
        </div>
      )
    },
    {
      title: "Customer",
      dataIndex: "customer_name",
      key: "customer",
      render: (text: string, record: any) => (
        <div>
           <Text strong className="block text-xs">{text}</Text>
           <Text type="secondary" className="text-[10px]"><PhoneOutlined /> {record.customer_phone}</Text>
        </div>
      )
    },
    {
      title: "Amount",
      dataIndex: "total",
      key: "total",
      render: (total: number) => <Text strong>PKR {total}</Text>
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status)
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: any) => (
        <Space>
           {renderActions(record)}
           <Button 
            shape="circle" 
            icon={<EyeOutlined />} 
            onClick={() => setSelectedOrder(record)} 
           />
        </Space>
      )
    }
  ];

  if (loading) return <div className="p-20 text-center"><Spin tip="Loading orders..." /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-2xl border-none shadow-sm shadow-red-900/5 bg-white">
            <Text type="secondary" className="text-xs uppercase font-bold tracking-widest block mb-2">New Orders</Text>
            <Title level={2} className="!mb-0 text-[#a03048]">{orders.filter(o => o.status === 'pending').length}</Title>
         </Card>
         <Card className="rounded-2xl border-none shadow-sm shadow-green-900/5 bg-white">
            <Text type="secondary" className="text-xs uppercase font-bold tracking-widest block mb-2">In Progress</Text>
            <Title level={2} className="!mb-0 text-blue-600">{orders.filter(o => ['confirmed', 'preparing', 'dispatched'].includes(o.status)).length}</Title>
         </Card>
         <Card className="rounded-2xl border-none shadow-sm shadow-blue-900/5 bg-white">
            <Text type="secondary" className="text-xs uppercase font-bold tracking-widest block mb-2">Total Received</Text>
            <Title level={2} className="!mb-0 text-gray-800">{orders.length}</Title>
         </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-md shadow-red-900/5 overflow-hidden">
        <Table 
          dataSource={orders} 
          columns={columns} 
          rowKey="vendor_order_id" 
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={<Title level={4}>Order Details</Title>}
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={[
          <Button key="close" type="primary" className="bg-[#a03048] border-none" onClick={() => setSelectedOrder(null)}>
            Close
          </Button>
        ]}
        width={500}
      >
        {selectedOrder && (
          <div className="py-4">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <Text type="secondary" className="block text-xs uppercase font-bold">Status</Text>
                  {getStatusTag(selectedOrder.status)}
               </div>
               <div className="text-right">
                  <Text type="secondary" className="block text-xs uppercase font-bold">Total Amount</Text>
                  <Text strong className="text-[#a03048]">PKR {selectedOrder.total}</Text>
               </div>
            </div>

            <Divider orientation="left" className="!text-xs !font-bold">Customer Info</Divider>
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl mb-6">
               <Text strong className="block">{selectedOrder.customer_name}</Text>
               <Text className="block text-sm">Phone: {selectedOrder.customer_phone}</Text>
               <Text className="block text-sm">Email: {selectedOrder.customer_email}</Text>
               {selectedOrder.shipping_address && (
                  <Text className="block text-sm">Address: {typeof selectedOrder.shipping_address === 'string' ? selectedOrder.shipping_address : JSON.stringify(selectedOrder.shipping_address)}</Text>
               )}
            </div>

            <Divider orientation="left" className="!text-xs !font-bold">Order Items</Divider>
            <List
              dataSource={selectedOrder.items || []}
              renderItem={(item: any) => (
                <List.Item className="!py-2">
                  <div className="flex justify-between w-full text-sm">
                    <span><Text strong>{item.quantity}x</Text> {item.product_title}</span>
                    <Text strong>PKR {item.total_price}</Text>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      {/* Cancellation Reason Modal */}
      <Modal
        title="Cancel Order"
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        onOk={() => handleStatusUpdate(cancellingOrderId!, 'cancelled', cancelReason)}
        okText="Confirm Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="py-4">
          <Text className="block mb-2">Please select a cancellation reason:</Text>
          <Select 
            className="w-full"
            value={cancelReason}
            onChange={setCancelReason}
          >
            <Select.Option value="Out of stock">Out of stock</Select.Option>
            <Select.Option value="Cannot deliver to this area">Cannot deliver to this area</Select.Option>
            <Select.Option value="Pricing error">Pricing error</Select.Option>
            <Select.Option value="Other">Other</Select.Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default VendorOrders;
