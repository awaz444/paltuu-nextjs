// components/VerticalSearchBar.tsx
import React from 'react';

const VerticalSearchBar: React.FC = () => {
  return (
    <div className="bg-white shadow-md p-4 rounded">
      <h2 className="text-lg font-bold mb-4">Search Filters</h2>

      {/* Size Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Size</label>
        <select className="border rounded w-full p-2">
          <option value="">Select Size</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Sex Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Sex</label>
        <select className="border rounded w-full p-2">
          <option value="">Select Sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {/* Age Range Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Age Range</label>
        <div className="flex space-x-2">
          <input type="number" placeholder="yrs" className="border rounded w-1/3 p-2" />
          <span className="self-center">to</span>
          <input type="number" placeholder="yrs" className="border rounded w-1/3 p-2" />
        </div>
      </div>

      {/* Age of Youngest Child Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Age of Youngest Child in Home</label>
        <input type="number" placeholder="yrs" className="border rounded w-full p-2" />
      </div>

      {/* Location Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Location</label>
        <input type="text" placeholder="Location" className="border rounded w-full p-2" />
        <div className="mt-2">
          <input type="checkbox" className="mr-2" />
          <label className="text-sm">Use Current Location</label>
        </div>
      </div>

      {/* Distance Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Distance (miles)</label>
        <input type="number" className="border rounded w-full p-2" />
      </div>

      <button className="text-white rounded p-2 w-full mb-2 " style={{backgroundColor:'#A03048'}}>Reset Search</button>
    </div>
  );
};

export default VerticalSearchBar;
