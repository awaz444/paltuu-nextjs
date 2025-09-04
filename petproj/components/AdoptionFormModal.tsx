"use client";
import React, { useState } from "react";
import { Modal, Form, Input, Checkbox, message, Collapse } from "antd";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface AdoptionFormProps {
    petId: number;
    userId: string;
    city: string;
    visible: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void;
}

const { Panel } = Collapse;

const AdoptionFormModal: React.FC<AdoptionFormProps> = ({
    petId,
    userId,
    city,
    visible,
    onClose,
    onSubmit,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
    
    useSetPrimaryColor();

    const handleFormSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Combine additional fields
            const formData = {
                user_id: userId,
                pet_id: petId,
                delivery_method: deliveryMethod,
                ...values,
            };

            // Call the API to save the application
            const response = await fetch('/api/adoption_application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const result = await response.json();
                message.success('Adoption form submitted successfully!');
                onSubmit(result);
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
            title="Adoption Application"
            visible={visible}
            onCancel={onClose}
            footer={null}
            className="rounded-lg"
            width={600}
        >
            <Form form={form} layout="vertical" className="p-4">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Your Name *
                    </label>
                    <Form.Item
                        name="adopter_name"
                        rules={[{ required: true, message: "Please enter your name!" }]}
                    >
                        <Input 
                            placeholder="Enter your full name" 
                            className="mt-1 p-3 w-full border rounded-2xl input-field"
                        />
                    </Form.Item>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Your Location/Area *
                    </label>
                    <Form.Item
                        name="adopter_address"
                        rules={[{ required: true, message: "Please enter your location!" }]}
                    >
                        <Input 
                            placeholder="Enter your general area or neighborhood" 
                            className="mt-1 p-3 w-full border rounded-2xl input-field"
                        />
                    </Form.Item>
                </div>

                <Collapse className="mb-4" defaultActiveKey={[]}>
                    <Panel header="Additional Details" key="1">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Age of Youngest Child
                            </label>
                            <Form.Item
                                name="age_of_youngest_child"
                                rules={[{
                                    validator: (_, value) => {
                                        if (!value || /^[0-9]+$/.test(value)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Please enter a valid number'));
                                    },
                                }]}
                            >
                                <Input 
                                    placeholder="Enter age of youngest child" 
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                />
                            </Form.Item>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Other Pets Details
                            </label>
                            <Form.Item name="other_pets_details">
                                <Input.TextArea
                                    placeholder="Details about other pets, if any"
                                    rows={2}
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                />
                            </Form.Item>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                <Form.Item name="other_pets_neutered" valuePropName="checked" className="mb-0">
                                    <Checkbox className="mr-2" />
                                </Form.Item>
                                Other Pets Neutered?
                            </label>
                            <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                <Form.Item name="has_secure_outdoor_area" valuePropName="checked" className="mb-0">
                                    <Checkbox className="mr-2" />
                                </Form.Item>
                                Secure Outdoor Area?
                            </label>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Where Will the Pet Sleep?
                            </label>
                            <Form.Item name="pet_sleep_location">
                                <Input 
                                    placeholder="e.g., Indoors, Doghouse, etc." 
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                />
                            </Form.Item>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                How Long Will the Pet Be Left Alone?
                            </label>
                            <Form.Item name="pet_left_alone">
                                <Input 
                                    placeholder="e.g., 2 hours, Not at all, etc." 
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                />
                            </Form.Item>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Additional Details
                            </label>
                            <Form.Item name="additional_details">
                                <Input.TextArea
                                    placeholder="Any other relevant information"
                                    rows={3}
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                />
                            </Form.Item>
                        </div>
                    </Panel>
                </Collapse>

                {city.toLowerCase().includes("karachi") && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Delivery Method *
                        </label>
                        <div className="w-full tab-switch-container mt-1 bg-gray-200 rounded-full p-1 flex relative">
                            <div 
                                className="tab-switch-slider bg-primary"
                                style={{
                                    transform: deliveryMethod === "pickup" ? "translateX(0)" : "translateX(100%)",
                                }}
                            />
                            <div 
                                className={`tab ${deliveryMethod === "pickup" ? "active" : ""}`}
                                onClick={() => setDeliveryMethod("pickup")}
                            >
                                I'll pick it up myself
                            </div>
                            <div 
                                className={`tab ${deliveryMethod === "delivery" ? "active" : ""}`}
                                onClick={() => setDeliveryMethod("delivery")}
                            >
                                Paltuu Special Delivery
                            </div>
                        </div>
                        {deliveryMethod === "delivery" && (
                            <p className="text-sm text-gray-500 mt-2 mx-auto text-center">
                                Our delivery service will bring your pet safely to your doorstep for <span className="text-primary font-bold">Rs. 500-1000</span>
                            </p>
                        )}
                    </div>
                )}

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <Form.Item
                        name="agree_to_terms"
                        valuePropName="checked"
                        rules={[{
                            validator: (_, value) =>
                                value ? Promise.resolve() : Promise.reject('You must agree to the terms'),
                        }]}
                    >
                        <div className="flex items-start">
                            <Checkbox className="mt-1 mr-2" />
                            <div>
                                <span className="text-sm">
                                    I agree to the{' '}
                                    <span className="text-primary font-medium">Terms and Conditions</span>
                                </span>
                                <div className="mt-2 text-xs text-gray-600">
                                    <p className="mb-1">By submitting this form, I agree to:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Provide a safe and loving environment for the pet</li>
                                        <li>Cover all necessary veterinary expenses</li>
                                        <li>Never abandon or rehome the pet without consultation</li>
                                        <li>Allow follow-up visits if required</li>
                                        <li>Be responsible for the pet's well-being</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </Form.Item>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-5 py-3 text-primary rounded-2xl font-semibold border border-primary bg-white transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleFormSubmit}
                        className="flex-1 px-5 py-3 bg-primary text-white rounded-2xl font-semibold border border-primary transition-colors duration-200"
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </Form>
        </Modal>
    );
};

export default AdoptionFormModal;