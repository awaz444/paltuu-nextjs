import React, { useState } from 'react';
import { Modal, message, Popconfirm } from 'antd';
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

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>SKU: {p.sku || 'N/A'}</span>
                <span>Stock: {p.stock || 0}</span>
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
        width={800}
      >
        {viewingProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={(viewingProduct.images && viewingProduct.images[0]) || '/default-avatar.png'}
                  alt={viewingProduct.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {viewingProduct.images && viewingProduct.images.length > 1 && (
                  <div className="flex gap-2 mt-2">
                    {viewingProduct.images.slice(1, 4).map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{viewingProduct.title}</h2>
                  <p className="text-gray-600">{viewingProduct.short_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Price:</span>
                    <p>{formatPrice(viewingProduct.price)}</p>
                  </div>
                  <div>
                    <span className="font-medium">SKU:</span>
                    <p>{viewingProduct.sku}</p>
                  </div>
                  <div>
                    <span className="font-medium">Stock:</span>
                    <p>{viewingProduct.stock}</p>
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span>
                    <p>{viewingProduct.shipping_weight ? `${viewingProduct.shipping_weight}kg` : 'N/A'}</p>
                  </div>
                </div>

                {viewingProduct.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-gray-600 mt-1">{viewingProduct.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AdminProductList;
