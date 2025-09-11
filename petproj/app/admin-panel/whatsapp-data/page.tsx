// app/admin/whatsapp-requests/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Modal, Button, Table, Image, Tag } from "antd";
import { EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";

interface SubmissionPhoto {
  id: string;
  photo_url: string;
  created_at: string;
}

interface NewHomeSubmission {
  id: string;
  city: string;
  pet_type: string;
  breed: string;
  age: string;
  reason: string;
  price: string;
  delivery_interest: boolean;
  contact: string;
  created_at: string;
  photos: SubmissionPhoto[];
}

interface PaymentProof {
  id: string;
  proof_url: string;
  order_number_picture_url: string;
  created_at: string;
}

interface PaymentDetail {
  id: string;
  submission_id: string;
  contact: string;
  created_at: string;
  proofs: PaymentProof[];
  city?: string;
  pet_type?: string;
  breed?: string;
}

interface LostFoundReport {
  id: string;
  city: string;
  type: string;
  pet_name: string;
  breed: string;
  location: string;
  contact: string;
  created_at: string;
  photos: SubmissionPhoto[];
}

interface DeliveryRequest {
  id: string;
  pet_details: string;
  pickup_address: string;
  pickup_contact: string;
  delivery_address: string;
  delivery_contact: string;
  created_at: string;
  photos: SubmissionPhoto[];
}

const WhatsAppRequestsAdmin = () => {
  const [activeTab, setActiveTab] = useState("new-home");
  const [newHomeData, setNewHomeData] = useState<NewHomeSubmission[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentDetail[]>([]);
  const [lostFoundData, setLostFoundData] = useState<LostFoundReport[]>([]);
  const [deliveryData, setDeliveryData] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [newHomeRes, paymentRes, lostFoundRes, deliveryRes] = await Promise.all([
        fetch("/api/admin/whatsapp/new-home"),
        fetch("/api/admin/whatsapp/payment-proofs"),
        fetch("/api/admin/whatsapp/lost-found"),
        fetch("/api/admin/whatsapp/delivery-requests")
      ]);

      if (newHomeRes.ok) setNewHomeData(await newHomeRes.json());
      if (paymentRes.ok) setPaymentData(await paymentRes.json());
      if (lostFoundRes.ok) setLostFoundData(await lostFoundRes.json());
      if (deliveryRes.ok) setDeliveryData(await deliveryRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (record: any, type: string) => {
    setSelectedRecord({ ...record, type });
    setModalVisible(true);
  };

  const handleImagePreview = (url: string) => {
    setPreviewImage(url);
    setImagePreviewVisible(true);
  };

  const newHomeColumns = [
    {
      title: "City",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "Pet Type",
      dataIndex: "pet_type",
      key: "pet_type",
    },
    {
      title: "Breed",
      dataIndex: "breed",
      key: "breed",
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (text: string) => (
        <div className="max-w-xs truncate" title={text}>
          {text}
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Delivery Interest",
      dataIndex: "delivery_interest",
      key: "delivery_interest",
      render: (interest: boolean) => (
        <Tag color={interest ? "green" : "red"}>
          {interest ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
    },
    {
      title: "Photos",
      key: "photos",
      render: (record: NewHomeSubmission) => (
        <div className="flex space-x-1">
          {record.photos?.slice(0, 3).map((photo) => (
            <Image
              key={photo.id}
              width={40}
              height={40}
              src={photo.photo_url}
              alt="Pet photo"
              className="cursor-pointer object-cover rounded"
              preview={{ visible: false }}
              onClick={() => handleImagePreview(photo.photo_url)}
            />
          ))}
          {record.photos?.length > 3 && (
            <Tag>+{record.photos.length - 3} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: NewHomeSubmission) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showModal(record, "new-home")}
        >
          Review
        </Button>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
    },
    {
      title: "Proofs",
      key: "proofs",
      render: (record: PaymentDetail) => (
        <div className="flex space-x-1">
          {record.proofs?.slice(0, 3).map((proof) => (
            <Image
              key={proof.id}
              width={40}
              height={40}
              src={proof.proof_url}
              alt="Payment proof"
              className="cursor-pointer object-cover rounded"
              preview={{ visible: false }}
              onClick={() => handleImagePreview(proof.proof_url)}
            />
          ))}
          {record.proofs?.length > 3 && (
            <Tag>+{record.proofs.length - 3} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: PaymentDetail) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showModal(record, "payment")}
        >
          Review
        </Button>
      ),
    },
  ];

  const lostFoundColumns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "lost" ? "red" : "green"}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Pet Name",
      dataIndex: "pet_name",
      key: "pet_name",
    },
    {
      title: "Breed",
      dataIndex: "breed",
      key: "breed",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
    },
    {
      title: "Photos",
      key: "photos",
      render: (record: LostFoundReport) => (
        <div className="flex space-x-1">
          {record.photos?.slice(0, 3).map((photo) => (
            <Image
              key={photo.id}
              width={40}
              height={40}
              src={photo.photo_url}
              alt="Pet photo"
              className="cursor-pointer object-cover rounded"
              preview={{ visible: false }}
              onClick={() => handleImagePreview(photo.photo_url)}
            />
          ))}
          {record.photos?.length > 3 && (
            <Tag>+{record.photos.length - 3} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: LostFoundReport) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showModal(record, "lost-found")}
        >
          Review
        </Button>
      ),
    },
  ];

  const deliveryColumns = [
    {
      title: "Pet Details",
      dataIndex: "pet_details",
      key: "pet_details",
    },
    {
      title: "Pickup Address",
      dataIndex: "pickup_address",
      key: "pickup_address",
      render: (text: string) => (
        <div className="max-w-xs truncate" title={text}>
          {text}
        </div>
      ),
    },
    {
      title: "Pickup Contact",
      dataIndex: "pickup_contact",
      key: "pickup_contact",
    },
    {
      title: "Delivery Address",
      dataIndex: "delivery_address",
      key: "delivery_address",
      render: (text: string) => (
        <div className="max-w-xs truncate" title={text}>
          {text}
        </div>
      ),
    },
    {
      title: "Delivery Contact",
      dataIndex: "delivery_contact",
      key: "delivery_contact",
    },
    {
      title: "Photos",
      key: "photos",
      render: (record: DeliveryRequest) => (
        <div className="flex space-x-1">
          {record.photos?.slice(0, 3).map((photo) => (
            <Image
              key={photo.id}
              width={40}
              height={40}
              src={photo.photo_url}
              alt="Delivery photo"
              className="cursor-pointer object-cover rounded"
              preview={{ visible: false }}
              onClick={() => handleImagePreview(photo.photo_url)}
            />
          ))}
          {record.photos?.length > 3 && (
            <Tag>+{record.photos.length - 3} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: DeliveryRequest) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showModal(record, "delivery")}
        >
          Review
        </Button>
      ),
    },
  ];

  const renderModalContent = () => {
    if (!selectedRecord) return null;

    switch (selectedRecord.type) {
      case "new-home":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold">City</label>
                <input
                  type="text"
                  value={selectedRecord.city}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Pet Type</label>
                <input
                  type="text"
                  value={selectedRecord.pet_type}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Breed</label>
                <input
                  type="text"
                  value={selectedRecord.breed}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Age</label>
                <input
                  type="text"
                  value={selectedRecord.age}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Reason</label>
                <textarea
                  value={selectedRecord.reason}
                  className="w-full p-2 border rounded"
                  rows={3}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Price</label>
                <input
                  type="text"
                  value={selectedRecord.price}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Delivery Interest</label>
                <input
                  type="text"
                  value={selectedRecord.delivery_interest ? "Yes" : "No"}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Contact</label>
                <input
                  type="text"
                  value={selectedRecord.contact}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-2">Photos</label>
              <div className="grid grid-cols-3 gap-2">
                {selectedRecord.photos?.map((photo: SubmissionPhoto) => (
                  <Image
                    key={photo.id}
                    width={100}
                    height={100}
                    src={photo.photo_url}
                    alt="Pet photo"
                    className="object-cover rounded"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      case "payment":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold">Contact</label>
                <input
                  type="text"
                  value={selectedRecord.contact}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">City</label>
                <input
                  type="text"
                  value={selectedRecord.city || "N/A"}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Pet Type</label>
                <input
                  type="text"
                  value={selectedRecord.pet_type || "N/A"}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Breed</label>
                <input
                  type="text"
                  value={selectedRecord.breed || "N/A"}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-2">Payment Proofs</label>
              <div className="grid grid-cols-3 gap-2">
                {selectedRecord.proofs?.map((proof: PaymentProof) => (
                  <Image
                    key={proof.id}
                    width={100}
                    height={100}
                    src={proof.proof_url}
                    alt="Payment proof"
                    className="object-cover rounded"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      case "lost-found":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold">Type</label>
                <input
                  type="text"
                  value={selectedRecord.type}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Pet Name</label>
                <input
                  type="text"
                  value={selectedRecord.pet_name}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Breed</label>
                <input
                  type="text"
                  value={selectedRecord.breed}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">City</label>
                <input
                  type="text"
                  value={selectedRecord.city}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Location</label>
                <input
                  type="text"
                  value={selectedRecord.location}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Contact</label>
                <input
                  type="text"
                  value={selectedRecord.contact}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-2">Photos</label>
              <div className="grid grid-cols-3 gap-2">
                {selectedRecord.photos?.map((photo: SubmissionPhoto) => (
                  <Image
                    key={photo.id}
                    width={100}
                    height={100}
                    src={photo.photo_url}
                    alt="Pet photo"
                    className="object-cover rounded"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      case "delivery":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block font-semibold">Pet Details</label>
                <input
                  type="text"
                  value={selectedRecord.pet_details}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Pickup Address</label>
                <textarea
                  value={selectedRecord.pickup_address}
                  className="w-full p-2 border rounded"
                  rows={2}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Pickup Contact</label>
                <input
                  type="text"
                  value={selectedRecord.pickup_contact}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold">Delivery Address</label>
                <textarea
                  value={selectedRecord.delivery_address}
                  className="w-full p-2 border rounded"
                  rows={2}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-semibold">Delivery Contact</label>
                <input
                  type="text"
                  value={selectedRecord.delivery_contact}
                  className="w-full p-2 border rounded"
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-2">Photos</label>
              <div className="grid grid-cols-3 gap-2">
                {selectedRecord.photos?.map((photo: SubmissionPhoto) => (
                  <Image
                    key={photo.id}
                    width={100}
                    height={100}
                    src={photo.photo_url}
                    alt="Delivery photo"
                    className="object-cover rounded"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const tabs = [
    {
      key: "new-home",
      label: "New Home Requests",
      content: (
        <Table
          columns={newHomeColumns}
          dataSource={newHomeData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
        />
      ),
    },
    {
      key: "payment",
      label: "Payment Proofs",
      content: (
        <Table
          columns={paymentColumns}
          dataSource={paymentData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: "lost-found",
      label: "Lost & Found",
      content: (
        <Table
          columns={lostFoundColumns}
          dataSource={lostFoundData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
        />
      ),
    },
    {
      key: "delivery",
      label: "Delivery Requests",
      content: (
        <Table
          columns={deliveryColumns}
          dataSource={deliveryData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
        />
      ),
    },
  ];

  return (
    <>
      
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">WhatsApp Requests Management</h1>
        
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`px-6 py-3 font-medium ${
                    activeTab === tab.key
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            {tabs.find((tab) => tab.key === activeTab)?.content}
          </div>
        </div>

        <Modal
          title={`Review ${selectedRecord?.type || "Request"}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setModalVisible(false)}>
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => {
                // Submit logic will go here later
                setModalVisible(false);
              }}
            >
              Approve Request
            </Button>,
          ]}
          width={700}
        >
          {renderModalContent()}
        </Modal>

        <Modal
          visible={imagePreviewVisible}
          footer={null}
          onCancel={() => setImagePreviewVisible(false)}
          width="auto"
        >
          <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
        </Modal>
      </div>
    </>
  );
};

export default WhatsAppRequestsAdmin;