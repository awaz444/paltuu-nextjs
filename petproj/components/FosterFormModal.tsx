'use client';
import React, { useState } from "react";
import { Modal, Form, Input, Checkbox, DatePicker, Button, message } from "antd";

interface FosterFormProps {
    petId: number;
    userId: string;
    visible: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void; // Handle form submission
}

const FosterFormModal: React.FC<FosterFormProps> = ({ petId, userId, visible, onClose, onSubmit }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Prepare the form data
            const formData = {
                foster_id: Date.now(), // Simulate unique ID
                user_id: 1,
                pet_id: petId,
                ...values,
            };

            // Call the API to save the application
            const response = await fetch('/api/foster_application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const result = await response.json();
                message.success('Foster form submitted successfully!');
                onSubmit(result); // Notify parent component
                form.resetFields();
                onClose();
            } else {
                const error = await response.json();
                message.error(error.message || 'Failed to submit form');
            }
        } catch (err) {
            message.error('Please complete all required fields!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Foster Form"
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
                    label="Fosterer Name"
                    name="fosterer_name"
                    rules={[{ required: true, message: "Please enter your name!" }]}
                >
                    <Input placeholder="Enter your full name" />
                </Form.Item>

                <Form.Item
                    label="Fosterer Address"
                    name="fosterer_address"
                    rules={[{ required: true, message: "Please enter your address!" }]}
                >
                    <Input.TextArea placeholder="Enter your address" rows={2} />
                </Form.Item>

                <Form.Item
                    label="Foster Start Date"
                    name="foster_start_date"
                    rules={[{ required: true, message: "Please select a start date!" }]}
                >
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Foster End Date"
                    name="foster_end_date"
                    rules={[{ required: true, message: "Please select an end date!" }]}
                >
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label="Fostering Experience"
                    name="fostering_experience"
                >
                    <Input.TextArea placeholder="Describe your fostering experience, if any" rows={3} />
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
                    label="How Much Time Will You Spend at Home?"
                    name="time_at_home"
                >
                    <Input placeholder="e.g., Full-time, 4 hours daily, etc." />
                </Form.Item>

                <Form.Item
                    label="Reason for Fostering"
                    name="reason_for_fostering"
                >
                    <Input.TextArea placeholder="Explain why you want to foster this pet" rows={3} />
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
                    <Checkbox>
                        I agree to the terms and conditions, including:
                        <ul style={{ marginLeft: "20px", marginTop: "10px" }}>
                            <li>Providing a safe and secure environment for the pet.</li>
                            <li>Ensuring the pet's basic needs, including food and water, are met.</li>
                            <li>Not leaving the pet alone for extended periods.</li>
                            <li>Returning the pet to the shelter when the foster period ends.</li>
                        </ul>
                    </Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default FosterFormModal;
