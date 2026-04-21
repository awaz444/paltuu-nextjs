"use client";
import React, { useEffect, useState } from "react";
import { Input, Select, Space, Typography, Card, Divider } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface CatalogueFilterProps {
  onFilterChange: (filters: any) => void;
}

const CatalogueFilter: React.FC<CatalogueFilterProps> = ({ onFilterChange }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>("");

  useEffect(() => {
    // Fetch categories and collections (animal types)
    const fetchData = async () => {
      try {
        const [catsRes, colsRes] = await Promise.all([
          fetch("/api/v1/bazaar/categories"),
          fetch("/api/v1/bazaar/collections")
        ]);

        if (catsRes.ok) setCategories(await catsRes.json());
        if (colsRes.ok) setCollections(await colsRes.json());
      } catch (err) {
        console.error("Error fetching filter data:", err);
      }
    };
    fetchData();
  }, []);

  const handleFilterUpdate = (newFilters: any) => {
    onFilterChange({
      category: selectedCategory,
      collection: selectedCollection,
      keyword: keyword,
      ...newFilters
    });
  };

  return (
    <Card className="shadow-sm rounded-2xl border-none mb-6">
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="w-full lg:flex-1">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            size="large"
            placeholder="Search master catalogue by name, SKU or description..."
            className="rounded-xl border-gray-200"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              handleFilterUpdate({ keyword: e.target.value });
            }}
          />
        </div>

        <Space className="w-full lg:w-auto" size="middle">
          <div className="flex items-center gap-2">
            <FilterOutlined className="text-[#a03048]" />
            <Select
              size="large"
              placeholder="Category"
              className="w-40 rounded-lg"
              allowClear
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                handleFilterUpdate({ category: val });
              }}
              options={categories.map(c => ({ value: c.category_id, label: c.name }))}
            />
          </div>

          <Select
            size="large"
            placeholder="Animal Type"
            className="w-40 rounded-lg"
            allowClear
            value={selectedCollection}
            onChange={(val) => {
              setSelectedCollection(val);
              handleFilterUpdate({ collection: val });
            }}
            options={collections.map(c => ({ value: c.collection_id, label: c.name }))}
          />
        </Space>
      </div>
    </Card>
  );
};

export default CatalogueFilter;
