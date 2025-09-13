import React, { useState } from 'react';
import { Modal } from 'antd';
import BazaarProductCard from './BazaarProductCard';

interface Props { products: any[] }

const BazaarProductList: React.FC<Props> = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {products.map(p => (
          <div key={p.product_id} onClick={() => setSelectedProduct(p)} className="cursor-pointer">
            <BazaarProductCard product={p} />
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      <Modal
        title={null}
        open={!!selectedProduct}
        onCancel={() => setSelectedProduct(null)}
        footer={null}
        width={900}
        centered
        className="product-details-modal"
      >
        {selectedProduct && (
          <div className="rounded-xl overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="bg-primary px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedProduct.title}</h2>
                <div className="text-lg font-semibold">
                  {formatPrice(selectedProduct.price)}
                </div>
              </div>
              {selectedProduct.short_description && (
                <p className="text-white/80 mt-1">{selectedProduct.short_description}</p>
              )}
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Left - Images */}
              <div className="p-6 md:w-1/2">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                  <img
                    src={(selectedProduct.images && selectedProduct.images[0]) || '/default-avatar.png'}
                    alt={selectedProduct.title}
                    className="w-full aspect-square object-cover"
                  />
                </div>

                {/* Additional Images */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedProduct.images.slice(1).map((img: string, index: number) => (
                      <div key={index} className="w-20 h-20 flex-shrink-0">
                        <img
                          src={img}
                          alt={`${selectedProduct.title} view ${index + 2}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right - Details */}
              <div className="p-6 md:w-1/2">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">
                    Product Details
                  </h3>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {formatPrice(selectedProduct.price)}
                    </div>
                    {(
                      (selectedProduct.variants && selectedProduct.variants[0]?.compare_at_price) || selectedProduct.compare_at_price
                    ) && (
                      <div className="text-gray-500 line-through">
                        {formatPrice(
                          (selectedProduct.variants && selectedProduct.variants[0]?.compare_at_price) || selectedProduct.compare_at_price
                        )}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-4">
                    {selectedProduct.sku && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">SKU:</span>
                        <span className="font-medium">{selectedProduct.sku}</span>
                      </div>
                    )}

                    {selectedProduct.stock !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">In Stock:</span>
                        <span className={`font-medium ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedProduct.stock > 0 ? `${selectedProduct.stock} available` : 'Out of stock'}
                        </span>
                      </div>
                    )}

                    {selectedProduct.shipping_weight && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium">{selectedProduct.shipping_weight} kg</span>
                      </div>
                    )}

                    {selectedProduct.featured && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <span className="text-amber-600 font-medium">⭐ Featured Product</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-gray-600 whitespace-pre-line">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    <button
                      className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                      disabled={selectedProduct.stock === 0}
                    >
                      {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button className="w-full border border-primary text-primary py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                      Contact Seller
                    </button>
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

export default BazaarProductList;
