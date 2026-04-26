"use client";
import React, { useEffect, useState } from "react";
import { Spin, Badge, Card } from "antd";
import VendorSettings from "../../components/vendor/VendorSettings";
import CatalogueBrowser from "../../components/vendor/CatalogueBrowser";
import VendorInventory from "../../components/vendor/VendorInventory";
import VendorOrders from "../../components/vendor/VendorOrders";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  UnorderedListOutlined, 
  SettingOutlined, 
  ShopOutlined,
  SearchOutlined,
  FileTextOutlined
} from "@ant-design/icons";

export default function VendorPanel() {
  const { user, isAuthenticated, isHydrating } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'catalogue' | 'settings' | 'orders'>('dashboard');
  const [metrics, setMetrics] = useState({ total_inventory: 0, pending_orders: 0 });

  useEffect(() => {
    if (!isHydrating) {
      if (!isAuthenticated || user?.role !== 'vendor') {
        router.push('/auth');
      }
    }
  }, [isHydrating, isAuthenticated, user, router]);

  const updateMetrics = async () => {
    try {
      const invRes = await fetch('/api/vendor/inventory');
      const invData = await invRes.json();
      
      const orderRes = await fetch('/api/vendor/orders');
      const orderData = await orderRes.json();

      if (invRes.ok && orderRes.ok) {
        setMetrics({
          total_inventory: invData.length,
          pending_orders: orderData.filter((o: any) => o.status === 'pending').length
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'vendor') {
      updateMetrics();
    }
  }, [isAuthenticated, user]);

  if (isHydrating || !isAuthenticated || user?.role !== 'vendor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading Vendor Panel..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">Vendor Panel</h1>
              <Badge status="success" text="Verified Business" className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100" />
            </div>
            <p className="text-gray-600">Managing products, deliveries, and business profile.</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Vendor Status: Active</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block md:w-1/4">
            <div className="sticky top-6">
              <Card 
                className="shadow-xl border-none overflow-hidden rounded-3xl" 
                bodyStyle={{ backgroundColor: '#a03048', color: 'white', padding: '1.5rem' }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-2">
                    <div className="bg-white p-2 rounded-xl">
                      <ShopOutlined className="text-[#a03048] text-xl" />
                    </div>
                    <div>
                      <div className="text-xs text-white/70 uppercase tracking-wider font-bold">Vendor Portal</div>
                      <div className="text-lg font-bold leading-tight">Control Panel</div>
                    </div>
                  </div>
                  
                  <div className="h-px bg-white/20 mx-2" />
                  
                  <nav className="flex flex-col gap-2">
                    <button 
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#a03048] font-bold shadow-lg' : 'text-white hover:bg-white/10'}`}
                      onClick={() => setActiveTab('dashboard')}
                    >
                      <UnorderedListOutlined /> <span className="text-sm">Dashboard Overview</span>
                    </button>
                    <button 
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'catalogue' ? 'bg-white text-[#a03048] font-bold shadow-lg' : 'text-white hover:bg-white/10'}`}
                      onClick={() => setActiveTab('catalogue')}
                    >
                      <SearchOutlined /> <span className="text-sm">Catalogue Browser</span>
                    </button>
                    <button 
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-white text-[#a03048] font-bold shadow-lg' : 'text-white hover:bg-white/10'}`}
                      onClick={() => setActiveTab('inventory')}
                    >
                      <ShopOutlined /> <span className="text-sm">My Shop Inventory</span>
                    </button>
                    <button 
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-white text-[#a03048] font-bold shadow-lg' : 'text-white hover:bg-white/10'}`}
                      onClick={() => setActiveTab('orders')}
                    >
                      <FileTextOutlined /> <span className="text-sm">Order Management</span>
                    </button>
                    <button 
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white text-[#a03048] font-bold shadow-lg' : 'text-white hover:bg-white/10'}`}
                      onClick={() => setActiveTab('settings')}
                    >
                      <SettingOutlined /> <span className="text-sm">Account Settings</span>
                    </button>
                  </nav>
                </div>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:w-3/4">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                <Card className="rounded-3xl border-none shadow-md p-4 bg-white">
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Inventory Items</div>
                  <div className="text-4xl font-black text-[#a03048]">{metrics.total_inventory}</div>
                </Card>
                <Card className="rounded-3xl border-none shadow-md p-4 bg-white">
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Pending Orders</div>
                  <div className="text-4xl font-black text-orange-500">{metrics.pending_orders}</div>
                </Card>
              </div>
            )}

            {activeTab === 'catalogue' && (
              <div className="animate-in fade-in duration-500">
                <CatalogueBrowser 
                   onAddToStore={updateMetrics} 
                   addedProductIds={[]} 
                />
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="animate-in fade-in duration-500">
                <VendorInventory items={[]} onUpdate={updateMetrics} />
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="animate-in fade-in duration-500">
                <VendorOrders orders={[]} onUpdateStatus={updateMetrics} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-in fade-in duration-500">
                <VendorSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
