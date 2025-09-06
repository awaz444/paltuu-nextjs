import React, { useState } from "react";
import { Form, Input, InputNumber, Select, Button, message, Checkbox, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

interface BazaarProductFormProps {
    onSubmit: (values: any) => Promise<{ productId: string }>;
    onCancel: () => void;
    initialValues?: any;
    mode?: 'create' | 'edit';
}

const BazaarProductForm: React.FC<BazaarProductFormProps> = ({
    onSubmit,
    onCancel,
    initialValues = {},
    mode = 'create'
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const categories = [
        { value: 'food', label: 'Pet Food' },
        { value: 'toys', label: 'Toys & Entertainment' },
        { value: 'accessories', label: 'Accessories' },
        { value: 'health', label: 'Health & Care' },
        { value: 'grooming', label: 'Grooming' },
        { value: 'housing', label: 'Housing & Bedding' },
        { value: 'training', label: 'Training' },
        { value: 'travel', label: 'Travel & Transport' }
    ];

    const collections = [
        { value: 'dog', label: 'For Dogs' },
        { value: 'cat', label: 'For Cats' },
        { value: 'bird', label: 'For Birds' },
        { value: 'fish', label: 'For Fish' },
        { value: 'rabbit', label: 'For Rabbits' },
        { value: 'general', label: 'All Pets' }
    ];

    const onFinish = async (values: any) => {
        try {
            setLoading(true);

            const productData = {
                title: values.title,
                slug: values.slug || values.title?.toLowerCase().replace(/\s+/g, '-'),
                description: values.description,
                short_description: values.short_description,
                price: values.price,
                compare_at_price: values.compare_at_price,
                currency: values.currency || 'PKR',
                sku: values.sku,
                shipping_weight: values.shipping_weight,
                featured: values.featured || false,
                stock: values.stock,
                category: values.category,
                collection: values.collection,
                status: 'published'
            };

            const response = await onSubmit(productData);

            // Upload images if any
            if (fileList.length > 0 && response.productId) {
                const formData = new FormData();
                formData.append('product_id', response.productId);

                fileList.forEach((file) => {
                    if (file.originFileObj) {
                        formData.append('files', file.originFileObj);
                    }
                });

                try {
                    const imageResponse = await fetch('/api/bazaar/images', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!imageResponse.ok) {
                        message.warning('Product created but image upload failed');
                    } else {
                        message.success('Product and images uploaded successfully!');
                    }
                } catch (imageError) {
                    message.warning('Product created but image upload failed');
                }
            } else {
                message.success(`Product ${mode}d successfully!`);
            }

            form.resetFields();
            setFileList([]);
            onCancel();

        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    const uploadProps: UploadProps = {
        fileList,
        beforeUpload: () => false, // Prevent auto upload
        onChange: ({ fileList: newFileList }) => setFileList(newFileList),
        multiple: true,
        accept: 'image/*',
    };

    return (
        <div className="p-4">
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    currency: 'PKR',
                    featured: false,
                    status: 'published',
                    ...initialValues
                }}
                className="space-y-4"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                        name="title"
                        label="Product Title"
                        rules={[{ required: true, message: "Please enter product title" }]}
                    >
                        <Input placeholder="e.g. Premium Dog Food 5kg" />
                    </Form.Item>

                    <Form.Item
                        name="sku"
                        label="SKU (Stock Keeping Unit)"
                        rules={[{ required: true, message: "Please enter SKU" }]}
                    >
                        <Input placeholder="e.g. DOG-FOOD-001" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="short_description"
                    label="Short Description"
                    rules={[{ required: true, message: "Please enter short description" }]}
                >
                    <Input placeholder="Brief product summary for listing cards" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Full Description"
                >
                    <TextArea rows={4} placeholder="Detailed product description, ingredients, benefits, etc." />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: "Please select category" }]}
                    >
                        <Select placeholder="Select category">
                            {categories.map(cat => (
                                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="collection"
                        label="Collection (Pet Type)"
                        rules={[{ required: true, message: "Please select collection" }]}
                    >
                        <Select placeholder="Select pet type">
                            {collections.map(col => (
                                <Option key={col.value} value={col.value}>{col.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="stock"
                        label="Stock Quantity"
                        rules={[{ required: true, message: "Please enter stock quantity" }]}
                    >
                        <InputNumber min={0} className="w-full" placeholder="Available quantity" />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                        name="price"
                        label="Price (PKR)"
                        rules={[{ required: true, message: "Please enter price" }]}
                    >
                        <InputNumber
                            min={0}
                            className="w-full"
                            placeholder="Current selling price"
                        />
                    </Form.Item>

                    <Form.Item
                        name="compare_at_price"
                        label="Compare At Price (PKR)"
                        help="Original price to show discount"
                    >
                        <InputNumber
                            min={0}
                            className="w-full"
                            placeholder="Original price (optional)"
                        />
                    </Form.Item>

                    <Form.Item
                        name="shipping_weight"
                        label="Shipping Weight (kg)"
                        help="For delivery cost calculation"
                    >
                        <InputNumber
                            min={0}
                            step={0.1}
                            className="w-full"
                            placeholder="Weight in kg"
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="featured"
                    valuePropName="checked"
                >
                    <Checkbox>
                        Featured Product (show prominently on homepage)
                    </Checkbox>
                </Form.Item>

                <Form.Item
                    label="Product Images"
                    help="Upload multiple images. First image will be the main display image."
                >
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>
                            Select Images
                        </Button>
                    </Upload>
                </Form.Item>

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
                        {mode === 'create' ? 'Create Product' : 'Update Product'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default BazaarProductForm;
