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
import { formatAge } from "../../utils/formatAge";
import { UploadOutlined, UnorderedListOutlined, UserOutlined, BellOutlined, FileTextOutlined, PlusOutlined, HomeOutlined, PhoneOutlined } from "@ant-design/icons";

export default function RescuePanel() {

  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'shelter'>('dashboard');
  const [uploadSubTab, setUploadSubTab] = useState<'single' | 'bulk'>('single');
  const [listingsSubTab, setListingsSubTab] = useState<'pets' | 'applications'>('pets');
  const [shelterSubTab, setShelterSubTab] = useState<'profile' | 'settings'>('profile');
  const [mobileSolid, setMobileSolid] = useState(true);
  const [entityData, setEntityData] = useState<{id: number, name: string, address?: string} | null>(null);

  useEffect(() => {
    const check = () => {
      if (!isAuthenticated || !user) {
        message.warning("Please login to access the rescue panel");
        router.push("/auth");
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
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'dashboard' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <UnorderedListOutlined /> <span className="ml-2">Dashboard</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'upload' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('upload')}
            >
              <UploadOutlined /> <span className="ml-2">Upload</span>
            </button>
            <button
              className={`relative flex-shrink-0 px-3 py-2 text-white rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'shelter' ? 'after:w-[calc(100%-1.5rem)] bg-white/10' : 'after:w-0'}`}
              onClick={() => setActiveTab('shelter')}
            >
              <HomeOutlined /> <span className="ml-2">Shelter</span>
            </button>
          </div>
          {/* Spacer to prevent overlap with content */}
          <div className="h-3" />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="hidden md:block md:w-1/4">
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
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'dashboard' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('dashboard')}>
                  <UnorderedListOutlined /> <span>My Dashboard</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'upload' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('upload')}>
                  <UploadOutlined /> <span>Upload Pet</span>
                </button>
                <button className={`relative flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 after:absolute after:left-3 after:bottom-1 after:h-[2px] after:bg-white after:transition-all after:duration-300 ${activeTab === 'shelter' ? 'text-white cursor-default after:w-[calc(100%-1.5rem)]' : 'text-white after:w-0'}`}
                        onClick={() => setActiveTab('shelter')}>
                  <HomeOutlined /> <span>My Shelter</span>
                </button>
              </div>
              </Card>
            </div>
          </div>
          <div className="md:w-3/4">
            {activeTab === 'upload' && (
              <div>
                {/* Upload Sub-tabs */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-xl inline-flex shadow-sm border border-gray-200">
                    <button
                      className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 ${
                        uploadSubTab === 'single'
                          ? 'bg-white text-primary shadow-md border border-gray-200'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                      }`}
                      onClick={() => setUploadSubTab('single')}>
                      Single Upload
                    </button>
                    <button
                      className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 ${
                        uploadSubTab === 'bulk'
                          ? 'bg-white text-primary shadow-md border border-gray-200'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                      }`}
                      onClick={() => setUploadSubTab('bulk')}>
                      Bulk Upload
                    </button>
                  </div>
                </div>

                {uploadSubTab === 'single' && (
                  <div>
                    <p className="mb-4 text-gray-600">Upload a single pet listing for your shelter.</p>
                    <SinglePetUploadForm
                    entityType="shelter"
                    entityId={entityData?.id || 1}
                    entityName={entityData?.name || "My Rescue Shelter"}
                    showPrice={false}
                      entityAddress={entityData?.address}
                  />
                </div>
                )}

                {uploadSubTab === 'bulk' && (
                  <div>
                    <p className="mb-4 text-gray-600">Upload multiple pets at once for your shelter.</p>
                    <BulkPetUploadForm
                    entityType="shelter"
                    entityId={entityData?.id || 1}
                    entityName={entityData?.name || "My Rescue Shelter"}
                    showPrice={false}
                      entityAddress={entityData?.address}
                  />
                </div>
                )}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div>
                <MyListingsContent />
              </div>
            )}

            {activeTab === 'shelter' && (
              <div>
                {/* Shelter Sub-tabs */}
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-xl inline-flex shadow-sm border border-gray-200">
                    <button
                      className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 ${
                        shelterSubTab === 'profile'
                          ? 'bg-white text-primary shadow-md border border-gray-200'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                      }`}
                      onClick={() => setShelterSubTab('profile')}>
                      Profile
                    </button>
                    <button
                      className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 ${
                        shelterSubTab === 'settings'
                          ? 'bg-white text-primary shadow-md border border-gray-200'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                      }`}
                      onClick={() => setShelterSubTab('settings')}>
                      Shelter Profile Settings
                    </button>
                  </div>
                </div>

                {shelterSubTab === 'profile' && (
              <ProfileContent />
            )}

                {shelterSubTab === 'settings' && (
                  entityData ? (
                  <ShelterProfileContent shelterId={entityData.id} />
                ) : (
                  <div className="py-6 text-center">
                    <div className="text-lg">Loading shelter information...</div>
                    <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your shelter data</div>
                  </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineEditPetForm({ pet, onUpdated, onDeleted }: { pet: any, onUpdated: () => void, onDeleted: () => void }) {
  const [name, setName] = React.useState<string>(pet?.pet_name || '');
  const [breed, setBreed] = React.useState<string>(pet?.pet_breed || '');
  const [description, setDescription] = React.useState<string>(pet?.description || '');
  const [rescueStory, setRescueStory] = React.useState<string>(pet?.rescue_story || '');
  const [sex, setSex] = React.useState<string>(pet?.sex || 'male');
  const [ageMonths, setAgeMonths] = React.useState<number>(pet?.age_months || 0);
  const [contactNumber, setContactNumber] = React.useState<string>(pet?.contact_number || '');
  const [vaccinated, setVaccinated] = React.useState<boolean>(!!pet?.vaccinated);
  const [neutered, setNeutered] = React.useState<boolean>(!!pet?.neutered);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [deleting, setDeleting] = React.useState<boolean>(false);

  React.useEffect(() => {
    setName(pet?.pet_name || '');
    setBreed(pet?.pet_breed || '');
    setDescription(pet?.description || '');
    setRescueStory(pet?.rescue_story || '');
    setSex(pet?.sex || 'male');
    setAgeMonths(pet?.age_months || 0);
    setContactNumber(pet?.contact_number || '');
    setVaccinated(!!pet?.vaccinated);
    setNeutered(!!pet?.neutered);
  }, [pet?.pet_id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/v1/pets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: pet.pet_id,
          pet_name: name,
          pet_breed: breed,
          description,
          rescue_story: rescueStory,
          sex,
          age_months: ageMonths,
          contact_number: contactNumber,
          vaccinated,
          neutered,
        })
      });
      if (!res.ok) throw new Error('Failed to update pet');
      onUpdated();
    } catch (e) {
      console.error(e);
      message.error('Could not update pet');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch('/api/v1/pets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_id: pet.pet_id })
      });
      if (!res.ok) throw new Error('Failed to delete pet');
      onDeleted();
    } catch (e) {
      console.error(e);
      message.error('Could not delete pet');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Breed</label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age (in months)</label>
          <input
            type="number"
            min={0}
            value={ageMonths}
            onChange={(e) => setAgeMonths(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[10px] text-gray-500 mt-1">Current: {formatAge(ageMonths)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
          <input
            type="text"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="+923..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Rescue Story</label>
          <textarea
            rows={3}
            value={rescueStory}
            onChange={(e) => setRescueStory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vaccinated</label>
          <div className="flex items-center h-[42px]">
            <input type="checkbox" checked={vaccinated} onChange={(e) => setVaccinated(e.target.checked)} className="mr-2" />
            <span className="text-sm text-gray-700">Yes</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Neutered/Spayed</label>
          <div className="flex items-center h-[42px]">
            <input type="checkbox" checked={neutered} onChange={(e) => setNeutered(e.target.checked)} className="mr-2" />
            <span className="text-sm text-gray-700">Yes</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-lg text-white font-medium ${saving ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`px-6 py-2 rounded-lg text-white font-medium ${deleting ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {deleting ? 'Deleting...' : 'Delete Listing'}
        </button>
      </div>
    </div>
  );
}

function MyListingsContent() {
  const [pets, setPets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalApplications, setTotalApplications] = React.useState(0);
  const [petsWithApplications, setPetsWithApplications] = React.useState<any[]>([]);
  const [showOnlyWithApplications, setShowOnlyWithApplications] = React.useState(false);
  const [selectedPet, setSelectedPet] = React.useState<any>(null);
  const [petApplications, setPetApplications] = React.useState<any[]>([]);
  const [showApplicationModal, setShowApplicationModal] = React.useState(false);
  const [allApplications, setAllApplications] = React.useState<any[]>([]);
  const [editingPet, setEditingPet] = React.useState<any | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const uid = user?.id || user?.user_id;
        if (!uid) throw new Error('User not found');

        // Fetch pets and applications in parallel
        const [petsRes, appsRes] = await Promise.all([
          fetch(`/api/v1/profile/listings`),
          fetch(`/api/get-shelter-applications/${uid}`)
        ]);

        if (!petsRes.ok) throw new Error('Failed to load listings');
        const petsData = await petsRes.json();
        const pets = petsData.listings || [];

        let applications = [];
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          applications = appsData.applications || [];
        }

        // Create a map of pet_id to application count
        const petAppCounts = applications.reduce((acc: Record<number, number>, app: any) => {
          acc[app.pet_id] = (acc[app.pet_id] || 0) + 1;
          return acc;
        }, {});

        // Add application counts to pets
        const petsWithAppCounts = pets.map((pet: any) => ({
          ...pet,
          applicationCount: petAppCounts[pet.pet_id] || 0
        }));

        setPets(petsWithAppCounts);
        setPetsWithApplications(petsWithAppCounts.filter((pet: any) => pet.applicationCount > 0));
        setTotalApplications(applications.length);
        setAllApplications(applications);
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

  const displayPets = showOnlyWithApplications ? petsWithApplications : pets;

  const handlePetClick = (pet: any) => {
    const petApps = allApplications.filter(app => app.pet_id === pet.pet_id);
    setSelectedPet(pet);
    setPetApplications(petApps);
    setShowApplicationModal(true);
  };

  const handleEditPet = (pet: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPet(pet);
  };

  const handleAcceptApplication = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/accept-adoption-application/${applicationId}`, {
        method: 'POST'
      });

      if (response.ok) {
        message.success('Application accepted successfully!');
        // Refresh data
        const uid = user?.id || user?.user_id;
        if (uid) {
          const [petsRes, appsRes] = await Promise.all([
            fetch(`/api/my-listings/${uid}`),
            fetch(`/api/get-shelter-applications/${uid}`)
          ]);

          if (petsRes.ok && appsRes.ok) {
            const petsData = await petsRes.json();
            const appsData = await appsRes.json();
            const pets = petsData.listings || [];
            const applications = appsData.applications || [];

            const petAppCounts = applications.reduce((acc: Record<number, number>, app: any) => {
              acc[app.pet_id] = (acc[app.pet_id] || 0) + 1;
              return acc;
            }, {});

            const petsWithAppCounts = pets.map((pet: any) => ({
              ...pet,
              applicationCount: petAppCounts[pet.pet_id] || 0
            }));

            setPets(petsWithAppCounts);
            setPetsWithApplications(petsWithAppCounts.filter((pet: any) => pet.applicationCount > 0));
            setTotalApplications(applications.length);
            setAllApplications(applications);

            // Update modal data
            const updatedPetApps = applications.filter((app: any) => app.pet_id === selectedPet.pet_id);
            setPetApplications(updatedPetApps);
          }
        }
      } else {
        message.error('Failed to accept application');
      }
    } catch (error) {
      console.error('Error accepting application:', error);
      message.error('Error accepting application');
    }
  };

  const handleRejectApplication = async (applicationId: number) => {
    try {
      const response = await fetch(`/api/reject-adoption-application/${applicationId}`, {
        method: 'POST'
      });

      if (response.ok) {
        message.success('Application rejected');
        // Refresh data
        const uid = user?.id || user?.user_id;
        if (uid) {
          const [petsRes, appsRes] = await Promise.all([
            fetch(`/api/my-listings/${uid}`),
            fetch(`/api/get-shelter-applications/${uid}`)
          ]);

          if (petsRes.ok && appsRes.ok) {
            const petsData = await petsRes.json();
            const appsData = await appsRes.json();
            const pets = petsData.listings || [];
            const applications = appsData.applications || [];

            const petAppCounts = applications.reduce((acc: Record<number, number>, app: any) => {
              acc[app.pet_id] = (acc[app.pet_id] || 0) + 1;
              return acc;
            }, {});

            const petsWithAppCounts = pets.map((pet: any) => ({
              ...pet,
              applicationCount: petAppCounts[pet.pet_id] || 0
            }));

            setPets(petsWithAppCounts);
            setPetsWithApplications(petsWithAppCounts.filter((pet: any) => pet.applicationCount > 0));
            setTotalApplications(applications.length);
            setAllApplications(applications);

            // Update modal data
            const updatedPetApps = applications.filter((app: any) => app.pet_id === selectedPet.pet_id);
            setPetApplications(updatedPetApps);
          }
        }
      } else {
        message.error('Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      message.error('Error rejecting application');
    }
  };

  return (
    <div className="space-y-6">
      {/* Inline Edit Panel (stays on Dashboard) */}
      {editingPet && (
        <div className="bg-white rounded-xl border p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-semibold">Edit Listing: {editingPet.pet_name}</h3>
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setEditingPet(null)}
            >
              Close
            </button>
          </div>
          <InlineEditPetForm
            pet={editingPet}
            onUpdated={async () => {
              // refresh pets
              try {
                const uid = user?.id || user?.user_id;
                if (!uid) return;
                const [petsRes, appsRes] = await Promise.all([
                  fetch(`/api/my-listings/${uid}`),
                  fetch(`/api/get-shelter-applications/${uid}`)
                ]);
                if (petsRes.ok && appsRes.ok) {
                  const petsData = await petsRes.json();
                  const appsData = await appsRes.json();
                  const pets = petsData.listings || [];
                  const applications = appsData.applications || [];
                  const petAppCounts = applications.reduce((acc: Record<number, number>, app: any) => {
                    acc[app.pet_id] = (acc[app.pet_id] || 0) + 1;
                    return acc;
                  }, {});
                  const petsWithAppCounts = pets.map((pet: any) => ({
                    ...pet,
                    applicationCount: petAppCounts[pet.pet_id] || 0
                  }));
                  setPets(petsWithAppCounts);
                  setPetsWithApplications(petsWithAppCounts.filter((p: any) => p.applicationCount > 0));
                  setTotalApplications(applications.length);
                  setAllApplications(applications);
                }
              } catch (e) {
                // ignore
              }
              message.success('Pet updated');
              setEditingPet(null);
            }}
            onDeleted={async () => {
              try {
                const uid = user?.id || user?.user_id;
                if (!uid) return;
                const [petsRes, appsRes] = await Promise.all([
                  fetch(`/api/my-listings/${uid}`),
                  fetch(`/api/get-shelter-applications/${uid}`)
                ]);
                if (petsRes.ok && appsRes.ok) {
                  const petsData = await petsRes.json();
                  const appsData = await appsRes.json();
                  const pets = petsData.listings || [];
                  const applications = appsData.applications || [];
                  const petAppCounts = applications.reduce((acc: Record<number, number>, app: any) => {
                    acc[app.pet_id] = (acc[app.pet_id] || 0) + 1;
                    return acc;
                  }, {});
                  const petsWithAppCounts = pets.map((pet: any) => ({
                    ...pet,
                    applicationCount: petAppCounts[pet.pet_id] || 0
                  }));
                  setPets(petsWithAppCounts);
                  setPetsWithApplications(petsWithAppCounts.filter((p: any) => p.applicationCount > 0));
                  setTotalApplications(applications.length);
                  setAllApplications(applications);
                }
              } catch (e) {
                // ignore
              }
              message.success('Pet deleted');
              setEditingPet(null);
            }}
          />
        </div>
      )}
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-5 rounded-xl border border-blue-200 cursor-pointer hover:shadow-md transition-all duration-200"
          onClick={() => setShowOnlyWithApplications(false)}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
              <Image src="/rescuepaw.png" alt="Pets" width={40} height={40} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{pets.length}</div>
              <div className="text-xs md:text-sm font-medium text-blue-800 truncate">Total Pets</div>
            </div>
          </div>
        </div>
        <div
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 md:p-5 rounded-xl border border-purple-200 cursor-pointer hover:shadow-md transition-all duration-200 relative overflow-hidden"
          onClick={() => setShowOnlyWithApplications(true)}
        >
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#e9d5ff" strokeWidth="4"/>
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="4"
                  strokeDasharray={`${(totalApplications / Math.max(pets.length, 1)) * 125.6} 125.6`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl md:text-3xl font-bold text-purple-600">{totalApplications}</div>
              <div className="text-xs md:text-sm font-medium text-purple-800 truncate">Applications</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pet Grid - Circular Floating Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-12 lg:gap-16 pl-4 md:pl-8">
        {displayPets.map((pet) => (
          <div
            key={pet.pet_id}
            className="flex flex-col items-center cursor-pointer group relative"
            style={{ boxShadow: 'none' }}
            onClick={() => handlePetClick(pet)}
          >
            {/* Wrapper to anchor badges to the circle on all screens */}
            <div className="relative w-32 h-32 md:w-36 md:h-36 shadow-none" style={{ boxShadow: 'none', filter: 'none' }}>
              {/* Circular Pet Image with Name Overlay */}
              <div className="w-full h-full rounded-full overflow-hidden transition-none shadow-none border-4 border-blue-200 bg-white" style={{ boxShadow: 'none', filter: 'none' }}>
              { (pet.primary_image || pet.image_url) ? (
                <img
                  src={pet.primary_image || pet.image_url}
                  alt={pet.pet_name}
                    className="w-full h-full object-cover"
                    style={{ boxShadow: 'none', filter: 'none' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Image src="/rescuepaw.png" alt="Pet" width={40} height={40} className="w-10 h-10 opacity-60" />
                </div>
              )}

                 {/* Pet Name and Age Overlay (no gradient/shadow) */}
                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-transparent">
                  <h3 className="text-sm font-semibold text-white text-center truncate">
                  {pet.pet_name}
                </h3>
                  <p className="text-xs text-white/90 text-center">
                  {formatAge(pet.age_months)}
                </p>
              </div>
              </div>

              {/* Application Count Badge - anchored to circle wrapper */}
              {pet.applicationCount > 0 && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white z-50">
                  {pet.applicationCount}
                </div>
              )}
            </div>

            {/* Edit Icon - Outside Circle */}
            <div
              className="absolute -top-1 -left-1 bg-white rounded-full p-2 border-2 border-blue-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-50 cursor-pointer"
              onClick={(e) => handleEditPet(pet, e)}
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {displayPets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {showOnlyWithApplications ? 'No pets with applications' : 'No pets listed'}
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Applications for {selectedPet?.pet_name}
                </h2>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {petApplications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No applications found for this pet.
                </div>
              ) : (
                <div className="space-y-6">
                  {petApplications.map((app, index) => (
                    <div key={app.application_id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {app.adopter_name}
                          </h3>
                          <p className="text-gray-600">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
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
                            Application #{app.application_id}
                          </p>
                        </div>
                      </div>

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

                      {app.status === "pending" && (
                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => handleRejectApplication(app.application_id)}
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAcceptApplication(app.application_id)}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                          >
                            Accept
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
      {/* Edit modal removed; editing handled in Upload tab */}
    </div>
  );
}


