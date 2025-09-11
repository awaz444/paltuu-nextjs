"use client";
import React, { useState, useEffect } from "react";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import { Modal, Form, message, Button, Select, Input } from "antd";

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
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [vetId, setVetId] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
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

    useEffect(() => {
        const loadVetId = async () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;

            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser?.id) return;

            try {
                const res = await fetch(`/api/get-vet-id?user_id=${parsedUser.id}`);
                if (!res.ok) throw new Error('Failed to fetch vet ID');
                const data = await res.json();
                setVetId(data.vet_id);
            } catch (error) {
                console.error("Error fetching vet ID:", error);
            }
        };

        loadVetId();
    }, []);

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

    const deleteQualification = async (qualificationId: number) => {
        if (!vetId) return;
        
        setDeleting(prev => ({ ...prev, qualifications: qualificationId }));
        try {
            const res = await fetch(`/api/vet-panel/qualifications/${vetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qualification_id: qualificationId })
            });
            if (!res.ok) throw new Error('Failed to delete qualification');
            
            // Remove from local state
            setQualifications(prev => prev.filter(q => q.vet_qualifications_id !== qualificationId));
            message.success("Qualification deleted successfully");
        } catch (error) {
            console.error("Error deleting qualification:", error);
            message.error("Failed to delete qualification");
        } finally {
            setDeleting(prev => ({ ...prev, qualifications: null }));
        }
    };

    const deleteSpecialization = async (categoryId: number) => {
        if (!vetId) return;
        
        setDeleting(prev => ({ ...prev, specializations: categoryId }));
        try {
            const res = await fetch(`/api/vet-panel/specialization/${vetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category_id: categoryId })
            });
            if (!res.ok) throw new Error('Failed to delete specialization');
            
            // Remove from local state
            setSpecializations(prev => prev.filter(s => s.category_id !== categoryId));
            message.success("Specialization deleted successfully");
        } catch (error) {
            console.error("Error deleting specialization:", error);
            message.error("Failed to delete specialization");
        } finally {
            setDeleting(prev => ({ ...prev, specializations: null }));
        }
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
            {/* Qualifications Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Qualifications</h2>
                    <button
                        onClick={() => setQualificationModalVisible(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
                    >
                        <PlusOutlined /> Add Qualification
                    </button>
                </div>

                {qualifications.length === 0 ? (
                    <p className="text-gray-500 py-4">
                        No qualifications added yet
                    </p>
                ) : (
                    <div className="space-y-4">
                        {qualifications.map((qualification) => (
                            <div key={qualification.vet_qualifications_id} className="border rounded-lg p-4 relative">
                                <button
                                    onClick={() => deleteQualification(qualification.vet_qualifications_id)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-all duration-200 ease-in-out hover:scale-125"
                                    title="Delete qualification"
                                    disabled={deleting.qualifications === qualification.vet_qualifications_id}
                                >
                                    {deleting.qualifications === qualification.vet_qualifications_id ? (
                                        <LoadingOutlined className="text-red-500" />
                                    ) : (
                                        '×'
                                    )}
                                </button>

                                <span className={`absolute top-2 right-10 text-xs px-2 py-1 rounded-full ${qualification.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {qualification.status === 'approved' ? 'Approved' : 'Pending'}
                                </span>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Degree</label>
                                        <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                                            {qualification.qualification_name || "Not provided"}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Note</label>
                                        <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                                            {qualification.note || "Not provided"}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Year</label>
                                        <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                                            {qualification.year_acquired || "Not provided"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Specializations Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Specializations</h2>
                    <button
                        onClick={() => setSpecializationModalVisible(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2"
                    >
                        <PlusOutlined /> Add Specialization
                    </button>
                </div>

                {specializations.length === 0 ? (
                    <p className="text-gray-500 py-4">No specializations added</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {specializations.map((spec) => (
                            <div key={spec.category_id} className="bg-primary/10 px-3 py-1 rounded-full relative">
                                <button
                                    onClick={() => deleteSpecialization(spec.category_id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700 transition-all duration-200 ease-in-out hover:scale-125"
                                    title="Delete specialization"
                                    disabled={deleting.specializations === spec.category_id}
                                >
                                    {deleting.specializations === spec.category_id ? (
                                        <LoadingOutlined className="text-white text-xs" />
                                    ) : (
                                        '×'
                                    )}
                                </button>
                                <span className="text-primary">{spec.category_name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Qualification Modal */}
            <Modal
                title="Add Qualification"
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
                    >
                        Add Qualification
                    </Button>,
                ]}
            >
                <Form form={qualificationForm} layout="vertical">
                    <Form.Item
                        name="qualification_id"
                        label="Qualification"
                        rules={[{ required: true, message: 'Please select a qualification' }]}
                    >
                        <Select placeholder="Select a qualification">
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
                        <Input type="number" placeholder="e.g. 2020" />
                    </Form.Item>

                    <Form.Item
                        name="note"
                        label="Additional Notes"
                    >
                        <Input.TextArea placeholder="Any additional information" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Specialization Modal */}
            <Modal
                title="Add Specialization"
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
                    >
                        Add Specialization
                    </Button>
                ]}
            >
                <Form form={specializationForm} layout="vertical">
                    <Form.Item
                        name="category_id"
                        label="Specialization"
                        rules={[{ required: true, message: 'Please select a specialization' }]}
                    >
                        <Select placeholder="Select a specialization">
                            {petCategories.map(category => (
                                <Select.Option key={category.category_id} value={category.category_id}>
                                    {category.category_name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default VetQualificationsTab;