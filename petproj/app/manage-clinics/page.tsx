"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    Table, Button, Input, Select, Tag, Popconfirm, message,
    Modal, Form, Switch, Upload, InputNumber, Drawer, Avatar,
    Badge, Tooltip, Space, Divider, Spin, Tabs, Card,
} from "antd";
import {
    SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
    LinkOutlined, DisconnectOutlined, ReloadOutlined,
    EnvironmentOutlined, PhoneOutlined, StarOutlined,
    GlobalOutlined, ClockCircleOutlined, UserOutlined,
    MedicineBoxOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Clinic {
    clinic_id: string;
    name: string;
    address: string;
    city?: string;
    category?: string;
    contact_number?: string;
    whatsapp_number?: string;
    website?: string;
    google_maps_link?: string;
    logo_url?: string;
    operating_hours?: string;
    discount_details?: string;
    rating?: number;
    total_reviews?: number;
    is_paltuu_partner: boolean;
    owner_email?: string;
    vet_count: number;
    created_at: string;
}

interface VetRow {
    vet_id: number;
    user_id: number;
    name: string;
    email: string;
    profile_image_url?: string;
    phone_number?: string;
    specialization?: string;
    qualifications?: string;
    license_number?: string;
    bio?: string;
    is_active: boolean;
    minimum_fee?: number;
    contact_details?: string;
    created_at: string;
}

interface LinkedVet {
    vet_id: number;
    name: string;
    email: string;
    profile_image_url?: string;
    specialization?: string;
    qualifications?: string;
    license_number?: string;
    is_active: boolean;
    consultation_fee?: number;
    is_primary_location: boolean;
    schedule_notes?: string;
}

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"];
const PC = "#a03048"; // primary color

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ManageClinicsPage() {

    // ── Active tab ────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("clinics");

    // ── Clinics state ─────────────────────────────────────────────────────
    const [clinics, setClinics]       = useState<Clinic[]>([]);
    const [total, setTotal]           = useState(0);
    const [page, setPage]             = useState(1);
    const [pageSize]                  = useState(20);
    const [loading, setLoading]       = useState(false);
    const [search, setSearch]         = useState("");
    const [cityFilter, setCityFilter] = useState("");

    // Clinic edit / create modal
    const [clinicModal, setClinicModal]         = useState(false);
    const [editingClinic, setEditingClinic]     = useState<Clinic | null>(null); // null = create mode
    const [clinicForm]                          = Form.useForm();
    const [logoFileList, setLogoFileList]       = useState<UploadFile[]>([]);
    const [savingClinic, setSavingClinic]       = useState(false);

    // Vets drawer (per clinic)
    const [vetsDrawer, setVetsDrawer]           = useState(false);
    const [selectedClinic, setSelectedClinic]   = useState<Clinic | null>(null);
    const [linkedVets, setLinkedVets]           = useState<LinkedVet[]>([]);
    const [vetsLoading, setVetsLoading]         = useState(false);

    // Link vet modal
    const [linkVetModal, setLinkVetModal]       = useState(false);
    const [linkForm]                            = Form.useForm();
    const [linking, setLinking]                 = useState(false);

    // ── Vets tab state ────────────────────────────────────────────────────
    const [allVets, setAllVets]                 = useState<VetRow[]>([]);
    const [vetsTotal, setVetsTotal]             = useState(0);
    const [vetsPage, setVetsPage]               = useState(1);
    const [vetsTabLoading, setVetsTabLoading]   = useState(false);
    const [vetSearch, setVetSearch]             = useState("");

    // Vet create / edit modal
    const [vetModal, setVetModal]               = useState(false);
    const [editingVet, setEditingVet]           = useState<VetRow | null>(null); // null = create
    const [vetForm]                             = Form.useForm();
    const [vetFileList, setVetFileList]         = useState<UploadFile[]>([]);
    const [savingVet, setSavingVet]             = useState(false);

    const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const vetSearchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ══════════════════════════════════════════════════════════════════════
    // CLINICS — data fetching
    // ══════════════════════════════════════════════════════════════════════

    const fetchClinics = useCallback(async (p = page) => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({
                page: String(p),
                pageSize: String(pageSize),
                ...(search && { search }),
                ...(cityFilter && { city: cityFilter }),
            });
            const res  = await fetch(`/api/v1/admin/manage-clinics?${qs}`);
            const data = await res.json();
            if (res.ok) {
                setClinics(data.clinics);
                setTotal(data.total);
            } else {
                message.error(data.error || "Failed to load clinics");
            }
        } catch {
            message.error("Network error");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, cityFilter]);

    useEffect(() => { fetchClinics(page); }, [page, cityFilter]);

    const handleClinicSearch = (v: string) => {
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(() => {
            setSearch(v);
            setPage(1);
            fetchClinics(1);
        }, 400);
    };

    // ── Linked vets (drawer) ──────────────────────────────────────────────

    const fetchLinkedVets = async (clinicId: string) => {
        setVetsLoading(true);
        try {
            const res  = await fetch(`/api/v1/admin/manage-clinics/${clinicId}/vets`);
            const data = await res.json();
            setLinkedVets(Array.isArray(data) ? data : []);
        } catch {
            message.error("Failed to load clinic vets");
        } finally {
            setVetsLoading(false);
        }
    };

    // allVets for the "link vet" select — reuse the vets tab list
    const fetchAllVetsForSelect = async () => {
        try {
            const res  = await fetch("/api/v1/admin/vets");
            const data = await res.json();
            // Store temporarily in allVets state (we share it)
            setAllVets(Array.isArray(data) ? data : []);
        } catch {
            message.error("Failed to load vets");
        }
    };

    const openVetsDrawer = (clinic: Clinic) => {
        setSelectedClinic(clinic);
        setVetsDrawer(true);
        fetchLinkedVets(clinic.clinic_id);
        fetchAllVetsForSelect();
    };

    // ── Unlink vet ────────────────────────────────────────────────────────

    const handleUnlinkVet = async (vetId: number) => {
        if (!selectedClinic) return;
        const res = await fetch(
            `/api/v1/admin/manage-clinics/${selectedClinic.clinic_id}/vets?vet_id=${vetId}`,
            { method: "DELETE" }
        );
        if (res.ok) {
            message.success("Vet removed from clinic");
            fetchLinkedVets(selectedClinic.clinic_id);
            fetchClinics(page);
        } else {
            const d = await res.json();
            message.error(d.error || "Failed to unlink vet");
        }
    };

    // ── Link vet ──────────────────────────────────────────────────────────

    const handleLinkVet = async () => {
        if (!selectedClinic) return;
        try {
            const values = await linkForm.validateFields();
            setLinking(true);
            const res = await fetch(`/api/v1/admin/manage-clinics/${selectedClinic.clinic_id}/vets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (res.ok) {
                message.success("Vet linked successfully");
                setLinkVetModal(false);
                linkForm.resetFields();
                fetchLinkedVets(selectedClinic.clinic_id);
                fetchClinics(page);
            } else {
                const d = await res.json();
                message.error(d.error || "Failed to link vet");
            }
        } catch (err: any) {
            if (!err?.errorFields) message.error("An error occurred");
        } finally {
            setLinking(false);
        }
    };

    // ── Open clinic modal (create or edit) ────────────────────────────────

    const openCreateClinic = () => {
        setEditingClinic(null);
        clinicForm.resetFields();
        setLogoFileList([]);
        setClinicModal(true);
    };

    const openEditClinic = (clinic: Clinic) => {
        setEditingClinic(clinic);
        clinicForm.setFieldsValue({
            name: clinic.name,
            address: clinic.address,
            city: clinic.city,
            category: clinic.category,
            contact_number: clinic.contact_number,
            whatsapp_number: clinic.whatsapp_number,
            website: clinic.website,
            google_maps_link: clinic.google_maps_link,
            operating_hours: clinic.operating_hours,
            discount_details: clinic.discount_details,
            rating: clinic.rating,
            total_reviews: clinic.total_reviews,
            is_paltuu_partner: clinic.is_paltuu_partner,
            owner_email: clinic.owner_email,
        });
        setLogoFileList(
            clinic.logo_url
                ? [{ uid: "-1", name: "logo.png", status: "done", url: clinic.logo_url }]
                : []
        );
        setClinicModal(true);
    };

    // ── Save clinic (create or edit) ──────────────────────────────────────

    const handleSaveClinic = async () => {
        try {
            const values = await clinicForm.validateFields();
            setSavingClinic(true);

            let logo_url = editingClinic?.logo_url ?? null;

            const newFile = logoFileList[0]?.originFileObj;
            if (newFile) {
                const fd = new FormData();
                fd.append("file", newFile as File);
                const upRes = await fetch("/api/v1/admin/upload-clinic-logo", { method: "POST", body: fd });
                if (!upRes.ok) {
                    const e = await upRes.json().catch(() => ({}));
                    throw new Error(e.error || "Logo upload failed");
                }
                const upData = await upRes.json();
                logo_url = upData.url;
            } else if (logoFileList.length === 0) {
                logo_url = null;
            }

            const isCreate = !editingClinic;
            const res = await fetch("/api/v1/admin/clinics", {
                method: isCreate ? "POST" : "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    logo_url,
                    ...(isCreate ? {} : { clinic_id: editingClinic!.clinic_id }),
                }),
            });

            if (res.ok) {
                message.success(`Clinic ${isCreate ? "created" : "updated"} successfully`);
                setClinicModal(false);
                fetchClinics(page);
            } else {
                const d = await res.json();
                message.error(d.error || "Failed to save clinic");
            }
        } catch (err: any) {
            if (!err?.errorFields) message.error(err.message || "An error occurred");
        } finally {
            setSavingClinic(false);
        }
    };

    // ── Delete clinic ─────────────────────────────────────────────────────

    const handleDeleteClinic = async (clinicId: string) => {
        const res = await fetch(`/api/v1/admin/manage-clinics?clinic_id=${clinicId}`, {
            method: "DELETE",
        });
        if (res.ok) {
            message.success("Clinic deleted");
            fetchClinics(page);
        } else {
            const d = await res.json();
            message.error(d.error || "Failed to delete clinic");
        }
    };

    // ══════════════════════════════════════════════════════════════════════
    // VETS — data fetching
    // ══════════════════════════════════════════════════════════════════════

    const fetchVets = useCallback(async (p = vetsPage) => {
        setVetsTabLoading(true);
        try {
            const res  = await fetch("/api/v1/admin/vets");
            const data = await res.json();
            // Server returns flat array — filter client-side for search
            const rows = Array.isArray(data) ? data : [];
            const filtered = vetSearch
                ? rows.filter((v: VetRow) =>
                    v.name?.toLowerCase().includes(vetSearch.toLowerCase()) ||
                    v.email?.toLowerCase().includes(vetSearch.toLowerCase())
                  )
                : rows;
            setAllVets(filtered);
            setVetsTotal(filtered.length);
        } catch {
            message.error("Failed to load vets");
        } finally {
            setVetsTabLoading(false);
        }
    }, [vetsPage, vetSearch]);

    useEffect(() => {
        if (activeTab === "vets") fetchVets(vetsPage);
    }, [activeTab, vetsPage]);

    const handleVetSearch = (v: string) => {
        if (vetSearchDebounce.current) clearTimeout(vetSearchDebounce.current);
        vetSearchDebounce.current = setTimeout(() => {
            setVetSearch(v);
            setVetsPage(1);
            fetchVets(1);
        }, 350);
    };

    // ── Open vet modal ────────────────────────────────────────────────────

    const openCreateVet = () => {
        setEditingVet(null);
        vetForm.resetFields();
        setVetFileList([]);
        setVetModal(true);
    };

    const openEditVet = (vet: VetRow) => {
        setEditingVet(vet);
        vetForm.setFieldsValue({
            name:            vet.name,
            email:           vet.email,
            minimum_fee:     vet.minimum_fee,
            contact_details: vet.contact_details,
            license_number:  vet.license_number,
            specialization:  vet.specialization,
            qualifications:  vet.qualifications,
            bio:             vet.bio,
            is_active:       vet.is_active,
        });
        setVetFileList(
            vet.profile_image_url
                ? [{ uid: "-1", name: "profile.png", status: "done", url: vet.profile_image_url }]
                : []
        );
        setVetModal(true);
    };

    // ── Save vet (create or edit) ─────────────────────────────────────────

    const handleSaveVet = async () => {
        try {
            const values = await vetForm.validateFields();
            setSavingVet(true);

            let profile_image_url = editingVet?.profile_image_url ?? null;

            const newFile = vetFileList[0]?.originFileObj;
            if (newFile) {
                const fd = new FormData();
                fd.append("image", newFile as File);
                const upRes = await fetch("/api/v1/upload/vet", { method: "POST", body: fd });
                if (!upRes.ok) {
                    const e = await upRes.json().catch(() => ({}));
                    throw new Error(e.error || "Profile image upload failed");
                }
                const upData = await upRes.json();
                profile_image_url = upData.image_url;
            } else if (vetFileList.length === 0) {
                profile_image_url = null;
            }

            const isCreate = !editingVet;
            const res = await fetch("/api/v1/admin/vets", {
                method: isCreate ? "POST" : "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    profile_image_url,
                    ...(isCreate ? {} : { vet_id: editingVet!.vet_id, user_id: editingVet!.user_id }),
                }),
            });

            if (res.ok) {
                const result = await res.json();
                if (isCreate && result.temp_password) {
                    message.success(
                        `Vet created! Temp password: ${result.temp_password}`,
                        10
                    );
                } else {
                    message.success(`Vet ${isCreate ? "created" : "updated"} successfully`);
                }
                setVetModal(false);
                fetchVets(vetsPage);
                // Refresh allVets used in link dropdowns too
                fetchAllVetsForSelect();
            } else {
                const d = await res.json();
                message.error(d.error || "Failed to save vet");
            }
        } catch (err: any) {
            if (!err?.errorFields) message.error(err.message || "An error occurred");
        } finally {
            setSavingVet(false);
        }
    };

    // ── Delete vet ────────────────────────────────────────────────────────

    const handleDeleteVet = async (vetId: number) => {
        const res = await fetch(`/api/v1/admin/vets?vet_id=${vetId}`, { method: "DELETE" });
        if (res.ok) {
            message.success("Vet deleted");
            fetchVets(vetsPage);
        } else {
            const d = await res.json();
            message.error(d.error || "Failed to delete vet");
        }
    };

    // ══════════════════════════════════════════════════════════════════════
    // TABLE COLUMNS
    // ══════════════════════════════════════════════════════════════════════

    const clinicColumns = [
        {
            title: "Logo",
            dataIndex: "logo_url",
            key: "logo",
            width: 68,
            render: (url: string, r: Clinic) => (
                <Avatar
                    src={url || undefined}
                    size={46}
                    shape="square"
                    style={{ background: `${PC}15`, borderRadius: 8, color: PC, border: "1px solid #f0e8eb" }}
                >
                    {!url && r.name?.[0]?.toUpperCase()}
                </Avatar>
            ),
        },
        {
            title: "Clinic",
            key: "clinic",
            render: (_: any, r: Clinic) => (
                <div>
                    <div className="font-semibold text-gray-900 text-sm">{r.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <EnvironmentOutlined />
                        {r.city ? `${r.city} — ` : ""}{(r.address || "").slice(0, 50)}{(r.address?.length ?? 0) > 50 ? "…" : ""}
                    </div>
                    {r.category && <Tag color="blue" className="mt-1 text-[10px]">{r.category}</Tag>}
                </div>
            ),
        },
        {
            title: "Contact",
            key: "contact",
            width: 160,
            render: (_: any, r: Clinic) => (
                <div className="text-xs space-y-1">
                    {r.contact_number && <div className="text-gray-600"><PhoneOutlined /> {r.contact_number}</div>}
                    {r.operating_hours && <div className="text-gray-400"><ClockCircleOutlined /> {(r.operating_hours || "").slice(0, 28)}</div>}
                </div>
            ),
        },
        {
            title: "Rating",
            key: "rating",
            width: 90,
            render: (_: any, r: Clinic) => r.rating ? (
                <div className="text-xs text-center">
                    <div className="font-bold text-amber-500 text-base"><StarOutlined /> {Number(r.rating).toFixed(1)}</div>
                    <div className="text-gray-400">{r.total_reviews?.toLocaleString() ?? 0} reviews</div>
                </div>
            ) : <span className="text-gray-300 text-xs">—</span>,
        },
        {
            title: "Partner",
            dataIndex: "is_paltuu_partner",
            width: 80,
            render: (v: boolean) => <Tag color={v ? "green" : "default"} className="text-[10px]">{v ? "Partner" : "Regular"}</Tag>,
        },
        {
            title: "Vets",
            dataIndex: "vet_count",
            width: 80,
            render: (count: number, r: Clinic) => (
                <Tooltip title="Manage linked vets">
                    <Button type="link" size="small" onClick={() => openVetsDrawer(r)} style={{ color: count > 0 ? PC : "#aaa", padding: 0 }}>
                        <Badge count={count} showZero color={count > 0 ? PC : "#d9d9d9"}>
                            <UserOutlined style={{ fontSize: 16, padding: "0 8px" }} />
                        </Badge>
                    </Button>
                </Tooltip>
            ),
        },
        {
            title: "Actions",
            width: 110,
            render: (_: any, r: Clinic) => (
                <Space>
                    <Tooltip title="Edit clinic">
                        <Button type="primary" size="small" icon={<EditOutlined />} style={{ background: PC, borderColor: PC }} onClick={() => openEditClinic(r)} />
                    </Tooltip>
                    <Popconfirm title="Delete this clinic?" description="This will also remove all vet links." onConfirm={() => handleDeleteClinic(r.clinic_id)} okButtonProps={{ danger: true }}>
                        <Tooltip title="Delete"><Button danger size="small" icon={<DeleteOutlined />} /></Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const vetColumns = [
        {
            title: "Vet",
            key: "vet",
            render: (_: any, r: VetRow) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={r.profile_image_url || undefined}
                        size={42}
                        style={{ background: `${PC}15`, color: PC, flexShrink: 0 }}
                    >
                        {!r.profile_image_url && r.name?.[0]}
                    </Avatar>
                    <div>
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                            {r.name}
                            <Tag color={r.is_active ? "green" : "red"} className="text-[10px]">
                                {r.is_active ? "Active" : "Inactive"}
                            </Tag>
                        </div>
                        <div className="text-xs text-gray-400">{r.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: "Specialization",
            dataIndex: "specialization",
            width: 180,
            render: (v: string) => v ? <span className="text-sm text-gray-600">{v}</span> : <span className="text-gray-300">—</span>,
        },
        {
            title: "License",
            dataIndex: "license_number",
            width: 140,
            render: (v: string) => v ? <Tag color="purple" className="text-xs">{v}</Tag> : <span className="text-gray-300">—</span>,
        },
        {
            title: "Min. Fee",
            dataIndex: "minimum_fee",
            width: 110,
            render: (v: number) => v ? <span className="text-sm font-medium text-gray-700">PKR {v.toLocaleString()}</span> : <span className="text-gray-300">—</span>,
        },
        {
            title: "Joined",
            dataIndex: "created_at",
            width: 100,
            render: (v: string) => <span className="text-xs text-gray-400">{v ? new Date(v).toLocaleDateString() : "—"}</span>,
        },
        {
            title: "Actions",
            width: 110,
            render: (_: any, r: VetRow) => (
                <Space>
                    <Tooltip title="Edit vet">
                        <Button type="primary" size="small" icon={<EditOutlined />} style={{ background: PC, borderColor: PC }} onClick={() => openEditVet(r)} />
                    </Tooltip>
                    <Popconfirm title="Delete this vet?" description="This permanently deletes the vet account." onConfirm={() => handleDeleteVet(r.vet_id)} okButtonProps={{ danger: true }}>
                        <Tooltip title="Delete"><Button danger size="small" icon={<DeleteOutlined />} /></Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ══════════════════════════════════════════════════════════════════════
    // SHARED FORM SECTION — clinic fields
    // ══════════════════════════════════════════════════════════════════════

    const ClinicFormBody = () => (
        <Form form={clinicForm} layout="vertical" className="mt-3">
            <div className="flex gap-6 mb-2 items-start">
                <Form.Item label="Clinic Logo" className="mb-0 shrink-0">
                    <Upload
                        listType="picture-card"
                        fileList={logoFileList}
                        onChange={({ fileList: fl }) => setLogoFileList(fl)}
                        beforeUpload={() => false}
                        maxCount={1}
                        accept="image/*"
                    >
                        {logoFileList.length >= 1 ? null : (
                            <div className="flex flex-col items-center gap-1 text-gray-400">
                                <PlusOutlined /><span className="text-xs">Upload</span>
                            </div>
                        )}
                    </Upload>
                </Form.Item>
                <div className="flex-1 grid grid-cols-2 gap-x-4">
                    <Form.Item name="name" label="Clinic Name" rules={[{ required: true }]}>
                        <Input className="rounded-xl" />
                    </Form.Item>
                    <Form.Item name="city" label="City">
                        <Select allowClear placeholder="Select city">
                            {CITIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                        </Select>
                    </Form.Item>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4">
                <Form.Item name="address" label="Address" rules={[{ required: true }]} className="col-span-2">
                    <Input.TextArea rows={2} className="rounded-xl" />
                </Form.Item>
                <Form.Item name="category" label="Category">
                    <Input placeholder="e.g. Veterinary Clinic" className="rounded-xl" />
                </Form.Item>
                <Form.Item name="contact_number" label="Contact Number">
                    <Input prefix={<PhoneOutlined />} placeholder="+92..." className="rounded-xl" />
                </Form.Item>
                <Form.Item name="whatsapp_number" label="WhatsApp">
                    <Input prefix={<PhoneOutlined />} placeholder="+92..." className="rounded-xl" />
                </Form.Item>
                <Form.Item name="operating_hours" label="Operating Hours">
                    <Input prefix={<ClockCircleOutlined />} placeholder="9 AM – 9 PM" className="rounded-xl" />
                </Form.Item>
                <Form.Item name="google_maps_link" label="Google Maps Link">
                    <Input prefix={<EnvironmentOutlined />} placeholder="https://maps.google.com/..." className="rounded-xl" />
                </Form.Item>
                <Form.Item name="website" label="Website">
                    <Input prefix={<GlobalOutlined />} placeholder="https://..." className="rounded-xl" />
                </Form.Item>
                <Form.Item name="rating" label="Rating">
                    <InputNumber className="w-full" min={0} max={5} step={0.1} placeholder="4.5" />
                </Form.Item>
                <Form.Item name="total_reviews" label="Total Reviews">
                    <InputNumber className="w-full" min={0} placeholder="123" />
                </Form.Item>
                <Form.Item name="discount_details" label="Discount Details" className="col-span-2">
                    <Input.TextArea rows={2} placeholder="Paltuu exclusive discount..." className="rounded-xl" />
                </Form.Item>
                <Form.Item name="owner_email" label="Owner Email">
                    <Input placeholder="owner@example.com" className="rounded-xl" />
                </Form.Item>
                <Form.Item name="is_paltuu_partner" label="Paltuu Partner?" valuePropName="checked">
                    <Switch checkedChildren="Partner" unCheckedChildren="Regular" />
                </Form.Item>
            </div>
        </Form>
    );

    // ── Vet form body ─────────────────────────────────────────────────────

    const VetFormBody = () => (
        <Form form={vetForm} layout="vertical" className="mt-3">
            <h3 className="text-base font-bold text-gray-700 border-b pb-2 mb-3">User Details</h3>
            <div className="grid grid-cols-2 gap-4">
                <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                    <Input placeholder="Dr. John Doe" className="rounded-xl" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
                    <Input placeholder="doctor@example.com" disabled={!!editingVet} className="rounded-xl" />
                </Form.Item>
            </div>

            <h3 className="text-base font-bold text-gray-700 border-b pb-2 mb-3 mt-2">Professional Details</h3>
            <div className="grid grid-cols-2 gap-4">
                <Form.Item name="minimum_fee" label="Minimum Fee (PKR)">
                    <InputNumber className="w-full" min={0} />
                </Form.Item>
                <Form.Item name="contact_details" label="Contact Details">
                    <Input prefix={<PhoneOutlined />} placeholder="+92..." className="rounded-xl" />
                </Form.Item>
                <Form.Item name="license_number" label="License Number">
                    <Input placeholder="Vet License #" className="rounded-xl" />
                </Form.Item>
                <Form.Item name="specialization" label="Specialization">
                    <Input placeholder="Cats, Dogs, Exotic Birds" className="rounded-xl" />
                </Form.Item>
                <Form.Item name="qualifications" label="Qualifications" className="col-span-2">
                    <Input placeholder="DVM, M.Phil…" className="rounded-xl" />
                </Form.Item>
                <Form.Item name="bio" label="Biography" className="col-span-2">
                    <Input.TextArea rows={3} placeholder="About the vet…" className="rounded-xl" />
                </Form.Item>
                <Form.Item name="is_active" label="Active?" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
                </Form.Item>
            </div>

            <h3 className="text-base font-bold text-gray-700 border-b pb-2 mb-3 mt-2">Profile Picture</h3>
            <Upload
                listType="picture-card"
                fileList={vetFileList}
                onChange={({ fileList: fl }) => setVetFileList(fl)}
                beforeUpload={() => false}
                maxCount={1}
                accept="image/*"
            >
                {vetFileList.length >= 1 ? null : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                        <PlusOutlined /><span className="text-xs">Upload</span>
                    </div>
                )}
            </Upload>
            {!editingVet && (
                <p className="text-xs text-amber-600 mt-2">
                    ⚠️ A temporary password will be generated and shown once after creation.
                </p>
            )}
        </Form>
    );

    // ══════════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Page Header ── */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${PC}15` }}>
                        <MedicineBoxOutlined style={{ color: PC, fontSize: 20 }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Manage Clinics & Vets</h1>
                        <p className="text-sm text-gray-500">Create, edit, and link clinics with veterinarians</p>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    size="large"
                    items={[
                        {
                            key: "clinics",
                            label: (
                                <span className="flex items-center gap-2">
                                    <EnvironmentOutlined />
                                    Clinics
                                    <Tag color="default" className="ml-1">{total}</Tag>
                                </span>
                            ),
                            children: (
                                <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Toolbar */}
                                    <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
                                        <Input
                                            prefix={<SearchOutlined className="text-gray-400" />}
                                            placeholder="Search name or address…"
                                            allowClear
                                            className="w-64 rounded-xl"
                                            onChange={e => handleClinicSearch(e.target.value)}
                                        />
                                        <Select
                                            placeholder="Filter by city"
                                            allowClear
                                            className="w-40"
                                            onChange={v => { setCityFilter(v || ""); setPage(1); }}
                                        >
                                            {CITIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                                        </Select>
                                        <div className="ml-auto flex gap-2">
                                            <Button icon={<ReloadOutlined />} onClick={() => fetchClinics(page)} loading={loading}>Refresh</Button>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={openCreateClinic}
                                                style={{ background: PC, borderColor: PC }}
                                            >
                                                Add Clinic
                                            </Button>
                                        </div>
                                    </div>

                                    <Table
                                        dataSource={clinics}
                                        columns={clinicColumns}
                                        rowKey="clinic_id"
                                        loading={loading}
                                        scroll={{ x: 900 }}
                                        pagination={{
                                            current: page,
                                            pageSize,
                                            total,
                                            onChange: p => setPage(p),
                                            showSizeChanger: false,
                                            showTotal: t => `Total ${t} clinics`,
                                        }}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: "vets",
                            label: (
                                <span className="flex items-center gap-2">
                                    <UserOutlined />
                                    Vets
                                    <Tag color="default" className="ml-1">{vetsTotal}</Tag>
                                </span>
                            ),
                            children: (
                                <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Toolbar */}
                                    <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
                                        <Input
                                            prefix={<SearchOutlined className="text-gray-400" />}
                                            placeholder="Search name or email…"
                                            allowClear
                                            className="w-64 rounded-xl"
                                            onChange={e => handleVetSearch(e.target.value)}
                                        />
                                        <div className="ml-auto flex gap-2">
                                            <Button icon={<ReloadOutlined />} onClick={() => fetchVets(vetsPage)} loading={vetsTabLoading}>Refresh</Button>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={openCreateVet}
                                                style={{ background: PC, borderColor: PC }}
                                            >
                                                Add Vet
                                            </Button>
                                        </div>
                                    </div>

                                    <Table
                                        dataSource={allVets}
                                        columns={vetColumns}
                                        rowKey="vet_id"
                                        loading={vetsTabLoading}
                                        scroll={{ x: 800 }}
                                        pagination={{
                                            current: vetsPage,
                                            pageSize: 20,
                                            total: vetsTotal,
                                            onChange: p => setVetsPage(p),
                                            showSizeChanger: false,
                                            showTotal: t => `Total ${t} vets`,
                                        }}
                                    />
                                </div>
                            ),
                        },
                    ]}
                />
            </div>

            {/* ════════════════════════════════════════════════════
                CLINIC CREATE / EDIT MODAL
            ════════════════════════════════════════════════════ */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${PC}15` }}>
                            {editingClinic ? <EditOutlined style={{ color: PC }} /> : <PlusOutlined style={{ color: PC }} />}
                        </div>
                        <span>{editingClinic ? `Edit — ${editingClinic.name}` : "Add New Clinic"}</span>
                    </div>
                }
                open={clinicModal}
                onOk={handleSaveClinic}
                onCancel={() => setClinicModal(false)}
                confirmLoading={savingClinic}
                okText={editingClinic ? "Save Changes" : "Create Clinic"}
                okButtonProps={{ style: { background: PC, borderColor: PC } }}
                width={840}
                destroyOnClose
            >
                <ClinicFormBody />
            </Modal>

            {/* ════════════════════════════════════════════════════
                VET CREATE / EDIT MODAL
            ════════════════════════════════════════════════════ */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${PC}15` }}>
                            {editingVet ? <EditOutlined style={{ color: PC }} /> : <PlusOutlined style={{ color: PC }} />}
                        </div>
                        <span>{editingVet ? `Edit — ${editingVet.name}` : "Add New Vet"}</span>
                    </div>
                }
                open={vetModal}
                onOk={handleSaveVet}
                onCancel={() => setVetModal(false)}
                confirmLoading={savingVet}
                okText={editingVet ? "Save Changes" : "Create Vet"}
                okButtonProps={{ style: { background: PC, borderColor: PC } }}
                width={780}
                destroyOnClose
            >
                <VetFormBody />
            </Modal>

            {/* ════════════════════════════════════════════════════
                VETS DRAWER (per clinic)
            ════════════════════════════════════════════════════ */}
            <Drawer
                title={
                    <div className="flex items-center gap-3">
                        <Avatar
                            src={selectedClinic?.logo_url || undefined}
                            size={40}
                            shape="square"
                            style={{ background: `${PC}15`, borderRadius: 8, color: PC }}
                        >
                            {!selectedClinic?.logo_url && selectedClinic?.name?.[0]}
                        </Avatar>
                        <div>
                            <div className="font-bold text-gray-900 text-sm">{selectedClinic?.name}</div>
                            <div className="text-xs text-gray-400">{linkedVets.length} vet{linkedVets.length !== 1 ? "s" : ""} linked</div>
                        </div>
                    </div>
                }
                open={vetsDrawer}
                onClose={() => { setVetsDrawer(false); setSelectedClinic(null); setLinkedVets([]); }}
                width={560}
                extra={
                    <Button
                        type="primary"
                        icon={<LinkOutlined />}
                        style={{ background: PC, borderColor: PC }}
                        onClick={() => setLinkVetModal(true)}
                    >
                        Link Vet
                    </Button>
                }
            >
                {vetsLoading ? (
                    <div className="flex justify-center py-16"><Spin size="large" /></div>
                ) : linkedVets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                        <UserOutlined style={{ fontSize: 48, opacity: 0.2 }} />
                        <p className="text-sm">No vets linked to this clinic yet.</p>
                        <Button type="primary" icon={<LinkOutlined />} style={{ background: PC, borderColor: PC }} onClick={() => setLinkVetModal(true)}>
                            Link First Vet
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {linkedVets.map(vet => (
                            <div key={vet.vet_id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:border-rose-200 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={vet.profile_image_url || undefined}
                                            size={44}
                                            style={{ background: `${PC}15`, color: PC, flexShrink: 0 }}
                                        >
                                            {!vet.profile_image_url && vet.name?.[0]}
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                                {vet.name}
                                                {!vet.is_active && <Tag color="red" className="text-[10px]">Inactive</Tag>}
                                                {vet.is_primary_location && <Tag color="gold" className="text-[10px]">Primary</Tag>}
                                            </div>
                                            <div className="text-xs text-gray-500">{vet.email}</div>
                                            {vet.specialization && <div className="text-xs text-gray-400 mt-0.5">{vet.specialization}</div>}
                                        </div>
                                    </div>
                                    <Popconfirm title="Remove this vet from clinic?" onConfirm={() => handleUnlinkVet(vet.vet_id)} okButtonProps={{ danger: true }} okText="Remove">
                                        <Button size="small" danger icon={<DisconnectOutlined />} className="rounded-lg">Unlink</Button>
                                    </Popconfirm>
                                </div>
                                <Divider className="my-3" />
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                    {vet.consultation_fee && <div><span className="font-medium text-gray-700">Fee: </span>PKR {Number(vet.consultation_fee).toLocaleString()}</div>}
                                    {vet.schedule_notes && <div className="col-span-2"><span className="font-medium text-gray-700">Schedule: </span>{vet.schedule_notes}</div>}
                                    {vet.license_number && <div><span className="font-medium text-gray-700">License: </span>{vet.license_number}</div>}
                                    {vet.qualifications && <div><span className="font-medium text-gray-700">Qualifications: </span>{vet.qualifications}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Drawer>

            {/* ════════════════════════════════════════════════════
                LINK VET MODAL
            ════════════════════════════════════════════════════ */}
            <Modal
                title={<span><LinkOutlined style={{ color: PC }} /> Link Vet to {selectedClinic?.name}</span>}
                open={linkVetModal}
                onOk={handleLinkVet}
                onCancel={() => { setLinkVetModal(false); linkForm.resetFields(); }}
                confirmLoading={linking}
                okText="Link Vet"
                okButtonProps={{ style: { background: PC, borderColor: PC } }}
                width={540}
                destroyOnClose
            >
                <Form form={linkForm} layout="vertical" className="mt-4">
                    <Form.Item name="vet_id" label="Select Vet" rules={[{ required: true, message: "Please select a vet" }]}>
                        <Select
                            showSearch
                            placeholder="Search vet by name or email…"
                            optionFilterProp="label"
                            filterOption={(input, option) =>
                                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                            options={allVets
                                .filter(v => !linkedVets.some(lv => lv.vet_id === (v as any).vet_id))
                                .map(v => ({
                                    value: (v as any).vet_id,
                                    label: `${v.name} — ${v.email}`,
                                }))}
                        />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="consultation_fee" label="Consultation Fee (PKR)">
                            <InputNumber className="w-full" min={0} placeholder="e.g. 1500" />
                        </Form.Item>
                        <Form.Item name="is_primary_location" label="Primary Location?" valuePropName="checked">
                            <Switch checkedChildren="Yes" unCheckedChildren="No" />
                        </Form.Item>
                    </div>
                    <Form.Item name="schedule_notes" label="Schedule Notes">
                        <Input.TextArea rows={2} placeholder="Mon–Wed 5pm–8pm, Sat 10am–2pm" className="rounded-xl" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
