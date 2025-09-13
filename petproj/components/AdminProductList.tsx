import React, { useState } from 'react';
import { Modal, message, Popconfirm, Button } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

interface Props {
  products: any[];
  onEdit: (product: any) => void;
  onDelete: (productId: string) => void;
  onRefresh: () => void;
}

const AdminProductList: React.FC<Props> = ({ products, onEdit, onDelete, onRefresh }) => {
  const [viewingProduct, setViewingProduct] = useState<any>(null);

  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/bazaar/products/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      message.success('Product deleted successfully');
      onDelete(productId);
      onRefresh();
    } catch (err) {
      message.error('Failed to delete product');
    }
  };

  const updateProductStatus = async (productId: string, status: string) => {
    try {
      const res = await fetch(`/api/bazaar/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      message.success(`Product marked ${status}`);
      onRefresh();
      // refresh viewingProduct if open
      if (viewingProduct && viewingProduct.product_id === productId) {
        const updated = await res.json();
        setViewingProduct((prev: any) => ({ ...prev, status }));
      }
    } catch (err) {
      message.error('Failed to update product status');
    }
  };

  const markProductOutOfStock = async (product: any) => {
    try {
      // Build variants payload from existing variants, forcing stock=0
      const variantsPayload = (product.variants || []).map((v: any) => ({
        // keep attributes and pricing, set stock to 0
        price_override: v.price_override ?? null,
        compare_at_price: v.compare_at_price ?? null,
        stock: 0,
        weight_override: v.weight_override ?? null,
        attributes: v.attributes || {},
      }));

      const res = await fetch(`/api/bazaar/products/${product.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants: variantsPayload }),
      });

      if (!res.ok) throw new Error('Failed to mark out of stock');
      message.success('Product marked out of stock (all variants set to 0)');
      onRefresh();
      setViewingProduct((prev: any) => ({ ...prev, variants: variantsPayload }));
    } catch (err) {
      console.error(err);
      message.error('Failed to mark product out of stock');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'published': 'bg-green-100 text-green-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.draft;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(p => (
          <div key={p.product_id} className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 relative">
            <div className="relative">
              <img
                src={(p.images && p.images[0]) || '/default-avatar.png'}
                alt={p.title}
                className="w-full h-48 object-cover rounded-2xl"
              />

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(p.status || 'draft')}`}>
                  {(p.status || 'draft').charAt(0).toUpperCase() + (p.status || 'draft').slice(1)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => setViewingProduct(p)}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-blue-50 transition"
                  title="View Details"
                >
                  <EyeOutlined className="text-blue-600" />
                </button>
                <button
                  onClick={() => onEdit(p)}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-yellow-50 transition"
                  title="Edit Product"
                >
                  <EditOutlined className="text-yellow-600" />
                </button>
                <Popconfirm
                  title="Delete Product"
                  description="Are you sure you want to delete this product?"
                  onConfirm={() => handleDelete(p.product_id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-red-50 transition"
                    title="Delete Product"
                  >
                    <DeleteOutlined className="text-red-600" />
                  </button>
                </Popconfirm>
              </div>

              {/* Price Badge */}
              {p.price !== null && (
                <div className="absolute bottom-2 right-2 bg-primary text-white text-sm font-semibold px-3 py-1 rounded-full">
                  PKR {Math.floor(Number(p.price))}
                </div>
              )}

              {/* Featured Badge */}
              {p.featured && (
                <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                  Featured
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-xl mb-1 truncate">{p.title}</h3>
              <p className="text-gray-600 mb-2 text-sm truncate">{p.short_description}</p>
              <div className="flex gap-2 flex-wrap mt-2">
                {(p.categories || []).slice(0,3).map((c: any) => (
                  <span key={c.category_id} className="text-xs px-2 py-1 bg-gray-100 rounded">{c.name}</span>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>SKU: {p.sku || 'N/A'}</span>
                <span>Stock: {(p.stock_total ?? (Array.isArray(p.variants) ? p.variants.reduce((s:any,v:any)=>s+(v.stock||0),0) : 0)) || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      <Modal
        title="Product Details"
        open={!!viewingProduct}
        onCancel={() => setViewingProduct(null)}
        footer={null}
        width={1000}
      >
        {viewingProduct && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{viewingProduct.title}</h2>
                <p className="text-gray-600">{viewingProduct.short_description}</p>
              </div>
              <div className="flex gap-2">
                <Button type="default" onClick={() => updateProductStatus(viewingProduct.product_id, 'draft')}>Mark Draft</Button>
                <Button type="primary" onClick={() => updateProductStatus(viewingProduct.product_id, 'published')}>Publish</Button>
                <Button danger onClick={() => markProductOutOfStock(viewingProduct)}>Mark Out of Stock</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <img
                  src={(viewingProduct.images && viewingProduct.images[0]) || '/default-avatar.png'}
                  alt={viewingProduct.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {viewingProduct.images && viewingProduct.images.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {viewingProduct.images.slice(1, 6).map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Price:</span>
                    <p>{formatPrice(viewingProduct.price)}</p>
                  </div>
                  <div>
                    <span className="font-medium">SKU (product):</span>
                    <p>{viewingProduct.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Categories:</span>
                    <p>{(viewingProduct.categories || []).map((c: any) => c.name).join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p>{(viewingProduct.status || 'draft')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Shipping Weight:</span>
                    <p>{viewingProduct.shipping_weight ? `${viewingProduct.shipping_weight} kg` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Featured:</span>
                    <p>{viewingProduct.featured ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {viewingProduct.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-gray-600 mt-1">{viewingProduct.description}</p>
                  </div>
                )}

                {/* Variants table */}
                <div>
                  <h3 className="font-semibold">Variants</h3>
                  <div className="overflow-auto mt-2">
                    <table className="min-w-full border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Attributes</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Compare At</th>
                          <th className="p-2">Stock</th>
                          <th className="p-2">Weight</th>
                          <th className="p-2">Images</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingProduct.variants || []).map((v: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{idx + 1}</td>
                            <td className="p-2 text-sm">
                              {v.attributes ? Object.entries(v.attributes).map(([k, val]) => (<div key={k}><strong>{k}:</strong> {String(val)}</div>)) : 'N/A'}
                            </td>
                            <td className="p-2">{v.price_override != null ? formatPrice(v.price_override) : '—'}</td>
                            <td className="p-2">{v.compare_at_price != null ? formatPrice(v.compare_at_price) : '—'}</td>
                            <td className="p-2">{v.stock ?? 0}</td>
                            <td className="p-2">{v.weight_override ?? '—'}</td>
                            <td className="p-2">
                              {v.images && v.images.length > 0 ? (
                                <div className="flex gap-2">
                                  {v.images.slice(0,3).map((img: any, i:number) => <img key={i} src={img.url || img} alt={`variant-${idx}-img-${i}`} className="w-12 h-12 object-cover rounded" />)}
                                </div>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AdminProductList;
