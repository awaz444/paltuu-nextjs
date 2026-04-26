"use client";
import React, { useState } from "react";
import { Input, Select, Space, Card } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

interface CatalogueFilterProps {
  onFilterChange: (filters: any) => void;
}

const CatalogueFilter: React.FC<CatalogueFilterProps> = ({ onFilterChange }) => {
  const [animalType, setAnimalType] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>("");

  const handleFilterUpdate = (newFilters: any) => {
    onFilterChange({
      animal_type: animalType,
      keyword: keyword,
      ...newFilters
    });
  };

  return (
    <Card className="shadow-sm rounded-2xl border-none mb-6 bg-white">
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="w-full lg:flex-1">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            size="large"
            placeholder="Search master catalogue by name, SKU or brand..."
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
              placeholder="Animal Type"
              className="w-44 rounded-lg"
              allowClear
              value={animalType}
              onChange={(val) => {
                setAnimalType(val);
                handleFilterUpdate({ animal_type: val });
              }}
              options={[
                { value: 'cat', label: 'Cat' },
                { value: 'dog', label: 'Dog' },
                { value: 'bird', label: 'Bird' },
                { value: 'fish', label: 'Fish' },
                { value: 'all', label: 'All Animals' },
              ]}
            />
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default CatalogueFilter;
