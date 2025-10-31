"use client";
import React, { useState, useEffect } from "react";
import { Modal, Form, message, Button, Select, Input } from "antd";
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import {
  AcademicCapIcon,
  TagIcon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

interface Qualification {
    vet_qualifications_id: number;
    vet_id: number;
    qualification_id?: number;
    qualification_name: string;
    year_acquired: number;
    note: string;
    status: string;
}

interface Specialization {
    vet_id: number;
    category_id: number;
    category_name: string;
}

interface PetCategory {
    category_id: number;
    category_name: string;
}

const VetQualificationsTab = () => {
    const { data: session, status } = useSession();
    const { user } = useAuth();

    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [vetId, setVetId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [qualificationModalVisible, setQualificationModalVisible] = useState(false);
    const [specializationModalVisible, setSpecializationModalVisible] = useState(false);
    const [qualificationForm] = Form.useForm();
    const [specializationForm] = Form.useForm();
    const [availableQualifications, setAvailableQualifications] = useState<Array<{
        qualification_id: number;
        qualification_name: string;
    }>>([]);
    const [petCategories, setPetCategories] = useState<PetCategory[]>([]);
    const [submittingQualification, setSubmittingQualification] = useState(false);
    const [submittingSpecialization, setSubmittingSpecialization] = useState(false);
    const [deleting, setDeleting] = useState<{
        qualifications: number | null;
        specializations: number | null;
    }>({ qualifications: null, specializations: null });

    // Add state for delete confirmation modals
    const [qualificationDeleteConfirm, setQualificationDeleteConfirm] = useState(false);
    const [specializationDeleteConfirm, setSpecializationDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{
        type: 'qualification' | 'specialization' | null;
        id: number | null;
        name: string | null;
    }>({ type: null, id: null, name: null });

    // Get userId from session
    const userId = user?.id || (session?.user as any)?.user_id || null;

    useEffect(() => {
        // Wait for session to load
        if (status === "loading") {
            setLoading(true);
            return;
        }

        if (!userId) {
            setLoading(false);
            return;
        }

        const loadVetId = async () => {
            try {
                const res = await fetch(`/api/get-vet-id?user_id=${userId}`);
                if (!res.ok) throw new Error('Failed to fetch vet ID');
                const data = await res.json();
                setVetId(data.vet_id);
            } catch (error) {
                console.error("Error fetching vet ID:", error);
            }
        };

        loadVetId();
    }, [userId, status]);

    useEffect(() => {
        const fetchData = async () => {
            if (!vetId) return;

            try {
                const [qualificationsRes, specializationsRes] = await Promise.all([
                    fetch(`/api/vet-panel/qualifications/${vetId}`),
                    fetch(`/api/vet-panel/specialization/${vetId}`)
                ]);

                if (!qualificationsRes.ok) throw new Error('Failed to fetch qualifications');
                if (!specializationsRes.ok) throw new Error('Failed to fetch specializations');

                const [qualificationsData, specializationsData] = await Promise.all([
                    qualificationsRes.json(),
                    specializationsRes.json()
                ]);

                setQualifications(qualificationsData);
                setSpecializations(specializationsData);
            } catch (error) {
                console.error("Error fetching data:", error);
                message.error("Failed to load qualifications and specializations");
            } finally {
                setLoading(false);
            }
        };

        if (vetId) {
            fetchData();
        }
    }, [vetId]);

    const fetchAvailableQualifications = async () => {
        try {
            const response = await fetch('/api/qualifications');
            if (!response.ok) throw new Error('Failed to fetch qualifications');
            const data = await response.json();
            setAvailableQualifications(data);
        } catch (error) {
            console.error('Error fetching qualifications:', error);
            message.error('Could not load qualifications. Please try again.');
        }
    };

    const fetchPetCategories = async () => {
        try {
            const response = await fetch('/api/pet-categories');
            if (!response.ok) throw new Error('Failed to fetch pet categories');
            const data = await response.json();
            setPetCategories(data);
        } catch (error) {
            console.error('Error fetching pet categories:', error);
            message.error('Could not load pet categories. Please try again.');
        }
    };

    useEffect(() => {
        if (qualificationModalVisible) {
            fetchAvailableQualifications();
        }
    }, [qualificationModalVisible]);

    useEffect(() => {
        if (specializationModalVisible) {
            fetchPetCategories();
        }
    }, [specializationModalVisible]);

    const handleQualificationSubmit = async () => {
        if (submittingQualification || !vetId) return;
        setSubmittingQualification(true);

        try {
            const values = await qualificationForm.validateFields();

            const response = await fetch(`/api/vet-panel/qualifications/${vetId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("token") && {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    })
                },
                body: JSON.stringify({
                    qualification_id: values.qualification_id,
                    year_acquired: values.year_acquired,
                    note: values.note || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add qualification");
            }

            message.success("Qualification added successfully!");
            setQualificationModalVisible(false);
            qualificationForm.resetFields();

            // Refresh qualifications
            const res = await fetch(`/api/vet-panel/qualifications/${vetId}`);
            if (res.ok) {
                const data = await res.json();
                setQualifications(data);
            }
        } catch (error) {
            message.error({ content: "Failed to add qualification" });
        } finally {
            setSubmittingQualification(false);
        }
    };

    const handleSpecializationSubmit = async () => {
        if (submittingSpecialization || !vetId) return;
        setSubmittingSpecialization(true);

        try {
            const values = await specializationForm.validateFields();
            message.loading({ content: 'Adding specialization...', key: 'spec' });

            const res = await fetch(`/api/vet-panel/specialization/${vetId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category_id: values.category_id })
            });

            if (!res.ok) throw new Error('Failed to add specialization');

            setSpecializationModalVisible(false);
            specializationForm.resetFields();

            // Refresh specializations
            const refreshRes = await fetch(`/api/vet-panel/specialization/${vetId}`);
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setSpecializations(data);
            }

            message.success({
                content: "Specialization added successfully",
                key: 'spec',
                duration: 3
            });
        } catch (error) {
            console.error("Submission error:", error);
            message.error({ content: "Failed to add specialization" });
        } finally {
            setSubmittingSpecialization(false);
        }
    };

    // Show delete confirmation for qualification
    const showQualificationDeleteConfirm = (qualificationId: number, qualificationName: string) => {
        setItemToDelete({
            type: 'qualification',
            id: qualificationId,
            name: qualificationName
        });
        setQualificationDeleteConfirm(true);
    };

    // Show delete confirmation for specialization
    const showSpecializationDeleteConfirm = (categoryId: number, categoryName: string) => {
        setItemToDelete({
            type: 'specialization',
            id: categoryId,
            name: categoryName
        });
        setSpecializationDeleteConfirm(true);
    };

    // Handle qualification deletion
    const handleQualificationDelete = async () => {
        if (!vetId || itemToDelete.id === null) return;

        setDeleting(prev => ({ ...prev, qualifications: itemToDelete.id as number }));
        try {
            const res = await fetch(`/api/vet-panel/qualifications/${vetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qualification_id: itemToDelete.id })
            });
            if (!res.ok) throw new Error('Failed to delete qualification');

            // Remove from local state
            setQualifications(prev => prev.filter(q => q.vet_qualifications_id !== itemToDelete.id));
            message.success("Qualification deleted successfully");
        } catch (error) {
            console.error("Error deleting qualification:", error);
            message.error("Failed to delete qualification");
        } finally {
            setDeleting(prev => ({ ...prev, qualifications: null }));
            setQualificationDeleteConfirm(false);
            setItemToDelete({ type: null, id: null, name: null });
        }
    };

    // Handle specialization deletion
    const handleSpecializationDelete = async () => {
        if (!vetId || itemToDelete.id === null) return;

        setDeleting(prev => ({ ...prev, specializations: itemToDelete.id as number }));
        try {
            const res = await fetch(`/api/vet-panel/specialization/${vetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category_id: itemToDelete.id })
            });
            if (!res.ok) throw new Error('Failed to delete specialization');

            // Remove from local state
            setSpecializations(prev => prev.filter(s => s.category_id !== itemToDelete.id));
            message.success("Specialization deleted successfully");
        } catch (error) {
            console.error("Error deleting specialization:", error);
            message.error("Failed to delete specialization");
        } finally {
            setDeleting(prev => ({ ...prev, specializations: null }));
            setSpecializationDeleteConfirm(false);
            setItemToDelete({ type: null, id: null, name: null });
        }
    };

    // Cancel delete operation
    const handleDeleteCancel = () => {
        setQualificationDeleteConfirm(false);
        setSpecializationDeleteConfirm(false);
        setItemToDelete({ type: null, id: null, name: null });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-primary text-white p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Qualifications & Specializations</h2>
                        <p className="text-primary-100/90 mt-1">
                            Manage your professional qualifications and areas of expertise
                        </p>
                    </div>
                </div>
            </div>

            {/* Qualifications Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <AcademicCapIcon className="w-6 h-6 text-primary" />
                            Qualifications
                        </h3>
                        <p className="text-gray-500 mt-1">
                            Add your professional degrees and certifications
                        </p>
                    </div>
                    <button
                        onClick={() => setQualificationModalVisible(true)}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Qualification
                    </button>
                </div>

                {qualifications.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                        <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No qualifications added yet</p>
                        <button
                            onClick={() => setQualificationModalVisible(true)}
                            className="mt-3 text-primary hover:text-primary/80 font-medium"
                        >
                            Add your first qualification
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {qualifications.map((qualification) => (
                            <div key={qualification.vet_qualifications_id} className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-xl border border-primary/20 relative">
                                <button
                                    onClick={() => showQualificationDeleteConfirm(qualification.vet_qualifications_id, qualification.qualification_name)}
                                    className="absolute top-4 right-4 p-1.5 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200"
                                    title="Delete qualification"
                                    disabled={deleting.qualifications === qualification.vet_qualifications_id}
                                >
                                    {deleting.qualifications === qualification.vet_qualifications_id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                    ) : (
                                        <TrashIcon className="w-4 h-4" />
                                    )}
                                </button>

                                <span className={`absolute top-4 left-4 text-xs px-2.5 py-1 rounded-full ${qualification.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {qualification.status === 'approved' ? 'Approved' : 'Pending'}
                                </span>

                                <div className="mt-6 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                                            <AcademicCapIcon className="w-4 h-4" />
                                            Degree
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {qualification.qualification_name || "Not provided"}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                                                <CalendarIcon className="w-4 h-4" />
                                                Year
                                            </div>
                                            <p className="text-gray-800 font-medium">
                                                {qualification.year_acquired || "Not provided"}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                                                <DocumentTextIcon className="w-4 h-4" />
                                                Note
                                            </div>
                                            <p className="text-gray-800">
                                                {qualification.note || "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Specializations Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <TagIcon className="w-6 h-6 text-primary" />
                            Specializations
                        </h3>
                        <p className="text-gray-500 mt-1">
                            Add your areas of expertise and specializations
                        </p>
                    </div>
                    <button
                        onClick={() => setSpecializationModalVisible(true)}
                        className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Specialization
                    </button>
                </div>

                {specializations.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                        <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No specializations added yet</p>
                        <button
                            onClick={() => setSpecializationModalVisible(true)}
                            className="mt-3 text-primary hover:text-primary/80 font-medium"
                        >
                            Add your first specialization
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {specializations.map((spec) => (
                            <div key={spec.category_id} className="relative group">
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl border border-primary/20 flex items-center justify-between transition-all duration-200 hover:border-primary/40">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <TagIcon className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-gray-800 font-medium">{spec.category_name}</span>
                                    </div>
                                    <button
                                        onClick={() => showSpecializationDeleteConfirm(spec.category_id, spec.category_name)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        title="Delete specialization"
                                        disabled={deleting.specializations === spec.category_id}
                                    >
                                        {deleting.specializations === spec.category_id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                        ) : (
                                            <TrashIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Qualification Modal */}
            <Modal
                title={<div className="flex items-center gap-2 text-lg font-semibold"><AcademicCapIcon className="w-5 h-5 text-primary" /> Add Qualification</div>}
                visible={qualificationModalVisible}
                onCancel={() => setQualificationModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setQualificationModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleQualificationSubmit}
                        loading={submittingQualification}
                        className="bg-primary hover:bg-primary/90 border-primary"
                    >
                        Add Qualification
                    </Button>,
                ]}
                width={600}
            >
                <Form form={qualificationForm} layout="vertical" className="mt-4">
                    <Form.Item
                        name="qualification_id"
                        label="Qualification"
                        rules={[{ required: true, message: 'Please select a qualification' }]}
                    >
                        <Select
                            placeholder="Select a qualification"
                            size="large"
                        >
                            {availableQualifications.map((q) => (
                                <Select.Option
                                    key={q.qualification_id}
                                    value={q.qualification_id}
                                >
                                    {q.qualification_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="year_acquired"
                        label="Year Acquired"
                        rules={[{ required: true, message: 'Please enter year acquired' }]}
                    >
                        <Input
                            type="number"
                            placeholder="e.g. 2020"
                            size="large"
                            prefix={<CalendarIcon className="w-4 h-4 text-gray-400" />}
                        />
                    </Form.Item>

                    <Form.Item
                        name="note"
                        label="Additional Notes"
                    >
                        <Input.TextArea
                            placeholder="Any additional information about this qualification"
                            rows={4}
                            size="large"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Specialization Modal */}
            <Modal
                title={<div className="flex items-center gap-2 text-lg font-semibold"><TagIcon className="w-5 h-5 text-primary" /> Add Specialization</div>}
                visible={specializationModalVisible}
                onCancel={() => setSpecializationModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setSpecializationModalVisible(false)}>
                        Cancel
                    </Button>,
                    <Button
                        type="primary"
                        onClick={handleSpecializationSubmit}
                        loading={submittingSpecialization}
                        disabled={submittingSpecialization}
                        className="bg-primary hover:bg-primary/90 border-primary"
                    >
                        Add Specialization
                    </Button>
                ]}
                width={500}
            >
                <Form form={specializationForm} layout="vertical" className="mt-4">
                    <Form.Item
                        name="category_id"
                        label="Specialization"
                        rules={[{ required: true, message: 'Please select a specialization' }]}
                    >
                        <Select
                            placeholder="Select a specialization"
                            size="large"
                        >
                            {petCategories.map(category => (
                                <Select.Option key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Qualification Delete Confirmation Modal */}
            <Modal
                title={null}
                visible={qualificationDeleteConfirm}
                onCancel={handleDeleteCancel}
                footer={[
                    <Button key="cancel" onClick={handleDeleteCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="delete"
                        danger
                        onClick={handleQualificationDelete}
                        loading={deleting.qualifications !== null}
                        className="bg-red-500 hover:bg-red-600 border-red-500"
                    >
                        {deleting.qualifications !== null ? "Deleting..." : "Delete Qualification"}
                    </Button>,
                ]}
                width={400}
                closable={false}
            >
                <div className="flex flex-col items-center py-4">
                    <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Deletion</h3>
                    <p className="text-gray-600 text-center">
                        Are you sure you want to delete the qualification "{itemToDelete.name}"? This action cannot be undone.
                    </p>
                </div>
            </Modal>

            {/* Specialization Delete Confirmation Modal */}
            <Modal
                title={null}
                visible={specializationDeleteConfirm}
                onCancel={handleDeleteCancel}
                footer={[
                    <Button key="cancel" onClick={handleDeleteCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="delete"
                        danger
                        onClick={handleSpecializationDelete}
                        loading={deleting.specializations !== null}
                        className="bg-red-500 hover:bg-red-600 border-red-500"
                    >
                        {deleting.specializations !== null ? "Deleting..." : "Delete Specialization"}
                    </Button>,
                ]}
                width={400}
                closable={false}
            >
                <div className="flex flex-col items-center py-4">
                    <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Deletion</h3>
                    <p className="text-gray-600 text-center">
                        Are you sure you want to delete the specialization "{itemToDelete.name}"? This action cannot be undone.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default VetQualificationsTab;