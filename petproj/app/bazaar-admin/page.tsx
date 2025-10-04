"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import BazaarProductForm from '../../components/BazaarProductForm';
import AdminProductList from '../../components/AdminProductList';
import { Modal, message, Select, Input, Button, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import { setProducts, addProduct, updateProduct, removeProduct } from '@/app/store/slices/bazaarProductsSlice';

const { Search } = Input;
const { Option } = Select;

export default function BazaarAdminPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector((state: RootState) => state.bazaarProducts?.products || []);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const limit = 24;
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Fetch products on mount; route is protected by middleware
  // Fetch first page and whenever filters/search change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    (async () => {
      setLoading(true);
      try {
        await fetchProductsPage(1, false);
      } catch (e) {
        // fetchProductsPage handles messages
      } finally {
        setLoading(false);
      }
    })();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, searchTerm, statusFilter, categoryFilter]);

  // Keep a small helper to refresh products (uses redux)
  // Backwards-compatible helper used by child components to refresh the list
  const fetchProducts = async () => {
    setPage(1);
    setHasMore(true);
    setLoading(true);
    try {
      await fetchProductsPage(1, false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific page from the API and optionally append to redux
  const fetchProductsPage = async (pageToLoad: number, append: boolean) => {
    if (!hasMore && append) return;
    try {
      if (append) setLoadingMore(true);
      const params = new URLSearchParams();
      params.set('page', String(pageToLoad));
      params.set('limit', String(limit));
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchTerm) params.set('keyword', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (true) params.set('admin', 'true');

      const res = await fetch(`/api/bazaar/products?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        message.error(text || 'Failed to fetch products');
        return;
      }
      const data = await res.json();
      const rows = Array.isArray(data.rows) ? data.rows : Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : [];

      if (append) {
        // Append to current redux products
        const current = Array.isArray(products) ? products : [];
        dispatch(setProducts([...current, ...rows]));
      } else {
        dispatch(setProducts(rows));
      }

      // Determine hasMore
      const total = data?.meta?.total ?? data?.total ?? null;
      if (total != null) {
        const loadedCount = append ? (products.length + rows.length) : rows.length;
        setHasMore(loadedCount < total);
      } else {
        // If no total provided, assume there is more only if we received a full page
        setHasMore(rows.length === limit);
      }

      setPage(pageToLoad);
    } catch (err: any) {
      message.error(err.message || 'Network error');
    } finally {
      if (append) setLoadingMore(false);
    }
  };

  // Filter products based on search and filters
  useEffect(() => {
  let filtered = Array.isArray(products) ? products : [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => (p.status || 'draft') === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter, categoryFilter]);

  // IntersectionObserver: load next page when sentinel visible
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProductsPage(page + 1, true);
        }
      });
    }, { root: null, rootMargin: '400px', threshold: 0.1 });

    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, page, hasMore, loadingMore, loading]);

  const handleCreateSubmit = async (values: any) => {
    try {
      const res = await fetch('/api/bazaar/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) throw new Error('Create failed');

  const data = await res.json();
      message.success('Product created successfully!');
      setCreateVisible(false);
  // Optimistically add new product to redux store for snappy UI
  dispatch(addProduct(data));
  // refresh paginated listing
  fetchProducts();

      // Return the full response including variants for image upload
      return {
        productId: String(data.product_id),
        variants: data.variants || []
      };
    } catch (err) {
      message.error((err as Error).message || 'Create failed');
      throw err;
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingProduct) return { productId: '' };

    try {
      const res = await fetch(`/api/bazaar/products/${editingProduct.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) throw new Error('Update failed');

  const data = await res.json();
      message.success('Product updated successfully!');
      setEditVisible(false);
      setEditingProduct(null);
  // Update redux store immediately for snappy UI
  dispatch(updateProduct(data));
  fetchProducts();

      // Return the full response including variants for image upload (same as create)
      return {
        productId: String(editingProduct.product_id),
        variants: data.variants || []
      };
    } catch (err) {
      message.error((err as Error).message || 'Update failed');
      throw err;
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setEditVisible(true);
  };

  const handleDelete = (productId: string) => {
    // remove locally from redux store for instant feedback
    dispatch(removeProduct(productId));
  };


  // Protect against products being non-array (defensive). fetchProducts now normalizes, but keep safety here.
  const productsArr = Array.isArray(products) ? products : [];
  const stats = {
    total: productsArr.length,
    published: productsArr.filter(p => (p.status || 'draft') === 'published').length,
    draft: productsArr.filter(p => (p.status || 'draft') === 'draft').length,
    outOfStock: productsArr.filter(p => ((p.stock_total ?? (Array.isArray(p.variants) ? p.variants.reduce((s:any,v:any)=>s+(v.stock||0),0) : 0)) || 0) === 0).length,
  };

  // Rely on middleware for route protection; render immediately

  return (
    <div>

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bazaar Admin Dashboard</h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateVisible(true)}
            size="large"
            className="bg-primary"
          >
            Add New Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-gray-600">Total Products</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-gray-600">Published</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-gray-600">Drafts</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <div className="text-gray-600">Out of Stock</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <Search
                placeholder="Search products by title, SKU, or description"
                allowClear
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="large"
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                size="large"
              >
                <Option value="all">All Status</Option>
                <Option value="published">Published</Option>
                <Option value="draft">Draft</Option>
                <Option value="archived">Archived</Option>
              </Select>
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: 140 }}
                size="large"
              >
                <Option value="all">All Categories</Option>
                <Option value="food">Pet Food</Option>
                <Option value="toys">Toys</Option>
                <Option value="accessories">Accessories</Option>
                <Option value="health">Health & Care</Option>
                <Option value="grooming">Grooming</Option>
                <Option value="housing">Housing</Option>
                <Option value="training">Training</Option>
                <Option value="travel">Travel</Option>
              </Select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Loading products...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {products.length === 0 ? 'No products found. Create your first product!' : 'No products match your filters.'}
            </div>
            {products.length === 0 && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateVisible(true)}
                size="large"
              >
                Create First Product
              </Button>
            )}
          </div>
        ) : (
          <AdminProductList
            products={filteredProducts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={fetchProducts}
          />
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} />

        {loadingMore && (
          <div className="flex justify-center items-center py-6">
            <Spin />
            <div className="ml-3 text-gray-500">Loading more products...</div>
          </div>
        )}

        {/* Create Product Modal */}
        <Modal
          open={createVisible}
          footer={null}
          onCancel={() => setCreateVisible(false)}
          title="Create New Product"
          width={800}
          destroyOnClose
        >
          <BazaarProductForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setCreateVisible(false)}
            mode="create"
          />
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          open={editVisible}
          footer={null}
          onCancel={() => {
            setEditVisible(false);
            setEditingProduct(null);
          }}
          title="Edit Product"
          width={800}
          destroyOnClose
        >
          <BazaarProductForm
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setEditVisible(false);
              setEditingProduct(null);
            }}
            initialValues={editingProduct}
            mode="edit"
          />
        </Modal>
      </div>
    </div>
  );
}
