"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button, Spin, message } from "antd";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import BulkPetUploadForm from "../../components/BulkPetUploadForm";
import SinglePetUploadForm from "../../components/SinglePetUploadForm";
import ProfileContent from "../../components/ProfileContent";
import NotificationsContent from "../../components/NotificationsContent";
import MyListingGrid from "../../components/MyListingGrid";
import dynamic from 'next/dynamic';

const ShopProfileContent = dynamic(() => import('../../components/ShopProfileContent'), {
  ssr: false,
  loading: () => <div className="py-6">Loading shop profile...</div>
});
import { UploadOutlined, UnorderedListOutlined, UserOutlined, BellOutlined, FileTextOutlined, PlusOutlined, ShopOutlined } from "@ant-design/icons";

export default function ShopPanel() {
  useSetPrimaryColor();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bulk' | 'single' | 'listings' | 'profile' | 'notifications' | 'applications' | 'shop'>('bulk');
  const [mobileSolid, setMobileSolid] = useState(true);
  const [entityData, setEntityData] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    const check = () => {
      if (!isAuthenticated || !user) {
        message.warning("Please login to access the shop panel");
        router.push("/login");
        return;
      }
      if (user.role !== "shop admin") {
        router.push("/browse-pets");
        return;
      }
      setLoading(false);
    };
    const t = setTimeout(check, 100);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, router]);

  // Fetch shop entity data
  useEffect(() => {
    const fetchEntityData = async () => {
      if (!user?.id && !user?.user_id) return;
      
      try {
        const userId = user.id || user.user_id;
        console.log('Fetching shop entity data for user ID:', userId);
        const response = await fetch(`/api/user-shops-shelters?user_id=${userId}`);
        const data = await response.json();
        console.log('Shop entity response:', data);
        
        if (data.success && data.entity) {
          setEntityData({
            id: data.entity.id,
            name: data.entity.name
          });
          console.log('Set entity data:', { id: data.entity.id, name: data.entity.name });
        } else {
          console.log('No entity data found or API error:', data);
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
      }
    };

    if (user && (user.id || user.user_id)) {
      fetchEntityData();
    }
  }, [user]);

  useEffect(() => {
    const onScroll = () => {
      setMobileSolid(window.scrollY < 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        linksOverride={[{ name: "Shop Panel", href: "shop-panel" }]}
        dropdownOverride={[
          { href: "/", label: "Home", icon: "bi-house" },
          { href: "/logout", label: "Logout", icon: "bi-box-arrow-right", isAction: true },
        ]}
        logoHref="/shop-panel"
        hideCart
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Shop Panel</h1>
        <p className="text-gray-600 mb-6">Manage your shop listings and uploads.</p>

        {/* Mobile tab bar */}
        <div className="md:hidden sticky top-14 z-20 transition-all">
          <div
            className={`flex overflow-x-auto gap-3 py-2 px-2 rounded-lg transition-all duration-300 ${mobileSolid ? '' : 'backdrop-blur-sm bg-black/5'}`}
            style={{
              backgroundColor: mobileSolid
                ? 'var(--primary-color)'
                : 'color-mix(in srgb, var(--primary-color) 55%, transparent)'
            }}
          >
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'bulk' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('bulk')}
            >
              <UploadOutlined /> <span className="ml-2">Bulk Upload</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'single' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('single')}
            >
              <PlusOutlined /> <span className="ml-2">Single Pet</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'listings' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('listings')}
            >
              <UnorderedListOutlined /> <span className="ml-2">Listings</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'profile' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserOutlined /> <span className="ml-2">Profile</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'notifications' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('notifications')}
            >
              <BellOutlined /> <span className="ml-2">Notifications</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'applications' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('applications')}
            >
              <FileTextOutlined /> <span className="ml-2">Applications</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'shop' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('shop')}
            >
              <ShopOutlined /> <span className="ml-2">My Shop</span>
            </button>
          </div>
          {/* Spacer to prevent overlap with content */}
          <div className="h-3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="hidden md:block md:col-span-1">
            <Card className="shadow-sm sticky top-6" bodyStyle={{ backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 12 }}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg">
                  <Image src="/paltu_logo.svg" alt="Paltuu" width={120} height={32} />
                  <div>
                    <div className="text-xs text-white/80 leading-tight">Shop</div>
                    <div className="text-sm font-semibold leading-tight">Control Panel</div>
                  </div>
                </div>
                <div className="h-px bg-white/20" />
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'bulk' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('bulk')}>
                  <UploadOutlined /> <span>Bulk Upload Pets</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'single' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('single')}>
                  <PlusOutlined /> <span>Single Pet Upload</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'listings' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('listings')}>
                  <UnorderedListOutlined /> <span>My Listings</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'profile' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('profile')}>
                  <UserOutlined /> <span>Profile</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'notifications' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('notifications')}>
                  <BellOutlined /> <span>Notifications</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'applications' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('applications')}>
                  <FileTextOutlined /> <span>My Applications</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'shop' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('shop')}>
                  <ShopOutlined /> <span>My Shop</span>
                </button>
              </div>
            </Card>
          </div>
          <div className="md:col-span-3">
            {activeTab === 'bulk' && (
              <Card title="Bulk Upload Pets" className="shadow-sm">
                <p className="mb-4">Upload multiple pets at once for your shop.</p>
                <div className="mt-4">
                  <BulkPetUploadForm
                    entityType="shop"
                    entityId={entityData?.id || 1}
                    entityName={entityData?.name || "My Pet Shop"}
                    showPrice={true}
                  />
                </div>
              </Card>
            )}
            {activeTab === 'single' && (
              <Card title="Single Pet Upload" className="shadow-sm">
                <p className="mb-4">Upload a single pet listing for your shop.</p>
                <div className="mt-4">
                  <SinglePetUploadForm
                    entityType="shop"
                    entityId={entityData?.id || 1}
                    entityName={entityData?.name || "My Pet Shop"}
                    showPrice={true}
                  />
                </div>
              </Card>
            )}
            {activeTab === 'listings' && (
              <Card title="My Listings" className="shadow-sm">
                <MyListingsContent />
              </Card>
            )}
            {activeTab === 'profile' && (
              <ProfileContent />
            )}
            {activeTab === 'notifications' && (
              <Card className="shadow-sm">
                <NotificationsContent />
              </Card>
            )}
            {activeTab === 'applications' && (
              <Card title="My Applications" className="shadow-sm">
                <MyApplicationsContent />
              </Card>
            )}
            {activeTab === 'shop' && (
              <Card title="My Shop" className="shadow-sm">
                {entityData ? (
                  <ShopProfileContent shopId={entityData.id} />
                ) : (
                  <div className="py-6 text-center">
                    <div className="text-lg">Loading shop information...</div>
                    <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your shop data</div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MyListingsContent() {
  const [pets, setPets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const uid = user?.id || user?.user_id;
        if (!uid) throw new Error('User not found');
        const res = await fetch(`/api/my-listings/${uid}`);
        if (!res.ok) throw new Error('Failed to load listings');
        const data = await res.json();
        setPets(data.listings || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, user?.user_id]);

  if (loading) return <div className="py-6">Loading...</div>;
  if (error) return <div className="py-6 text-red-500">{error}</div>;

  return <MyListingGrid pets={pets as any} showCreateButton={false} />;
}

function MyApplicationsContent() {
  const [applications, setApplications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const uid = user?.id || user?.user_id;
        if (!uid) throw new Error('User not found');
        const response = await fetch(`/api/get-my-applications/${uid}`);
        if (!response.ok) throw new Error('Failed to fetch applications');
        const data = await response.json();
        setApplications(data.applications || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, user?.user_id]);

  if (loading) return <div className="py-6">Loading...</div>;
  if (error) return <div className="py-6 text-red-500">{error}</div>;

  if (!applications.length) {
    return <div className="py-6 text-gray-600">No applications yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.map((app) => (
        <div key={app.application_id} className="bg-white p-4 rounded-2xl shadow-sm border">
          <img src={app.image_url || "/dog-placeholder.png"} alt={app.pet_name} className="w-full h-40 object-cover rounded-xl mb-3" />
          <div className="font-semibold">{app.pet_name}</div>
          <div className="text-sm text-gray-600">{app.city_name}{app.area ? `, ${app.area}` : ''}</div>
          <div className="text-sm text-gray-600">Status: {app.status}</div>
        </div>
      ))}
    </div>
  );
}


