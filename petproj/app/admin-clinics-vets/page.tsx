"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Table, Button, message, Popconfirm } from "antd";
import ClinicModal from "./components/ClinicModal";
import VetModal from "./components/VetModal";
import Navbar from "@/components/navbar";

export default function AdminClinicsVets() {
    const [clinics, setClinics] = useState<any[]>([]);
    const [vets, setVets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [isClinicModalVisible, setIsClinicModalVisible] = useState(false);
    const [editingClinic, setEditingClinic] = useState<any>(null);

    const [isVetModalVisible, setIsVetModalVisible] = useState(false);
    const [editingVet, setEditingVet] = useState<any>(null);

    const fetchClinics = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/clinics");
            const data = await res.json();
            setClinics(data);
        } catch (error) {
            message.error("Failed to fetch clinics");
        } finally {
            setLoading(false);
        }
    };

    const fetchVets = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/vets");
            const data = await res.json();
            setVets(data);
        } catch (error) {
            message.error("Failed to fetch vets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClinics();
        fetchVets();
    }, []);

    const handleDeleteClinic = async (clinic_id: string) => {
        try {
            const res = await fetch("/api/admin/clinics", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clinic_id })
            });
            if (res.ok) {
                message.success("Clinic deleted");
                fetchClinics();
            } else {
                message.error("Failed to delete clinic");
            }
        } catch (error) {
            message.error("Error deleting clinic");
        }
    };

    const handleDeleteVet = async (vet_id: string) => {
        try {
            const res = await fetch("/api/admin/vets", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vet_id })
            });
            if (res.ok) {
                message.success("Vet deleted");
                fetchVets();
            } else {
                message.error("Failed to delete vet");
            }
        } catch (error) {
            message.error("Error deleting vet");
        }
    };

    const clinicColumns = [
        {
            title: "Logo",
            dataIndex: "logo_url",
            key: "logo_url",
            render: (text: string) => text ? <img src={text} alt="logo" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} /> : "N/A"
        },
        { title: "Name", dataIndex: "name", key: "name" },
        { title: "Contact", dataIndex: "contact_number", key: "contact_number" },
        {
            title: "Partner",
            dataIndex: "is_paltuu_partner",
            key: "is_paltuu_partner",
            render: (val: boolean) => val ? "Yes" : "No"
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Button type="primary" onClick={() => { setEditingClinic(record); setIsClinicModalVisible(true); }}>Edit</Button>
                    <Popconfirm title="Delete clinic?" onConfirm={() => handleDeleteClinic(record.clinic_id)}>
                        <Button danger>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ];

    const vetColumns = [
        {
            title: "Profile",
            dataIndex: "profile_image_url",
            key: "profile_image_url",
            render: (text: string) => text ? <img src={text} alt="profile" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }} /> : "N/A"
        },
        { title: "Name", dataIndex: "name", key: "name" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Clinic", dataIndex: "clinic_name", key: "clinic_name" },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
                <div className="flex gap-2">
                    <Button type="primary" onClick={() => { setEditingVet(record); setIsVetModalVisible(true); }}>Edit</Button>
                    <Popconfirm title="Delete vet?" onConfirm={() => handleDeleteVet(record.vet_id)}>
                        <Button danger>Delete</Button>
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Clinics & Vets Management</h1>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <Tabs defaultActiveKey="1">
                        <Tabs.TabPane tab={<span className="text-lg font-semibold">Clinics</span>} key="1">
                            <div className="mb-4 flex justify-end">
                                <Button type="primary" size="large" onClick={() => { setEditingClinic(null); setIsClinicModalVisible(true); }}>
                                    + Add New Clinic
                                </Button>
                            </div>
                            <Table 
                                dataSource={clinics} 
                                columns={clinicColumns} 
                                rowKey="clinic_id"
                                loading={loading}
                                scroll={{ x: true }}
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={<span className="text-lg font-semibold">Vets</span>} key="2">
                            <div className="mb-4 flex justify-end">
                                <Button type="primary" size="large" onClick={() => { setEditingVet(null); setIsVetModalVisible(true); }}>
                                    + Add New Vet
                                </Button>
                            </div>
                            <Table 
                                dataSource={vets} 
                                columns={vetColumns} 
                                rowKey="vet_id"
                                loading={loading}
                                scroll={{ x: true }}
                            />
                        </Tabs.TabPane>
                    </Tabs>
                </div>
            </div>

            <ClinicModal 
                visible={isClinicModalVisible}
                onCancel={() => setIsClinicModalVisible(false)}
                onSuccess={() => {
                    setIsClinicModalVisible(false);
                    fetchClinics();
                }}
                initialData={editingClinic}
            />

            <VetModal 
                visible={isVetModalVisible}
                onCancel={() => setIsVetModalVisible(false)}
                onSuccess={() => {
                    setIsVetModalVisible(false);
                    fetchVets();
                }}
                initialData={editingVet}
            />
        </div>
    );
}
