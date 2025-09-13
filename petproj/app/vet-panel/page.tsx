"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button, Spin, message } from "antd";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { 
  UserOutlined, 
  ShopOutlined, 
  FileTextOutlined, 
  CalendarOutlined, 
  StarOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  BellOutlined
} from "@ant-design/icons";
import VetProfileTab from "../../components/VetProfileTab";
import VetClinicTab from "../../components/VetClinicTab";
import VetQualificationsTab from "../../components/VetQualificationsTab";
import VetScheduleTab from "../../components/VetScheduleTab";
import VetReviewsTab from "../../components/VetReviewsTab";

export default function VetPanel() {
  
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'qualifications' | 'schedule' | 'reviews' | 'notifications'>('profile');
  const [mobileSolid, setMobileSolid] = useState(true);

  useEffect(() => {
    const check = () => {
      if (!isAuthenticated || !user) {
        message.warning("Please login to access the vet panel");
        router.push("/login");
        return;
      }
      if (user.role !== "vet") {
        router.push("/");
        return;
      }
      setLoading(false);
    };
    const t = setTimeout(check, 100);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, router]);

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
        linksOverride={[{ name: "Vet Panel", href: "vet-panel" }]}
        dropdownOverride={[
          { href: "/", label: "Home", icon: "bi bi-house-fill" },
          { href: "/logout", label: "Logout", icon: "bi bi-box-arrow-right", isAction: true },
        ]}
        logoHref="/vet-panel"
        hideCart
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Vet Panel</h1>
        <p className="text-gray-600 mb-6">Manage your veterinary practice and profile.</p>

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
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'profile' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserOutlined /> <span className="ml-2">Profile</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'clinic' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('clinic')}
            >
              <ShopOutlined /> <span className="ml-2">Clinic</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'qualifications' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('qualifications')}
            >
              <FileTextOutlined /> <span className="ml-2">Qualifications</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'schedule' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('schedule')}
            >
              <CalendarOutlined /> <span className="ml-2">Schedule</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'reviews' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('reviews')}
            >
              <StarOutlined /> <span className="ml-2">Reviews</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'notifications' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('notifications')}
            >
              <BellOutlined /> <span className="ml-2">Notifications</span>
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
                  <img src="/paltu_logo.svg" alt="Paltuu" width={120} height={32} />
                  <div>
                    <div className="text-xs text-white/80 leading-tight">Veterinary</div>
                    <div className="text-sm font-semibold leading-tight">Control Panel</div>
                  </div>
                </div>
                <div className="h-px bg-white/20" />
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'profile' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('profile')}>
                  <UserOutlined /> <span>Profile</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'clinic' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('clinic')}>
                  <ShopOutlined /> <span>Clinic Info</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'qualifications' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('qualifications')}>
                  <FileTextOutlined /> <span>Qualifications</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'schedule' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('schedule')}>
                  <CalendarOutlined /> <span>Schedule</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'reviews' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('reviews')}>
                  <StarOutlined /> <span>Reviews</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'notifications' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('notifications')}>
                  <BellOutlined /> <span>Notifications</span>
                </button>
              </div>
            </Card>
          </div>
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <Card title="Profile Information" className="shadow-sm">
                <VetProfileTab />
              </Card>
            )}
            {activeTab === 'clinic' && (
              <Card title="Clinic Information" className="shadow-sm">
                <VetClinicTab />
              </Card>
            )}
            {activeTab === 'qualifications' && (
              <Card title="Qualifications & Specializations" className="shadow-sm">
                <VetQualificationsTab />
              </Card>
            )}
            {activeTab === 'schedule' && (
              <Card title="Schedule" className="shadow-sm">
                <VetScheduleTab />
              </Card>
            )}
            {activeTab === 'reviews' && (
              <Card title="Reviews" className="shadow-sm">
                <VetReviewsTab />
              </Card>
            )}
            {activeTab === 'notifications' && (
              <Card title="Notifications" className="shadow-sm">
                <NotificationsContent />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsContent() {
  return (
    <div className="py-6 text-gray-600">No notifications yet.</div>
  );
}