"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Switch, Upload, Button, message, InputNumber, Select, Space, Card } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

interface VetModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    initialData?: any;
    clinics: any[];
}

export default function VetModal({ visible, onCancel, onSuccess, initialData, clinics }: VetModalProps) {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                form.setFieldsValue({
                    ...initialData,
                    associated_clinics: initialData.associated_clinics || []
                });
                if (initialData.profile_image_url) {
                    setFileList([
                        {
                            uid: "-1",
                            name: "profile.png",
                            status: "done",
                            url: initialData.profile_image_url,
                        }
                    ]);
                } else {
                    setFileList([]);
                }
            } else {
                form.resetFields();
                setFileList([]);
            }
        }
    }, [visible, initialData, form]);

    const handleChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            let profile_image_url = initialData?.profile_image_url;

            // Handle image upload if there's a new file
            const newFile = fileList[0]?.originFileObj;
            if (newFile) {
                const formData = new FormData();
                formData.append("file", newFile as File);

                const uploadRes = await fetch("/api/admin/upload-image", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Image upload failed");
                const uploadData = await uploadRes.json();
                profile_image_url = uploadData.image_url;
            } else if (fileList.length === 0) {
                profile_image_url = null;
            }

            const payload = {
                ...values,
                profile_image_url,
                vet_id: initialData?.vet_id,
                user_id: initialData?.user_id
            };

            const method = initialData ? "PATCH" : "POST";
            const response = await fetch("/api/admin/vets", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to save vet");
            }

            message.success(`Vet ${initialData ? "updated" : "created"} successfully`);
            onSuccess();
        } catch (error: any) {
            message.error(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={initialData ? "Edit Vet" : "Add New Vet"}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={loading}
            width={900}
            destroyOnClose
        >
            <Form form={form} layout="vertical" className="mt-4">
                
                <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-2">User Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="name" label="Vet Full Name" rules={[{ required: true }]}>
                        <Input placeholder="Dr. John Doe" className="rounded-xl p-2" />
                    </Form.Item>

                    <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                        <Input placeholder="doctor@example.com" disabled={!!initialData} className="rounded-xl p-2" />
                    </Form.Item>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-2 mt-4">Professional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="minimum_fee" label="Minimum Fee (PKR)">
                        <InputNumber className="w-full rounded-xl" size="large" min={0} />
                    </Form.Item>

                    <Form.Item name="contact_details" label="Contact Details">
                        <Input placeholder="E.g. +92..." className="rounded-xl p-2" />
                    </Form.Item>

                    <Form.Item name="license_number" label="License Number">
                        <Input placeholder="Vet License Number" className="rounded-xl p-2" />
                    </Form.Item>

                    <Form.Item name="specialization" label="Specialization">
                        <Input placeholder="E.g. Cats, Dogs, Exotic Birds" className="rounded-xl p-2" />
                    </Form.Item>
                </div>

                <Form.Item name="qualifications" label="Qualifications">
                    <Input placeholder="E.g. DVM, M.Phil" className="rounded-xl p-2" />
                </Form.Item>

                <Form.Item name="bio" label="Biography">
                    <Input.TextArea placeholder="About the vet..." rows={3} className="rounded-xl p-2" />
                </Form.Item>

                <Form.Item name="is_active" label="Is Active?" valuePropName="checked">
                    <Switch defaultChecked />
                </Form.Item>

                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 mt-4">Clinic Associations</h3>
                <Form.List name="associated_clinics">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Card size="small" className="mb-4 bg-gray-50 border-gray-200 rounded-xl" key={key}>
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'clinic_id']}
                                            label="Clinic"
                                            rules={[{ required: true, message: 'Missing clinic' }]}
                                        >
                                            <Select placeholder="Select a clinic" className="w-full">
                                                {clinics.map(c => (
                                                    <Select.Option key={c.clinic_id} value={c.clinic_id}>
                                                        {c.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'consultation_fee']}
                                            label="Consultation Fee"
                                        >
                                            <InputNumber className="w-full" min={0} placeholder="PKR" />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'is_primary_location']}
                                            label="Primary Location?"
                                            valuePropName="checked"
                                        >
                                            <Switch />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'schedule_notes']}
                                            label="Schedule Notes"
                                        >
                                            <Input placeholder="E.g. Mon-Wed 5pm-8pm" />
                                        </Form.Item>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button 
                                            type="text" 
                                            danger 
                                            icon={<DeleteOutlined />} 
                                            onClick={() => remove(name)}
                                        >
                                            Remove Association
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="rounded-xl">
                                    Add Clinic Association
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <Form.Item label="Profile Picture">
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={handleChange}
                        beforeUpload={() => false}
                        maxCount={1}
                        accept="image/*"
                    >
                        {fileList.length >= 1 ? null : (
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                        )}
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
}
