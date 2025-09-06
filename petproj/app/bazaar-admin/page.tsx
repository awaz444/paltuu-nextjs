"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import BazaarProductForm from '../../components/BazaarProductForm';
import AdminProductList from '../../components/AdminProductList';
import { Modal, message, Select, Input, Button, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Search } = Input;
const { Option } = Select;

export default function BazaarAdminPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated || !user) {
        message.warning('Please login to access the admin panel');
        router.push('/login');
        return;
      }

      // Check if user has admin role
      if (user.role !== 'admin') {
        message.error('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }

      setAuthLoading(false);
    };

    // Add a small delay to ensure auth context is fully loaded
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  const fetchProducts = async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    try {
      const res = await fetch('/api/bazaar/products?admin=true');
      const data = await res.json();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      fetchProducts();
    }
  }, [authLoading, isAuthenticated, user]);

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.short_description?.toLowerCase().includes(searchTerm.toLowerCase())
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
      fetchProducts();
      return { productId: String(data.product_id) };
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

      message.success('Product updated successfully!');
      setEditVisible(false);
      setEditingProduct(null);
      fetchProducts();
      return { productId: String(editingProduct.product_id) };
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
    setProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  const stats = {
    total: products.length,
    published: products.filter(p => (p.status || 'draft') === 'published').length,
    draft: products.filter(p => (p.status || 'draft') === 'draft').length,
    outOfStock: products.filter(p => (p.stock || 0) === 0).length,
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <Navbar />
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
