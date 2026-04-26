"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button, Input, Select, InputNumber, Card, message, Divider, Spin } from "antd";

const MapDrawingTool = dynamic(() => import("./MapDrawingTool"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center rounded-xl font-bold text-gray-400">Loading Map Area...</div>,
});

const VendorSettings: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchVendorProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/vendors/me');
      const profile = await res.json();
      if (res.ok) {
        setData(profile);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load vendor profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/vendors/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: data.shop_name,
          city_id: data.city_id,
          area: data.area,
          contact_number: data.contact_number,
          whatsapp_number: data.whatsapp_number,
          address: data.address,
          flat_delivery_fee: Number(data.flat_delivery_fee || 0),
          per_kg_delivery_fee: Number(data.per_kg_delivery_fee || 0),
          max_delivery_weight_kg: Number(data.max_delivery_weight_kg || 0),
          free_delivery_threshold: Number(data.free_delivery_threshold || 0)
        })
      });

      if (!res.ok) throw new Error();

      // Save polygon separately
      if (data.delivery_polygon) {
        await fetch('/api/v1/vendors/me/polygon', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_polygon: data.delivery_polygon })
        });
      }

      message.success("Settings saved successfully!");
      fetchVendorProfile();
    } catch {
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Spin tip="Loading profile..." /></div>;
  if (!data) return <div className="p-20 text-center text-red-500">Error loading profile data</div>;

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
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
            <Input 
              size="large"
              value={data.contact_number} 
              onChange={(e) => setData({ ...data, contact_number: e.target.value })} 
              className="rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number</label>
            <Input 
              size="large"
              value={data.whatsapp_number} 
              onChange={(e) => setData({ ...data, whatsapp_number: e.target.value })} 
              className="rounded-lg"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address</label>
            <Input.TextArea 
              size="large"
              value={data.address} 
              onChange={(e) => setData({ ...data, address: e.target.value })} 
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
            />
          </div>
        </div>

        <Divider />

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between mb-8">
          <div>
            <h4 className="font-bold text-gray-800">Platform Fee</h4>
            <p className="text-sm text-gray-500">Standard commission on every sale (Controlled by Admin)</p>
          </div>
          <div className="text-2xl font-black text-[#a03048]">
            {data.platform_fee_percent}%
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Boundary (GeoJSON Format)</label>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4 flex items-center gap-3">
            <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">!</div>
            <p className="text-sm text-blue-700">Currently drawn polygon object saved in database.</p>
          </div>
          <Input.TextArea 
             rows={5}
             value={data.delivery_polygon ? JSON.stringify(data.delivery_polygon, null, 2) : ''}
             onChange={(e) => {
                try {
                   setData({ ...data, delivery_polygon: JSON.parse(e.target.value) });
                } catch {
                   // Allow typing, but don't parse invalid json
                }
             }}
             placeholder="Paste your GeoJSON polygon here"
             className="font-mono text-xs p-3 rounded-lg bg-gray-50 border-gray-200"
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
