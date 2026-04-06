"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { initialMockVendorData, VendorData } from "../../lib/mockVendorData";
import { Button, Input, Select, InputNumber, Card, message, Divider } from "antd";
import { SyncOutlined } from "@ant-design/icons";

const MapDrawingTool = dynamic(() => import("./MapDrawingTool"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center rounded-xl font-bold text-gray-400">Loading Map Area...</div>,
});

const VendorSettings: React.FC = () => {
  const [data, setData] = useState<VendorData>(initialMockVendorData);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      message.success("Official settings saved successfully (Mock)");
      console.log("Saved Official Vendor Data:", data);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card title={<span className="text-xl font-bold">Business Profile</span>} className="shadow-lg rounded-2xl border-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name</label>
            <Input 
              size="large"
              value={data.shop_name} 
              onChange={(e) => setData({ ...data, shop_name: e.target.value })} 
              placeholder="e.g. Paltuu Pet Marketplace"
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
            <Select 
              size="large"
              className="w-full rounded-lg"
              value={data.city_id}
              onChange={(val) => setData({ ...data, city_id: val })}
              options={[
                { value: 1, label: 'Islamabad' },
                { value: 2, label: 'Lahore' },
                { value: 3, label: 'Karachi' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Area / Locality</label>
            <Input 
              size="large"
              value={data.area} 
              onChange={(e) => setData({ ...data, area: e.target.value })} 
              placeholder="e.g. DHA Phase 6"
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
            <Input 
              size="large"
              value={data.contact_number} 
              onChange={(e) => setData({ ...data, contact_number: e.target.value })} 
              placeholder="+92 333 1122334"
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number</label>
            <Input 
              size="large"
              value={data.whatsapp_number} 
              onChange={(e) => setData({ ...data, whatsapp_number: e.target.value })} 
              placeholder="+92 300 5566778"
              className="rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address</label>
            <Input.TextArea 
              size="large"
              value={data.address} 
              onChange={(e) => setData({ ...data, address: e.target.value })} 
              placeholder="Full physical address for delivery pickup"
              rows={3}
              className="rounded-lg"
            />
          </div>
        </div>
      </Card>

      <Card title={<span className="text-xl font-bold">Delivery & Platform Fees</span>} className="shadow-lg rounded-2xl border-none">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Flat Delivery Fee (PKR)</label>
            <InputNumber 
              size="large"
              className="w-full rounded-lg"
              min={0}
              value={data.flat_delivery_fee} 
              onChange={(val) => setData({ ...data, flat_delivery_fee: val || 0 })} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Per-kg Fee (PKR)</label>
            <InputNumber 
              size="large"
              className="w-full rounded-lg"
              min={0}
              value={data.per_kg_delivery_fee} 
              onChange={(val) => setData({ ...data, per_kg_delivery_fee: val || 0 })} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Weight (kg)</label>
            <InputNumber 
              size="large"
              className="w-full rounded-lg"
              min={0}
              value={data.max_delivery_weight_kg} 
              onChange={(val) => setData({ ...data, max_delivery_weight_kg: val || 0 })} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Free Threshold (PKR)</label>
            <InputNumber 
              size="large"
              className="w-full rounded-lg"
              min={0}
              value={data.free_delivery_threshold} 
              onChange={(val) => setData({ ...data, free_delivery_threshold: val || 0 })} 
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <Divider />

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between mb-8">
          <div>
            <h4 className="font-bold text-gray-800">Platform Fee</h4>
            <p className="text-sm text-gray-500">Standard commission on every sale</p>
          </div>
          <div className="text-2xl font-black text-[#a03048]">
            {data.platform_fee_percent}%
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Boundary (Draw on Map)</label>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 flex items-center gap-3">
            <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">!</div>
            <p className="text-sm text-blue-700">Define your service area by drawing a boundary on the map. Orders from outside this area will not be accepted.</p>
          </div>
          <MapDrawingTool 
            initialArea={data.delivery_polygon} 
            onChange={(area) => setData({ ...data, delivery_polygon: area })} 
          />
        </div>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          type="primary" 
          size="large" 
          loading={saving} 
          onClick={handleSave}
          className="bg-[#a03048] border-none hover:opacity-90 h-14 px-12 rounded-2xl text-lg font-bold shadow-xl shadow-red-900/10"
        >
          Save Configurations
        </Button>
      </div>
    </div>
  );
};

export default VendorSettings;
