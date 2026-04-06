"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Card, Spin, message, Badge } from "antd";
import VendorSettings from "../../components/vendor/VendorSettings";
import CatalogueBrowser from "../../components/vendor/CatalogueBrowser";
import VendorInventory from "../../components/vendor/VendorInventory";
import VendorOrders from "../../components/vendor/VendorOrders";
import { initialMockVendorData, VendorData, VendorInventoryItem, OrderStatus } from "../../lib/mockVendorData";
import { 
  UnorderedListOutlined, 
  UploadOutlined, 
  SettingOutlined, 
  ShopOutlined,
  SearchOutlined,
  FileTextOutlined
} from "@ant-design/icons";

export default function VendorPanel() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'catalogue' | 'settings' | 'orders'>('orders');
  const [mobileSolid, setMobileSolid] = useState(true);
  
  // State for mock vendor data (including session-based inventory)
  const [vendorData, setVendorData] = useState<VendorData>(initialMockVendorData);

  useEffect(() => {
    // Auth guard removed for now as requested.
    setLoading(false);
  }, []);

  useEffect(() => {
    const onScroll = () => setMobileSolid(window.scrollY < 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAddToStore = (item: VendorInventoryItem) => {
    setVendorData(prev => ({
      ...prev,
      inventory: [item, ...prev.inventory]
    }));
    message.success(`${item.title} added to your shop inventory!`);
  };

  const handleUpdateInventory = (newItems: VendorInventoryItem[]) => {
    setVendorData(prev => ({
      ...prev,
      inventory: newItems
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading Vendor Panel..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{vendorData.shop_name}</h1>
              <Badge status="success" text="Verified Business" className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100" />
            </div>
            <p className="text-gray-600">Managing products, deliveries, and business profile.</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Vendor Status: Active</span>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden sticky top-14 z-20 transition-all mb-4 scrollbar-hide">
          <div
            className={`flex overflow-x-auto gap-3 py-2 px-2 rounded-xl transition-all duration-300 ${mobileSolid ? '' : 'backdrop-blur-sm bg-black/5'}`}
            style={{
              backgroundColor: mobileSolid
                ? '#a03048'
                : 'color-mix(in srgb, #a03048 85%, transparent)'
            }}
          >
            <button
              className={`relative flex-shrink-0 px-4 py-2 text-white rounded-lg hover:bg-white/10 transition-all ${activeTab === 'dashboard' ? 'bg-white/20 font-bold' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <UnorderedListOutlined /> <span className="ml-2 text-xs uppercase tracking-wider font-bold">Overview</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-4 py-2 text-white rounded-lg hover:bg-white/10 transition-all ${activeTab === 'catalogue' ? 'bg-white/20 font-bold' : ''}`}
              onClick={() => setActiveTab('catalogue')}
            >
              <SearchOutlined /> <span className="ml-2 text-xs uppercase tracking-wider font-bold">Catalogue</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-4 py-2 text-white rounded-lg hover:bg-white/10 transition-all ${activeTab === 'inventory' ? 'bg-white/20 font-bold' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <ShopOutlined /> <span className="ml-2 text-xs uppercase tracking-wider font-bold">Inventory</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-4 py-2 text-white rounded-lg hover:bg-white/10 transition-all ${activeTab === 'orders' ? 'bg-white/20 font-bold' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FileTextOutlined /> <span className="ml-2 text-xs uppercase tracking-wider font-bold">Orders</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-4 py-2 text-white rounded-lg hover:bg-white/10 transition-all ${activeTab === 'settings' ? 'bg-white/20 font-bold' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <SettingOutlined /> <span className="ml-2 text-xs uppercase tracking-wider font-bold">Settings</span>
            </button>
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
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UnorderedListOutlined className="text-3xl text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Dashboard Under Construction</h2>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">Charts and sales analytics for your pet business will appear here soon.</p>
              </div>
            )}

            {activeTab === 'catalogue' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Catalogue Browser</h2>
                  <p className="text-gray-500 font-medium">Browse 400+ master products and add them to your store with custom pricing.</p>
                </div>
                <CatalogueBrowser 
                   onAddToStore={handleAddToStore} 
                   addedProductIds={vendorData.inventory.map(i => i.product_id)} 
                />
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <VendorInventory items={vendorData.inventory} onUpdate={handleUpdateInventory} />
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
                    <p className="text-gray-500 font-medium">Manage incoming orders and track delivery status.</p>
                  </div>
                  <Badge count={vendorData.orders.filter(o => o.status === 'pending').length} offset={[10, 0]}>
                    <div className="bg-[#a03048]/10 text-[#a03048] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">Live Orders</div>
                  </Badge>
                </div>
                <VendorOrders 
                  orders={vendorData.orders} 
                  onUpdateStatus={(id: number, status: OrderStatus) => {
                    setVendorData(prev => ({
                      ...prev,
                      orders: prev.orders.map(o => o.order_id === id ? { ...o, status } : o)
                    }));
                  }} 
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Onboarding & Delivery</h2>
                  <p className="text-gray-500 font-medium font-medium">Update your business profile and logistics settings.</p>
                </div>
                <VendorSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
