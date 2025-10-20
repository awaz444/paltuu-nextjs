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

const ShelterProfileContent = dynamic(() => import('../../components/ShelterProfileContent'), {
  ssr: false,
  loading: () => <div className="py-6">Loading shelter profile...</div>
});
import { UploadOutlined, UnorderedListOutlined, UserOutlined, BellOutlined, FileTextOutlined, PlusOutlined, HomeOutlined } from "@ant-design/icons";

export default function RescuePanel() {
  
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bulk' | 'single' | 'listings' | 'profile' | 'notifications' | 'applications' | 'shelter'>('bulk');
  const [mobileSolid, setMobileSolid] = useState(true);
  const [entityData, setEntityData] = useState<{id: number, name: string, address?: string} | null>(null);

  useEffect(() => {
    const check = () => {
      if (!isAuthenticated || !user) {
        message.warning("Please login to access the rescue panel");
        router.push("/login");
        return;
      }
      if (user.role !== "shelter admin") {
        router.push("/browse-pets");
        return;
      }
      setLoading(false);
    };
    const t = setTimeout(check, 100);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, router]);

  // Fetch shelter entity data
  useEffect(() => {
    const fetchEntityData = async () => {
      if (!user?.id && !user?.user_id) return;
      
      try {
        const userId = user.id || user.user_id;
        console.log('Fetching shelter entity data for user ID:', userId);
        const response = await fetch(`/api/user-shops-shelters?user_id=${userId}`);
        const data = await response.json();
        console.log('Shelter entity response:', data);
        
        if (data.success && data.entity) {
          setEntityData({
            id: data.entity.id,
            name: data.entity.name,
            address: data.entity.address
          });
          console.log('Set entity data:', { id: data.entity.id, name: data.entity.name, address: data.entity.address });
        } else {
          console.log('No entity data found or API error:', data);
        }
      } catch (error) {
        console.error('Error fetching shelter data:', error);
      }
    };

    if (user && (user.id || user.user_id)) {
      fetchEntityData();
    }
  }, [user]);

  useEffect(() => {
    const onScroll = () => setMobileSolid(window.scrollY < 24);
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
        linksOverride={[{ name: "Rescue Panel", href: "rescue-panel" }]}
        dropdownOverride={[
          { href: "/", label: "Home", icon: "bi-house" },
          { href: "/logout", label: "Logout", icon: "bi-box-arrow-right", isAction: true },
        ]}
        logoHref="/rescue-panel"
        hideCart
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Rescue Shelter Panel</h1>
        <p className="text-gray-600 mb-6">Manage your shelter listings and uploads.</p>

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
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'shelter' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('shelter')}
            >
              <HomeOutlined /> <span className="ml-2">My Shelter</span>
            </button>
          </div>
          {/* Spacer to prevent overlap with content */}
          <div className="h-3" />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="hidden md:block md:w-1/3">
            <div className="sticky top-6">
              <Card className="shadow-sm max-h-[calc(100vh-8rem)]" bodyStyle={{ backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: 12 }}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg">
                  <Image src="/paltu_logo.svg" alt="Paltuu" width={120} height={32} />
                  <div>
                    <div className="text-xs text-white/80 leading-tight">Rescue</div>
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
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'shelter' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('shelter')}>
                  <HomeOutlined /> <span>My Shelter</span>
                </button>
              </div>
              </Card>
            </div>
          </div>
          <div className="md:w-2/3">
            {activeTab === 'bulk' && (
              <Card title="Bulk Upload Pets" className="shadow-sm">
                <p className="mb-4">Upload multiple pets at once for your shelter.</p>
                <div className="mt-4">
                  <BulkPetUploadForm
                    entityType="shelter"
                    entityId={entityData?.id || 1}
                    entityName={entityData?.name || "My Rescue Shelter"}
                    showPrice={false}
                    entityAddress={entityData?.address}
                  />
                </div>
              </Card>
            )}
            {activeTab === 'single' && (
              <Card title="Single Pet Upload" className="shadow-sm">
                <p className="mb-4">Upload a single pet listing for your shelter.</p>
                <div className="mt-4">
                  <SinglePetUploadForm
                    entityType="shelter"
                    entityId={entityData?.id || 1}
                    entityName={entityData?.name || "My Rescue Shelter"}
                    showPrice={false}
                    entityAddress={entityData?.address}
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
            {activeTab === 'shelter' && (
              <Card title="My Shelter" className="shadow-sm">
                {entityData ? (
                  <ShelterProfileContent shelterId={entityData.id} />
                ) : (
                  <div className="py-6 text-center">
                    <div className="text-lg">Loading shelter information...</div>
                    <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your shelter data</div>
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
  const [expandedApplication, setExpandedApplication] = React.useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const uid = user?.id || user?.user_id;
        if (!uid) throw new Error('User not found');
        const response = await fetch(`/api/get-shelter-applications/${uid}`);
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

  const handleApprove = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/accept-adoption-application/${applicationId}`, { method: "POST" });
      
      if (response.ok) {
        setApplications(prev => prev.filter(app => app.application_id !== applicationId));
        message.success('Application approved successfully!');
      } else {
        message.error('Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      message.error('Failed to approve application');
    }
  };

  const handleReject = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/reject-adoption-application/${applicationId}`, { method: "POST" });
      
      if (response.ok) {
        setApplications(prev => prev.filter(app => app.application_id !== applicationId));
        message.success('Application rejected');
      } else {
        message.error('Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      message.error('Failed to reject application');
    }
  };

  if (loading) return <div className="py-6">Loading...</div>;
  if (error) return <div className="py-6 text-red-500">{error}</div>;

  if (!applications.length) {
    return <div className="py-6 text-gray-600">No applications yet.</div>;
  }

  return (
    <div className="space-y-6">
      {applications.map((app) => (
        <div key={app.application_id} className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {app.adopter_name}
              </h3>
              <p className="text-gray-600">Applied for: {app.pet_name}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                app.status === "approved" ? "bg-green-100 text-green-800" :
                app.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {app.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date(app.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Adoption Application
              </p>
            </div>
          </div>

          {expandedApplication === app.application_id && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Address:</strong> {app.adopter_address}
                </div>
                <div>
                  <strong>Youngest Child Age:</strong> {app.age_of_youngest_child || "Not provided"}
                </div>
                <div>
                  <strong>Other Pets:</strong> {app.other_pets_details || "None"}
                </div>
                <div>
                  <strong>Other Pets Neutered:</strong> {app.other_pets_neutered ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Secure Outdoor Area:</strong> {app.has_secure_outdoor_area ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Pet Sleep Location:</strong> {app.pet_sleep_location || "Not specified"}
                </div>
                <div>
                  <strong>Pet Left Alone:</strong> {app.pet_left_alone || "Not specified"}
                </div>
                <div>
                  <strong>Delivery Required:</strong> {app.delivery ? "Yes" : "No"}
                </div>
                {app.additional_details && (
                  <div className="col-span-2">
                    <strong>Additional Details:</strong> {app.additional_details}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setExpandedApplication(
                expandedApplication === app.application_id ? null : app.application_id
              )}
              className="text-primary hover:text-primary-dark font-medium"
            >
              {expandedApplication === app.application_id ? "Show Less" : "Show Details"}
            </button>
            
            {app.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(app.application_id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(app.application_id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


