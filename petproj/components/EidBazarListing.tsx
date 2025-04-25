import React, { useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Upload, Button, message, Checkbox } from "antd";
import { UploadOutlined, UserOutlined, PhoneOutlined } from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

interface EidBazaarListingProps {
    onSubmit: (values: any) => void;
    onCancel: () => void;
}

const EidBazaarListing: React.FC<EidBazaarListingProps> = ({ onSubmit, onCancel }) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [callForPrice, setCallForPrice] = useState(false);


    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const listingData = {
                ...values,
                price: callForPrice ? null : values.price, // Set price to null if "Call for Price" is checked
                images: fileList.map(file => file.thumbUrl),
                status: "Available",
                id: `animal-${Date.now()}`
            };
            await onSubmit(listingData);
            message.success('Listing created successfully!');
            form.resetFields();
            setFileList([]);
            setCallForPrice(false);
            onCancel();
        } catch (error) {
            message.error('Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e;
        }
        return e && e.fileList;
    };

    return (
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

                <div className="grid grid-cols-2 gap-4">
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
{/* Vaccination Status (Required) */}
<Form.Item
  name="isVaccinated"
  label="Vaccination Status"
  rules={[{ required: true, message: "Please specify vaccination status" }]}
  valuePropName="checked"
>
  <Checkbox>
    This animal has been vaccinated
  </Checkbox>
</Form.Item>

{/* Teeth Count (Optional) */}
<Form.Item
  name="teethCount"
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

{/* Horn Condition (Optional) */}
<Form.Item
  name="hornCondition"
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
                    name="sellerContact"
                    label="Contact Number"
                    rules={[{
                        required: true,
                        pattern: new RegExp(/^[0-9]{11}$/),
                        message: "Please enter a valid 11-digit number"
                    }]}
                >
                    <Input placeholder="e.g. 03001234567" />
                </Form.Item>

                <Form.Item
                    name="sellerName"
                    label="Your Name"
                    rules={[{ required: true, message: "Please input your name" }]}
                >
                    <Input placeholder="e.g. Muhammad Ali" prefix={<UserOutlined />} />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <TextArea rows={3} placeholder="Describe the animal's features, health condition, etc." />
                </Form.Item>

                <Form.Item
                    name="images"
                    label="Upload Images (Max 8)"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[{ required: true, message: "Please upload at least one image" }]}
                >
                    <Upload
                        listType="picture-card"
                        fileList={fileList}
                        onChange={({ fileList }) => setFileList(fileList)}
                        beforeUpload={() => false}
                        accept="image/*"
                        multiple
                    >
                        {fileList.length >= 8 ? null : (
                            <div className="flex flex-col items-center">
                                <UploadOutlined className="text-primary" />
                                <div className="mt-1 text-sm">Upload</div>
                            </div>
                        )}
                    </Upload>
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
                     Create Listing
                </Button>
            </div>
        </Form>
    );
};

export default EidBazaarListing;