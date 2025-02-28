'use client';
import React, { useState } from "react";
import { Modal, Form, Input, Checkbox, DatePicker, Button, message } from "antd";
import dayjs, { Dayjs } from "dayjs";

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
                user_id: userId,
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
    const [startDate, setStartDate] = useState<Dayjs | null>(null);

    // Disable dates before the current system date for the start date picker
    const disabledStartDate = (current: Dayjs): boolean => {
        return current && current < dayjs().startOf("day");
    };

    // Disable dates before the selected start date for the end date picker
    const disabledEndDate = (current: Dayjs): boolean => {
        return current && startDate ? current.isBefore(startDate.startOf("day")) : false;
    };

    return (
        <Modal
            title="Foster Form"
            visible={visible}
            onCancel={onClose}
            footer={[
                <button
                    key="cancel"
                    onClick={onClose}
                    className="bg-white text-primary px-4 py-1 text-md rounded-xl font-semibold border border-primary cursor-pointer"
                >
                    Cancel
                </button>,
                <button
                    key="submit"
                    onClick={handleFormSubmit}
                    className="bg-primary border border-primary text-white px-4 py-1 text-md rounded-xl font-semibold border-white hover:bg-white hover:text-primary hover:border-primary transition-all ml-4"
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>,
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
                    <DatePicker
                        style={{ width: "100%" }}
                        disabledDate={disabledStartDate}
                        onChange={(date) => setStartDate(date)} // Save selected start date
                    />
                </Form.Item>

                {/* Foster End Date */}
                <Form.Item
                    label="Foster End Date"
                    name="foster_end_date"
                    rules={[{ required: true, message: "Please select an end date!" }]}
                >
                    <DatePicker
                        style={{ width: "100%" }}
                        disabledDate={disabledEndDate}
                    />
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
                    rules={[
                        {
                            validator: (_, value) => {
                                if (value === null || value === undefined || /^[0-9]+$/.test(value)) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Please enter a valid integer'));
                            },
                        },
                    ]}
                >
                    <Input placeholder="Enter age of youngest child" />
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
                        {
                            validator: (_, value) =>
                                value ? Promise.resolve() : Promise.reject('You must agree to the fostering agreement'),
                        },
                    ]}
                >
                    <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                        <Checkbox>
                            I agree to the{' '}
                            <span className="text-primary font-medium">Terms & Conditions</span>
                        </Checkbox>

                        <div className="mt-3 text-sm text-gray-600">
                            <p className="mb-2">By submitting this form, I agree to:</p>
                            <ul className="list-disc pl-4 space-y-2">
                                <li>Provide a safe and nurturing temporary home for the pet</li>
                                <li>Ensure the pet receives appropriate care and veterinary attention during the fostering period</li>
                                <li>Consult with the rescue organization or owner before making any permanent rehoming decisions</li>
                                <li>Allow periodic follow-up visits from the rescue organization or owner</li>
                                <li>Maintain the pet's overall health and well-being while in foster care</li>
                            </ul>
                        </div>
                    </div>
                </Form.Item>

            </Form>
        </Modal>
    );
};

export default FosterFormModal;
