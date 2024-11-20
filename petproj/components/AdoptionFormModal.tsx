'use client';
import React, { useState } from "react";
import { Modal, Form, Input, Select, Checkbox, DatePicker, Button, message } from "antd";

interface AdoptionFormProps {
    petId: number;
    userId: string;
    visible: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void; // Handle form submission
}

const AdoptionFormModal: React.FC<AdoptionFormProps> = ({ petId, userId, visible, onClose, onSubmit }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Combine additional fields
            const formData = {
                adoption_id: Date.now(), // Generate a unique ID for now
                user_id: userId,
                pet_id: petId,
                created_at: new Date().toISOString(),
                status: "Pending",
                ...values,
            };

            // Simulate API call or pass data to the parent component
            onSubmit(formData);
            message.success("Adoption form submitted successfully!");
            form.resetFields();
            onClose();
        } catch (err) {
            message.error("Please complete all required fields!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Adoption Form"
            visible={visible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleFormSubmit}>
                    Submit
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Adopter Name"
                    name="adopter_name"
                    rules={[{ required: true, message: "Please enter your name!" }]}
                >
                    <Input placeholder="Enter your full name" />
                </Form.Item>

                <Form.Item
                    label="Adopter Address"
                    name="adopter_address"
                    rules={[{ required: true, message: "Please enter your address!" }]}
                >
                    <Input.TextArea placeholder="Enter your address" rows={2} />
                </Form.Item>

                <Form.Item
                    label="Age of Youngest Child"
                    name="age_of_youngest_child"
                >
                    <Input placeholder="Enter age or 'N/A' if no children" />
                </Form.Item>

                <Form.Item
                    label="Other Pets Details"
                    name="other_pets_details"
                >
                    <Input.TextArea placeholder="Details about other pets, if any" rows={2} />
                </Form.Item>

                <Form.Item
                    label="Are Other Pets Neutered?"
                    name="other_pets_neutered"
                    valuePropName="checked"
                >
                    <Checkbox>Yes</Checkbox>
                </Form.Item>

                <Form.Item
                    label="Has Secure Outdoor Area?"
                    name="has_secure_outdoor_area"
                    valuePropName="checked"
                >
                    <Checkbox>Yes</Checkbox>
                </Form.Item>

                <Form.Item
                    label="Where Will the Pet Sleep?"
                    name="pet_sleep_location"
                >
                    <Input placeholder="e.g., Indoors, Doghouse, etc." />
                </Form.Item>

                <Form.Item
                    label="How Long Will the Pet Be Left Alone?"
                    name="pet_left_alone"
                >
                    <Input placeholder="e.g., 2 hours, Not at all, etc." />
                </Form.Item>

                <Form.Item
                    label="Additional Details"
                    name="additional_details"
                >
                    <Input.TextArea placeholder="Any other relevant information" rows={3} />
                </Form.Item>

                <Form.Item
                    name="agree_to_terms"
                    valuePropName="checked"
                    rules={[
                        { validator: (_, value) => (value ? Promise.resolve() : Promise.reject("You must agree to terms!")) },
                    ]}
                >
                    <Checkbox>I agree to the terms and conditions</Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AdoptionFormModal;
