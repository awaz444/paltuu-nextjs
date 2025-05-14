import React, { useState } from "react";
import { Form, Input, InputNumber, Select, Button, message, Checkbox, Steps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import AnimalPhotosUpload from "./QurbaniAnimalUpload";

const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

interface EidBazaarListingProps {
    onSubmit: (values: any) => Promise<{ animalId: string }>;
    onCancel: () => void;
}

const EidBazaarListing: React.FC<EidBazaarListingProps> = ({ onSubmit, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [callForPrice, setCallForPrice] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [animalId, setAnimalId] = useState<string | null>(null);

    const onFinish = async (values: any) => {
        try {
            setLoading(true);

            // Prepare the data for submission
            const submissionData = {
                ...values,
                callForPrice: values.callForPrice || false,
                price: values.callForPrice ? null : values.price,
            };

            // Call the parent component's submit handler
            const response = await onSubmit(submissionData);

            // If you want to automatically proceed to photo upload:
            setAnimalId(response.animalId);
            setCurrentStep(1);
            message.success('Listing created! Now you can upload photos.');

            // OR if you want to close after submission:
            // message.success('Listing created successfully!');
            // onCancel();

        } catch (error) {
            // Errors are already handled by the parent component
        } finally {
            setLoading(false);
        }
    };
    const handlePhotosUploadComplete = () => {
        message.success('Listing with photos created successfully!');
        form.resetFields();
        setCallForPrice(false);
        onCancel();
    };

    const animalDetailsForm = (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
                species: "Goat",
                age: 2,
                weight: 40,
                city: "Karachi"
            }}
            className="px-2 space-y-4"
        >
            <div className="space-y-4">
                <Form.Item
                    name="species"
                    label="Animal Species"
                    rules={[{ required: true, message: "Please select species" }]}
                >
                    <Select className="w-full">
                        <Option value="Goat">Goat</Option>
                        <Option value="Cow">Cow</Option>
                        <Option value="Bull">Bull</Option>
                        <Option value="Sheep">Sheep</Option>
                        <Option value="Camel">Camel</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="breed"
                    label="Breed"
                    rules={[{ required: true, message: "Please input the breed" }]}
                >
                    <Input placeholder="e.g. Beetal, Sahiwal" />
                </Form.Item>

                <div className="grid grid-cols-3 gap-4">
                    <Form.Item
                        name="age"
                        label="Age (years)"
                        rules={[{ required: true, message: "Please input age" }]}
                    >
                        <InputNumber min={1} max={20} className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="weight"
                        label="Weight (kg)"
                        rules={[{ required: true, message: "Please input weight" }]}
                    >
                        <InputNumber min={1} max={1000} className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="height"
                        label="Height (cm)"
                        rules={[{ required: true, message: "Please input height" }]}
                    >
                        <InputNumber min={1} max={300} className="w-full" />
                    </Form.Item>
                </div>

                <Form.Item>
                    <Checkbox
                        checked={callForPrice}
                        onChange={(e) => setCallForPrice(e.target.checked)}
                        className="text-gray-700"
                    >
                        Call for Price
                    </Checkbox>
                </Form.Item>

                {!callForPrice && (
                    <Form.Item
                        name="price"
                        label="Price (PKR)"
                        rules={[{ required: !callForPrice, message: "Please input price" }]}
                    >
                        <InputNumber
                            min={1}
                            className="w-full"
                            disabled={callForPrice}
                        />
                    </Form.Item>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                        name="city"
                        label="City"
                        rules={[{ required: true, message: "Please input city" }]}
                    >
                        <Select className="w-full">
                            <Option value="Karachi">Karachi</Option>
                            <Option value="Lahore">Lahore</Option>
                            <Option value="Islamabad">Islamabad</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="location"
                        label="Area"
                        rules={[{ required: true, message: "Please input location" }]}
                    >
                        <Input placeholder="e.g. DHA, Gulshan" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="is_vaccinated"
                    label="Vaccination Status"
                    rules={[{ required: true, message: "Please specify vaccination status" }]}
                    valuePropName="checked"
                >
                    <Checkbox>
                        This animal has been vaccinated
                    </Checkbox>
                </Form.Item>

                <Form.Item
                    name="teeth_count"
                    label="Number of Teeth (for age verification)"
                    help="Leave blank if unsure"
                >
                    <InputNumber
                        min={0}
                        max={32}
                        className="w-full"
                        placeholder="e.g. 8"
                    />
                </Form.Item>

                <Form.Item
                    name="horn_condition"
                    label="Horn Condition"
                >
                    <Select
                        placeholder="Select condition"
                        allowClear
                        className="w-full"
                    >
                        <Option value="Good">Good - No damage</Option>
                        <Option value="Damaged">Damaged - Minor cracks</Option>
                        <Option value="Broken">Broken - Significant damage</Option>
                        <Option value="None">No horns</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <TextArea rows={3} placeholder="Describe the animal's features, health condition, etc." />
                </Form.Item>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button onClick={onCancel} className="px-6">
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="px-6"
                >
                    Next: Upload Photos
                </Button>
            </div>
        </Form>
    );

    const steps = [
        {
            title: 'Animal Details',
            content: animalDetailsForm,
        },
        {
            title: 'Upload Photos',
            content: animalId ? (
                <AnimalPhotosUpload
                    animalId={animalId}
                    onComplete={handlePhotosUploadComplete}
                    onBack={() => setCurrentStep(0)}
                />
            ) : null,
        },
    ];

    return (
        <div className="p-4">
            <Steps current={currentStep} className="mb-6">
                {steps.map(item => (
                    <Step key={item.title} title={item.title} />
                ))}
            </Steps>
            <div className="steps-content">{steps[currentStep].content}</div>
        </div>
    );
};

export default EidBazaarListing;