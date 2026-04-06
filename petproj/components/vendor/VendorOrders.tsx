"use client";
import React, { useState } from "react";
import { Table, Button, Tag, Typography, Card, Space, Badge, Modal, List, Divider, message } from "antd";
import { 
  CheckCircleOutlined, 
  SyncOutlined, 
  CarOutlined, 
  HomeOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  CloseCircleOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { VendorOrder, OrderStatus } from "../../lib/mockVendorData";

const { Text, Title } = Typography;

interface VendorOrdersProps {
  orders: VendorOrder[];
  onUpdateStatus: (orderId: number, status: OrderStatus) => void;
}

const VendorOrders: React.FC<VendorOrdersProps> = ({ orders, onUpdateStatus }) => {
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  const handleStatusUpdate = (orderId: number, nextStatus: OrderStatus) => {
    setLoadingOrderId(orderId);
    // Simulate loading/network delay for UX
    setTimeout(() => {
      onUpdateStatus(orderId, nextStatus);
      setLoadingOrderId(null);
      message.success(`Order status updated to ${nextStatus}`);
    }, 800);
  };

  const getStatusTag = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Tag color="warning" icon={<SyncOutlined spin />}>Pending</Tag>;
      case 'accepted': return <Tag color="processing">Accepted</Tag>;
      case 'preparing': return <Tag color="blue" icon={<SyncOutlined spin />}>Preparing</Tag>;
      case 'dispatched': return <Tag color="purple" icon={<CarOutlined />}>On the Way</Tag>;
      case 'delivered': return <Tag color="success" icon={<CheckCircleOutlined />}>Delivered</Tag>;
      case 'cancelled': return <Tag color="error">Cancelled</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const renderActions = (record: VendorOrder) => {
    const isUpdating = loadingOrderId === record.order_id;

    if (record.status === 'pending') {
      return (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            className="bg-green-600 border-none rounded-lg"
            loading={isUpdating}
            onClick={() => handleStatusUpdate(record.order_id, 'accepted')}
          >
            Accept
          </Button>
          <Button 
            danger 
            size="small" 
            loading={isUpdating}
            onClick={() => handleStatusUpdate(record.order_id, 'cancelled')}
          >
            Reject
          </Button>
        </Space>
      );
    }
    if (record.status === 'accepted') {
      return (
        <Button 
          type="primary" 
          size="small" 
          className="bg-blue-600 border-none rounded-lg"
          loading={isUpdating}
          onClick={() => handleStatusUpdate(record.order_id, 'preparing')}
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
          onClick={() => handleStatusUpdate(record.order_id, 'dispatched')}
        >
          Mark as Dispatched
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
          onClick={() => handleStatusUpdate(record.order_id, 'delivered')}
        >
          Confirm Delivery
        </Button>
      );
    }
    return <Text type="secondary" className="text-xs italic">Order processing complete</Text>;
  };

  const columns = [
    {
      title: "Order #",
      dataIndex: "order_number",
      key: "order_number",
      render: (text: string, record: VendorOrder) => (
        <div>
          <Text strong className="block">{text}</Text>
          <Text type="secondary" className="text-[10px]">
            {new Date(record.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
          </Text>
        </div>
      )
    },
    {
      title: "Customer",
      dataIndex: "customer_name",
      key: "customer",
      render: (text: string, record: VendorOrder) => (
        <div>
           <Text strong className="block text-xs">{text}</Text>
           <Text type="secondary" className="text-[10px]"><PhoneOutlined /> {record.customer_phone}</Text>
        </div>
      )
    },
    {
      title: "Items",
      key: "items",
      render: (record: VendorOrder) => (
        <div className="flex flex-col">
           {record.items.map((it, idx) => (
             <span key={idx} className="text-xs text-gray-600 truncate max-w-[150px]">
                {it.quantity}x {it.product_title}
             </span>
           ))}
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: OrderStatus) => getStatusTag(status)
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: VendorOrder) => (
        <Space>
           {renderActions(record)}
           <Button 
            shape="circle" 
            icon={<EyeOutlined />} 
            onClick={() => setSelectedOrder(record)} 
            className="hover:border-[#a03048] hover:text-[#a03048]"
           />
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-2xl border-none shadow-sm shadow-red-900/5 bg-white">
            <Text type="secondary" className="text-xs uppercase font-bold tracking-widest block mb-2">New Orders</Text>
            <Title level={2} className="!mb-0 text-[#a03048]">{orders.filter(o => o.status === 'pending').length}</Title>
         </Card>
         <Card className="rounded-2xl border-none shadow-sm shadow-green-900/5 bg-white">
            <Text type="secondary" className="text-xs uppercase font-bold tracking-widest block mb-2">In Progress</Text>
            <Title level={2} className="!mb-0 text-blue-600">{orders.filter(o => ['accepted', 'preparing', 'dispatched'].includes(o.status)).length}</Title>
         </Card>
         <Card className="rounded-2xl border-none shadow-sm shadow-blue-900/5 bg-white">
            <Text type="secondary" className="text-xs uppercase font-bold tracking-widest block mb-2">Total Today</Text>
            <Title level={2} className="!mb-0 text-gray-800">{orders.length}</Title>
         </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-md shadow-red-900/5 overflow-hidden">
        <Table 
          dataSource={orders} 
          columns={columns} 
          rowKey="order_id" 
          pagination={{ pageSize: 8 }}
          className="custom-order-table"
        />
      </Card>

      <Modal
        title={<Title level={4}>Order Details: {selectedOrder?.order_number}</Title>}
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
                  <Text type="secondary" className="block text-xs uppercase font-bold">Order Time</Text>
                  <Text strong>{new Date(selectedOrder.created_at).toLocaleTimeString()}</Text>
               </div>
            </div>

            <Divider orientation="left" className="!text-xs !font-bold">Customer Info</Divider>
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl mb-6">
               <div className="flex gap-3">
                  <PhoneOutlined className="text-[#a03048] mt-1" />
                  <div>
                    <Text strong className="block">{selectedOrder.customer_name}</Text>
                    <Text className="text-sm">{selectedOrder.customer_phone}</Text>
                  </div>
               </div>
               <div className="flex gap-3">
                  <EnvironmentOutlined className="text-[#a03048] mt-1" />
                  <div>
                    <Text strong className="block">Delivery Address</Text>
                    <Text className="text-sm text-gray-600">{selectedOrder.address_summary}</Text>
                  </div>
               </div>
            </div>

            <Divider orientation="left" className="!text-xs !font-bold">Order Items</Divider>
            <List
              dataSource={selectedOrder.items}
              renderItem={(item) => (
                <List.Item className="!py-2">
                  <div className="flex justify-between w-full text-sm">
                    <span><Text strong>{item.quantity}x</Text> {item.product_title}</span>
                    <Text strong>PKR {item.price * item.quantity}</Text>
                  </div>
                </List.Item>
              )}
            />
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
               <Title level={4} className="!mb-0">Grand Total</Title>
               <Title level={3} className="!mb-0 text-[#a03048]">PKR {selectedOrder.total_amount}</Title>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VendorOrders;
