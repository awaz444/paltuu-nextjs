import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Checkbox,
  Upload,
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";

const { Option } = Select;
const { TextArea } = Input;

interface BazaarProductFormProps {
  onSubmit: (values: any) => Promise<{ productId: string } | any>;
  onCancel: () => void;
  initialValues?: any;
  mode?: "create" | "edit";
}

const BazaarProductForm: React.FC<BazaarProductFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  mode = "create",
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // per-variant files (store actual File objects, not uploaded)
  const [variantFiles, setVariantFiles] = useState<
    Record<number, File[]>
  >({});
  // store preview uploads (existing images from DB) per variant: { url, name, publicUrl, path }
  const [variantPreviewUploads, setVariantPreviewUploads] = useState<
    Record<number, Array<{ url?: string; publicUrl?: string; path?: string; name?: string }>>
  >({});
  // track upload state per variant
  const [variantUploading, setVariantUploading] = useState<
    Record<number, boolean>
  >({});

  const [categories, setCategories] = useState<
    Array<{ value: number | string; label: string }>
  >([]);
  const [collections, setCollections] = useState<
    Array<{ value: number | string; label: string }>
  >([]);

  const [variants, setVariants] = useState<any[]>((initialValues?.variants) || []);
  // attributes define variant axes (e.g., Color, Size)
  const [attributes, setAttributes] = useState<
    Array<{ key: string; values: string[] }>
  >([]);
  // columns define the editable fields for each generated variant
  const [columns, setColumns] = useState<Array<{ key: string; label: string; isAttribute?: boolean }>>(
    () => {
      return [
        { key: "price_override", label: "Price" },
        { key: "compare_at_price", label: "Compare At Price" },
        { key: "stock", label: "Stock" },
        { key: "weight_override", label: "Weight (kg)" },
      ];
    }
  );
  const [status, setStatus] = useState<string>(initialValues?.status || "draft");
  const [generating, setGenerating] = useState(false);
  const [titleValue, setTitleValue] = useState<string>(initialValues?.title || '');

  useEffect(() => {
    // load categories/collections from server-side endpoints
    (async () => {
      try {
        const [catRes, colRes] = await Promise.all([
          fetch("/api/bazaar/categories"),
          fetch("/api/bazaar/collections"),
        ]);
        if (catRes.ok) {
          const cats = await catRes.json();
          setCategories(
            cats.map((c: any) => ({ value: c.category_id, label: c.name }))
          );
        }
        if (colRes.ok) {
          const cols = await colRes.json();
          setCollections(
            cols.map((c: any) => ({ value: c.collection_id, label: c.name }))
          );
        }
      } catch (err) {
        // silently fail; admin can still create product
      }
    })();
  }, []);

  useEffect(() => {
    // map initial values into form
    const vals: any = {
      title: initialValues?.title || undefined,
      // short_description: initialValues?.short_description || undefined,
      description: initialValues?.description || undefined,
      featured: initialValues?.featured || false,
      currency: initialValues?.currency || "PKR",
      status: initialValues?.status || "draft",
    };

    if (Array.isArray(initialValues?.categories)) {
      vals.category_ids = initialValues.categories.map(
        (c: any) => c.category_id
      );
    } else if (initialValues?.category_ids) {
      vals.category_ids = initialValues.category_ids;
    }

    if (initialValues?.collection_id) {
      vals.collection_ids = [initialValues.collection_id];
    } else if (initialValues?.collection_ids) {
      vals.collection_ids = initialValues.collection_ids;
    }

    form.setFieldsValue(vals);
    if (Array.isArray(initialValues?.variants)) {
      setVariants(
        initialValues.variants.map((v: any) => ({
          price_override: v.price_override,
          compare_at_price: v.compare_at_price ?? null,
          stock: v.stock,
          weight_override: v.weight_override,
          attributes: v.attributes || {},
          is_default: v.is_default || false,
        }))
      );

      // populate preview uploads from initial variant images (array of URLs)
      const previews: Record<number, Array<{ url?: string; publicUrl?: string; path?: string; name?: string }>> = {};
      (initialValues?.variants || []).forEach((v: any, idx: number) => {
        if (v.images && Array.isArray(v.images) && v.images.length > 0) {
          previews[idx] = v.images.map((imgUrl: string, i: number) => ({ url: imgUrl, publicUrl: imgUrl, name: imgUrl.split('/').pop() || `img_${i}` }));
        }
      });
      setVariantPreviewUploads(previews);
    }
  }, [initialValues, form]);

  // If initial values include attribute axes, populate attributes state
  useEffect(() => {
    if (initialValues?.attributes && Array.isArray(initialValues.attributes)) {
      // expected shape: [{ key: 'Color', values: ['Red','Blue'] }, ...]
      setAttributes(
        initialValues.attributes.map((a: any) => ({
          key: a.key,
          values: a.values || [],
        }))
      );
    }
  }, [initialValues]);

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      {
        price_override: null,
        compare_at_price: null,
        stock: 0,
        weight_override: null,
        attributes: {},
        is_default: prev.length === 0,
      },
    ]);

  const removeVariant = (idx: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== idx));

  const updateVariant = (idx: number, patch: any) =>
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, ...patch } : v))
    );

  const addColumn = (label = "Attribute") => {
    // create a safe key
    const keyBase = label.trim().replace(/[^a-zA-Z0-9]+/g, "_") || "attr";
    let key = keyBase;
    let suffix = 1;
    while (columns.find((c) => c.key === key)) {
      key = `${keyBase}_${suffix++}`;
    }
    setColumns((prev) => [...prev, { key, label, isAttribute: true }]);
  };

  const updateColumnLabel = (colKey: string, newLabel: string) =>
    setColumns((prev) =>
      prev.map((c) => (c.key === colKey ? { ...c, label: newLabel } : c))
    );

  const removeColumn = (colKey: string) => {
    // protect core columns
    const core = [
      "price_override",
      "compare_at_price",
      "stock",
      "weight_override",
    ];
    if (core.includes(colKey)) return;
    setColumns((prev) => prev.filter((c) => c.key !== colKey));
    setVariants((prev) =>
      prev.map((v) => {
        const next = { ...v };
        if (next.attributes) delete next.attributes[colKey];
        delete next[colKey];
        return next;
      })
    );
  };

  const updateCell = (rowIdx: number, colKey: string, value: any) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== rowIdx) return v;
        const next = { ...v };
        // if column is attribute, store in attributes
        const col = columns.find((c) => c.key === colKey);
        if (col?.isAttribute) {
          next.attributes = { ...(next.attributes || {}) };
          next.attributes[colKey] = value;
        } else {
          next[colKey] = value;
        }
        return next;
      })
    );
  };

  const variantUploadProps = (idx: number): UploadProps => ({
    multiple: true,
    beforeUpload: (file) => {
      console.log(`=== UPLOAD BUTTON CLICKED FOR VARIANT ${idx} ===`);
      console.log(`Adding file to variant ${idx}:`, { name: file.name, size: file.size, type: file.type });
      setVariantFiles(prev => {
        console.log(`Previous variantFiles:`, prev);
        const currentFiles = prev[idx] || [];
        console.log(`Current files for variant ${idx}:`, currentFiles.map(f => f.name));

        // Check if file already exists to avoid duplicates
        const fileExists = currentFiles.some(f => f.name === file.name && f.size === file.size);
        if (fileExists) {
          console.log(`File ${file.name} already exists for variant ${idx}`);
          return prev;
        }

        const updated = {
          ...prev,
          [idx]: [...currentFiles, file]
        };
        console.log(`Updated variantFiles for variant ${idx}:`, updated[idx]?.map(f => f.name));
        console.log(`Total files for variant ${idx}:`, updated[idx]?.length);
        return updated;
      });
      return false; // Prevent automatic upload
    },
    onRemove: (uploadFile) => {
      console.log(`=== REMOVING FILE FROM VARIANT ${idx} ===`);
      console.log(`Removing file from variant ${idx}:`, uploadFile.name, uploadFile.uid);
      // If uid indicates a preview item, remove from preview uploads
      if (String(uploadFile.uid || '').startsWith('preview-')) {
        setVariantPreviewUploads(prev => {
          const updated = { ...prev };
          updated[idx] = (updated[idx] || []).filter(p => `preview-${(updated[idx] || []).indexOf(p)}-${(p.name || p.publicUrl || p.url)}` !== uploadFile.uid);
          return updated;
        });
        return true;
      }
      // Otherwise it's a local file; remove from variantFiles
      setVariantFiles(prev => {
        const updated = {
          ...prev,
          [idx]: (prev[idx] || []).filter(f => {
            const fileUid = `${f.name}-${f.size}`;
            return fileUid !== uploadFile.uid;
          })
        };
        console.log(`Updated variantFiles for variant ${idx} after removal:`, updated[idx]?.map(f => f.name));
        console.log(`Remaining files count for variant ${idx}:`, updated[idx]?.length);
        return updated;
      });
      return true;
    },
    fileList: [
      // existing preview images (from DB)
      ...(variantPreviewUploads[idx] || []).map((p, i) => ({
        uid: `preview-${i}-${(p.name || p.publicUrl || p.url)}`,
        name: p.name || p.publicUrl?.split('/').pop() || `img_${i}`,
        status: 'done' as const,
        url: p.publicUrl || p.url,
        originFileObj: undefined,
        isPreview: true,
      })),
      // newly selected local files
      ...(variantFiles[idx] || []).map((file, fileIndex) => ({
        uid: `${file.name}-${file.size}`,
        name: file.name,
        status: 'done' as const,
        originFileObj: file as any,
      }))
    ],
    accept: "image/*",
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
    },
  });

  const handleSubmit = async (values: any) => {
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form values:', values);
    console.log('Current variants:', variants);
    console.log('Current variantFiles:', variantFiles);

    if (!variants || variants.length === 0) {
      message.error("Please add at least one variant with price and stock.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: values.title,
        slug: values.slug || values.title?.toLowerCase().replace(/\s+/g, "-"),
        description: values.description,
        // short_description: values.short_description,
        compare_at_price: values.compare_at_price ?? null,
        currency: values.currency || "PKR",
        sku: values.sku || null,
        shipping_weight: values.shipping_weight ?? null,
        featured: values.featured || false,
        category_ids: values.category_ids || [],
        collection_ids: values.collection_ids || [],
        variants: variants.map((v: any) => ({
          price_override: v.price_override,
          compare_at_price: v.compare_at_price ?? null,
          stock: v.stock,
          weight_override: v.weight_override,
          attributes: v.attributes || {},
        })),
        status: values.status || "draft",
      };

      console.log('Payload to be sent:', payload);

      // Create product first
      console.log('Calling onSubmit with payload...');
      const res = await onSubmit(payload);
      console.log('Product creation response:', res);

      if (!res?.productId) {
        throw new Error('Product creation failed - no product ID returned');
      }

      const productId = String(res.productId);
      console.log('Product created successfully:', { productId, variants: res?.variants });

      // Upload variant-specific images
      console.log('=== STARTING IMAGE UPLOAD PROCESS ===');
      console.log('Current variantFiles state:', variantFiles);
      console.log('Response variants:', res?.variants);

      if (res?.variants && Array.isArray(res.variants)) {
        console.log(`Found ${res.variants.length} variants in response`);
        for (let variantIndex = 0; variantIndex < res.variants.length; variantIndex++) {
          const variant = res.variants[variantIndex];
          const files = variantFiles[variantIndex];

          console.log(`Processing variant ${variantIndex}:`, {
            variant_id: variant?.variant_id,
            filesCount: files?.length || 0,
            files: files?.map(f => f.name) || []
          });

          if (files && files.length > 0 && variant?.variant_id) {
            try {
              console.log(`=== UPLOADING ${files.length} files for variant ${variantIndex} ===`);
              const fd = new FormData();
              files.forEach(file => {
                console.log(`Adding file to FormData: ${file.name}`);
                fd.append('files', file);
              });
              fd.append('product_id', productId);
              fd.append('variant_id', String(variant.variant_id));

              console.log('Making API call to /api/bazaar/images...');
              const uploadRes = await fetch('/api/bazaar/images', {
                method: 'POST',
                body: fd
              });

              const uploadJson = await uploadRes.json();
              console.log(`Variant ${variantIndex} images upload result:`, uploadJson);

              if (!uploadRes.ok) {
                console.error(`Variant ${variantIndex} images upload failed:`, uploadJson);
                message.warning(`Variant ${variantIndex + 1} image upload failed: ${uploadJson?.error || 'Unknown error'}`);
              } else {
                message.success(`Uploaded ${uploadJson?.inserted?.length || 0} images for variant ${variantIndex + 1}`);
              }
            } catch (err) {
              console.error(`Variant ${variantIndex} images upload error:`, err);
              message.warning(`Variant ${variantIndex + 1} image upload failed`);
            }
          } else {
            console.log(`Skipping variant ${variantIndex}: ${!files ? 'no files' : files.length === 0 ? 'empty files array' : 'no variant_id'}`);
          }
        }
      } else {
        console.log('No variants found in response or variants is not an array:', res?.variants);
      }

      // Re-attach preserved preview images (existing images from DB) to newly created/updated variants
      try {
        const attachments: any[] = [];
        if (res?.variants && Array.isArray(res.variants)) {
          res.variants.forEach((variant: any, idx: number) => {
            const previews = variantPreviewUploads[idx] || [];
            if (previews.length > 0) {
              previews.forEach(p => {
                // only include items that have a publicUrl or url
                if (p.publicUrl || p.url) {
                  attachments.push({ product_id: productId, variant_id: variant.variant_id, path: p.path || undefined, publicUrl: p.publicUrl || p.url, url: p.url });
                }
              });
            }
          });
        }
        if (attachments.length > 0) {
          const attachRes = await fetch('/api/bazaar/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attachments })
          });
          const attachJson = await attachRes.json();
          console.log('Attach-by-path result:', attachJson);
          if (!attachRes.ok) {
            message.warning('Attaching existing images to variants failed');
          }
        }
      } catch (e) {
        console.error('Failed to reattach preview images', e);
      }

      message.success("Product saved with images");
      form.resetFields();
      setVariants([]);
      setVariantFiles({});
  setVariantPreviewUploads({});
      onCancel();
    } catch (err: any) {
      message.error(err?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  // ---------- New attribute-driven variant generation helpers ----------
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValues, setNewAttrValues] = useState("");

  const addAttribute = () => {
    const key = (newAttrKey || "").trim();
    const vals = (newAttrValues || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!key || vals.length === 0)
      return message.error(
        "Please enter attribute name and comma-separated values"
      );
    if (attributes.find((a) => a.key.toLowerCase() === key.toLowerCase()))
      return message.error("Attribute already exists");
    setAttributes((prev) => [...prev, { key, values: vals }]);
    setNewAttrKey("");
    setNewAttrValues("");
  };

  const removeAttribute = (key: string) =>
    setAttributes((prev) => prev.filter((a) => a.key !== key));

  // Generate cartesian product of attribute values
  const generateCombinations = (
    attrList: Array<{ key: string; values: string[] }>
  ) => {
    if (!attrList || attrList.length === 0) return [{}];
    const combos: any[] = [];
    const recurse = (idx: number, acc: any) => {
      if (idx === attrList.length) {
        combos.push(acc);
        return;
      }
      const { key, values } = attrList[idx];
      for (const v of values) {
        recurse(idx + 1, { ...acc, [key]: v });
      }
    };
    recurse(0, {});
    return combos;
  };

  const generateVariantsFromAttributes = () => {
    if (variants.length > 0) {
      const ok = confirm(
        "Generating variants will replace current variants. Continue?"
      );
      if (!ok) return;
    }
    const combos = generateCombinations(attributes);
    const newVariants = combos.map((attrs) => ({
      price_override: null,
      compare_at_price: null,
      stock: 0,
      weight_override: null,
      attributes: attrs,
      is_default: false,
    }));
    // If no attributes defined, create a single default variant
    const finalVariants =
      newVariants.length > 0
        ? newVariants
        : [
            {
              price_override: null,
              compare_at_price: null,
              stock: 0,
              weight_override: null,
              attributes: {},
              is_default: true,
            },
          ];
    setVariants(finalVariants);
    // reset per-variant files mapping
    setVariantFiles({});
  };

  return (
    <div className="p-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          currency: "PKR",
          featured: false,
          status: initialValues?.status || "draft",
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="title"
            label="Product Title"
            rules={[{ required: true, message: "Please enter product title" }]}
          >
            <Input
              placeholder="e.g. Premium Dog Food 5kg"
              value={titleValue}
              onChange={(e) => {
                const v = e.target.value;
                setTitleValue(v);
                // keep form in sync
                form.setFieldsValue({ title: v });
              }}
            />
          </Form.Item>

          {/* SKU removed: variant SKUs will be auto-generated on server */}
        </div>

        {/* <Form.Item
          name="short_description"
          label="Short Description"
          rules={[
            { required: true, message: "Please enter short description" },
          ]}
        > */}
          {/* <Input placeholder="Brief product summary for listing cards" />
        </Form.Item> */}

        <div className="space-y-2">
          <Form.Item name="description" label="Full Description" className="mb-2">
            <TextArea
              rows={4}
              placeholder="Detailed product description, ingredients, benefits, etc."
            />
          </Form.Item>
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                const title = (form.getFieldValue('title') || '').toString().trim();
                if (!title) {
                  return message.info('Please enter a product title first');
                }
                setGenerating(true);
                try {
                  const res = await fetch('/api/llm/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productName: title })
                  });
                  const json = await res.json();
                  console.log('LLM API Response:', json);
                  if (res.ok && json?.text) {
                    console.log('Setting description field to:', json.text);
                    form.setFieldsValue({ description: json.text });
                    console.log('Form field value after setting:', form.getFieldValue('description'));
                    message.success('Description generated');
                  } else {
                    console.error('LLM API Error:', json);
                    // Provide a bit more context to the user
                    const details = [] as string[];
                    if (json?.error) details.push(json.error);
                    if (json?.message) details.push(json.message);
                    if (json?.durationMs) details.push(`took ${json.durationMs}ms`);
                    message.error(details.join(' — ') || 'LLM generation failed');
                  }
                } catch (e) {
                  console.error('LLM fetch failed', e);
                  message.error('LLM request failed');
                } finally {
                  setGenerating(false);
                }
              }}
              loading={generating}
              disabled={!String(form.getFieldValue('title') || '').trim()}
              type="primary"
              ghost
              size="small"
            >
              Generate Description
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Item
            name="category_ids"
            label="Categories"
            rules={[
              {
                required: true,
                message: "Please select at least one category",
              },
            ]}
          >
            <Select mode="multiple" placeholder="Select categories">
              {categories.map((cat) => (
                <Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="collection_ids"
            label="Pet Types (Collections)"
            rules={[
              {
                required: true,
                message: "Please select at least one pet type",
              },
            ]}
          >
            <Select mode="multiple" placeholder="Select pet types">
              {collections.map((col) => (
                <Option key={col.value} value={col.value}>
                  {col.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select onChange={(v) => setStatus(v)}>
              <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Item name="featured" valuePropName="checked">
            <Checkbox>Featured Product (show prominently on homepage)</Checkbox>
          </Form.Item>
          <div />
          <div />
        </div>

        {/* Attribute Builder */}
        <div className="border p-3 rounded mb-4">
          <h4 className="font-medium mb-3">Attributes (for Variants)</h4>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Attribute name (e.g. Color, Size, Weight)"
              value={newAttrKey}
              onChange={(e) => setNewAttrKey(e.target.value)}
              className="w-40"
            />
            <Input
              placeholder="Values (comma separated, e.g. Red, Blue, Green)"
              value={newAttrValues}
              onChange={(e) => setNewAttrValues(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addAttribute}>Add Attribute</Button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {attributes.map((attr) => (
              <span key={attr.key} className="bg-gray-100 px-2 py-1 rounded">
                {attr.key}: {attr.values.join(", ")}
                <a
                  onClick={() => removeAttribute(attr.key)}
                  className="ml-2 text-red-500"
                >
                  x
                </a>
              </span>
            ))}
          </div>
          <Button type="primary" onClick={generateVariantsFromAttributes}>
            Generate Variants
          </Button>
        </div>

        {/* Variant Table */}
        {variants.length > 0 && (
          <div className="border p-3 rounded">
            <h4 className="font-medium mb-3">Generated Variants</h4>
            <div className="overflow-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2">Attributes</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Compare At</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Weight</th>
                    <th className="p-2">Images</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">
                        {Object.entries(v.attributes).map(([k, val]) => (
                          <span key={k} className="mr-2">
                            {k}: <b>{String(val)}</b>
                          </span>
                        ))}
                      </td>
                      <td className="p-2">
                        <InputNumber
                          value={v.price_override}
                          onChange={(val) =>
                            updateCell(idx, "price_override", val)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <InputNumber
                          value={v.compare_at_price}
                          onChange={(val) =>
                            updateCell(idx, "compare_at_price", val)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <InputNumber
                          value={v.stock}
                          onChange={(val) => updateCell(idx, "stock", val)}
                        />
                      </td>
                      <td className="p-2">
                        <InputNumber
                          value={v.weight_override}
                          onChange={(val) =>
                            updateCell(idx, "weight_override", val)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Upload {...variantUploadProps(idx)}>
                          <Button size="small" icon={<UploadOutlined />}>Upload Images</Button>
                        </Upload>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
            {mode === "create" ? "Create Product" : "Update Product"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

// Small helper component for attribute editing (local state): accepts variant and exposes changes
function VariantAttributeEditor({ variant, onChange, onSetTemp }: any) {
  const [tempKey, setTempKey] = useState("");
  const [tempVal, setTempVal] = useState("");

  const attrs = variant.attributes || {};

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input
          placeholder="Attribute name (e.g., Size)"
          value={tempKey}
          onChange={(e) => {
            setTempKey(e.target.value);
            onSetTemp && onSetTemp({ _newAttrKey: e.target.value });
          }}
        />
        <Input
          placeholder="Attribute value (e.g., 1kg)"
          value={tempVal}
          onChange={(e) => {
            setTempVal(e.target.value);
            onSetTemp && onSetTemp({ _newAttrValue: e.target.value });
          }}
        />
        <Button
          onClick={() => {
            const key = (tempKey || "").trim();
            const val = (tempVal || "").trim();
            if (!key || !val) return message.error("Enter both name and value");
            const next = { ...(attrs || {}) };
            next[key] = val;
            onChange(next);
            setTempKey("");
            setTempVal("");
          }}
        >
          Add Attribute
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Object.keys(attrs || {}).map((k) => (
          <span key={k} className="bg-gray-100 px-2 py-1 rounded">
            {k}: {attrs[k]}{" "}
            <a
              onClick={() => {
                const next = { ...(attrs || {}) };
                delete next[k];
                onChange(next);
              }}
              className="ml-2"
            >
              x
            </a>
          </span>
        ))}
      </div>
    </div>
  );
}

export default BazaarProductForm;
