"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, Button, Spin, Empty, Pagination, Tag, Typography, Badge } from "antd";
import { ShoppingCartOutlined, UnorderedListOutlined, AppstoreOutlined, InfoCircleOutlined } from "@ant-design/icons";
import CatalogueFilter from "./CatalogueFilter";
import AddProductModal from "./AddProductModal";
import { VendorInventoryItem } from "../../lib/mockVendorData";

const { Text, Title } = Typography;

interface CatalogueBrowserProps {
  onAddToStore: (item: VendorInventoryItem) => void;
  addedProductIds: number[];
}

const CatalogueBrowser: React.FC<CatalogueBrowserProps> = ({ onAddToStore, addedProductIds }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.collection && { collection: filters.collection }),
        ...(filters.keyword && { keyword: filters.keyword }),
      });
      
      const res = await fetch(`/api/bazaar/products?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setProducts(data.rows || []);
        setPagination(prev => ({ ...prev, total: data.meta?.total || 0 }));
      }
    } catch (err) {
      console.error("Error fetching catalogue products:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const openAddModal = (product: any) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  return (
    <div className="space-y-6">
      <CatalogueFilter onFilterChange={handleFilterChange} />

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
           <Title level={5} className="!mb-0">Catalogue Results ({pagination.total})</Title>
           <Tag color="blue">{products.length} showing</Tag>
        </div>
        <div className="flex items-center gap-2">
           <Button 
             icon={<AppstoreOutlined />} 
             type={viewMode === 'grid' ? 'primary' : 'default'} 
             onClick={() => setViewMode('grid')}
             className={viewMode === 'grid' ? 'bg-[#a03048] border-none' : ''}
           />
           <Button 
             icon={<UnorderedListOutlined />} 
             type={viewMode === 'list' ? 'primary' : 'default'} 
             onClick={() => setViewMode('list')}
             className={viewMode === 'list' ? 'bg-[#a03048] border-none' : ''}
           />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20 min-h-[400px]">
          <Spin size="large" tip="Fetching master catalogue..." />
        </div>
      ) : products.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2">
          <Empty description="No products found in the catalogue matching your filters." />
        </Card>
      ) : (
        <>
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-4"}>
            {products.map((product) => {
              const isAlreadyAdded = addedProductIds.includes(product.product_id);
              
              if (viewMode === 'grid') {
                return (
                  <Card 
                    key={product.product_id}
                    hoverable
                    className="rounded-2xl overflow-hidden border-none shadow px-0"
                    cover={
                      <div className="h-48 bg-gray-100 relative group overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                           <img 
                            src={product.images[0]} 
                            alt={product.title} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" 
                           />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">PALTUU</div>
                        )}
                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                           <Badge status={product.status === 'published' ? "success" : "default"} text={product.status} className="bg-white/80 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" />
                           {isAlreadyAdded && <Badge status="processing" text="In My Store" className="bg-[#a03048]/10 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-[#a03048]" />}
                        </div>
                      </div>
                    }
                  >
                    <div className="p-1">
                      <div className="h-10">
                        <Title level={5} className="!mb-1 line-clamp-2 leading-tight text-[15px]">{product.title}</Title>
                      </div>
                      <Text type="secondary" className="block text-xs uppercase font-bold tracking-wider mb-2">{product.sku}</Text>
                      <div className="flex justify-between items-center pt-2">
                        <Text strong className="text-lg text-[#a03048]">PKR {product.price}</Text>
                        <Button 
                          type="primary" 
                          shape="circle" 
                          icon={<ShoppingCartOutlined />} 
                          disabled={isAlreadyAdded}
                          className={isAlreadyAdded ? "bg-gray-200" : "bg-[#a03048] border-none shadow-md shadow-red-900/20"}
                          onClick={() => openAddModal(product)}
                        />
                      </div>
                    </div>
                  </Card>
                );
              } else {
                return (
                  <Card key={product.product_id} className="rounded-xl border-none shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">P</div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest">{product.sku}</Text>
                          <Title level={5} className="!mb-1 truncate">{product.title}</Title>
                          <p className="text-xs text-gray-500 line-clamp-1 mb-2">{product.description}</p>
                          <div className="flex items-center gap-2">
                             {product.categories?.map((c: any) => <Tag key={c.category_id} className="text-[10px]">{c.name}</Tag>)}
                          </div>
                       </div>
                       <div className="text-right flex flex-col items-end gap-3 min-w-[120px]">
                          <Text strong className="text-xl">PKR {product.price}</Text>
                          <Button 
                            type="primary" 
                            disabled={isAlreadyAdded}
                            className={isAlreadyAdded ? "" : "bg-[#a03048] border-none px-6 rounded-lg"}
                            onClick={() => openAddModal(product)}
                          >
                            {isAlreadyAdded ? "Added to Store" : "Add to Store"}
                          </Button>
                       </div>
                    </div>
                  </Card>
                );
              }
            })}
          </div>

          <div className="flex justify-center py-8">
            <Pagination 
              current={pagination.current} 
              pageSize={pagination.pageSize} 
              total={pagination.total} 
              onChange={handlePageChange}
              showSizeChanger={false}
              className="custom-pagination"
            />
          </div>
        </>
      )}

      <AddProductModal 
        visible={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        onAdd={onAddToStore}
        product={selectedProduct}
      />
    </div>
  );
};

export default CatalogueBrowser;
