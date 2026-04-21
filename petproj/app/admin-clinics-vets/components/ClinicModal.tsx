"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Switch, Upload, Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

interface ClinicModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export default function ClinicModal({ visible, onCancel, onSuccess, initialData }: ClinicModalProps) {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                form.setFieldsValue(initialData);
                if (initialData.logo_url) {
                    setFileList([
                        {
                            uid: "-1",
                            name: "logo.png",
                            status: "done",
                            url: initialData.logo_url,
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

            let logo_url = initialData?.logo_url;

            // Handle image upload if there's a new file
            const newFile = fileList[0]?.originFileObj;
            if (newFile) {
                const formData = new FormData();
                formData.append("file", newFile as File);

                const uploadRes = await fetch("/api/v1/admin/upload-image", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Image upload failed");
                const uploadData = await uploadRes.json();
                logo_url = uploadData.image_url;
            } else if (fileList.length === 0) {
                logo_url = null;
            }

            const payload = {
                ...values,
                logo_url,
                clinic_id: initialData?.clinic_id
            };

            const method = initialData ? "PATCH" : "POST";
            const response = await fetch("/api/v1/admin/clinics", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to save clinic");
            }

            message.success(`Clinic ${initialData ? "updated" : "created"} successfully`);
            onSuccess();
        } catch (error: any) {
            message.error(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={initialData ? "Edit Clinic" : "Add New Clinic"}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={loading}
            width={700}
            destroyOnClose
        >
            <Form form={form} layout="vertical" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="name" label="Clinic Name" rules={[{ required: true }]}>
                        <Input placeholder="Enter clinic name" className="rounded-xl p-2" />
                    </Form.Item>

                    <Form.Item name="address" label="Address" rules={[{ required: true }]}>
                        <Input placeholder="Enter physical address" className="rounded-xl p-2" />
                    </Form.Item>

                    <Form.Item name="contact_number" label="Contact Number">
                        <Input placeholder="E.g. +92..." className="rounded-xl p-2" />
                    </Form.Item>

                    <Form.Item name="whatsapp_number" label="WhatsApp Number">
                        <Input placeholder="E.g. +92..." className="rounded-xl p-2" />
                    </Form.Item>

                    <Form.Item name="google_maps_link" label="Google Maps Link">
                        <Input placeholder="URL to Google Maps" className="rounded-xl p-2" />
                    </Form.Item>

                    <Form.Item name="operating_hours" label="Operating Hours">
                        <Input placeholder="9 AM - 9 PM" className="rounded-xl p-2" />
                    </Form.Item>
                </div>

                <Form.Item name="discount_details" label="Discount Details">
                    <Input.TextArea placeholder="Any discount details for Paltuu app users..." rows={3} className="rounded-xl p-2" />
                </Form.Item>

                <Form.Item name="owner_email" label="Owner Email (User to link)">
                    <Input placeholder="Enter owner email to link/create user" className="rounded-xl p-2" />
                </Form.Item>

                <Form.Item name="is_paltuu_partner" label="Is Paltuu Partner?" valuePropName="checked">
                    <Switch />
                </Form.Item>

                <Form.Item label="Clinic Logo">
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={handleChange}
                        beforeUpload={() => false} // Prevent auto upload
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
