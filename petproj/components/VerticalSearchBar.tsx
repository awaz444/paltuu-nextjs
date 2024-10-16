import React, { useState } from 'react';

const VerticalSearchBar: React.FC = () => {
  const [isAdopt, setIsAdopt] = useState(false);

  return (
    <div className="bg-white shadow-md p-4 rounded">
      <h2 className="text-lg font-bold mb-4">Search Filters</h2>

      {/* Adopt/Buy Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Adopt/Buy</label>
        <select 
          className="border rounded w-full p-2"
          onChange={(e) => setIsAdopt(e.target.value === 'adopt')}
        >
          <option value="adopt">Adopt</option>
          <option value="buy">Buy</option>
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
          <input type="number" placeholder="Min yrs" className="border rounded w-1/2 p-2" />
          <input type="number" placeholder="Max yrs" className="border rounded w-1/2 p-2" />
        </div>
      </div>

      {/* Price Filter (disabled if Adopt) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Price</label>
        <div className="flex space-x-2">
          <input 
            type="number" 
            placeholder="Min $" 
            className="border rounded w-1/2 p-2"
            disabled={isAdopt}
          />
          <input 
            type="number" 
            placeholder="Max $" 
            className="border rounded w-1/2 p-2"
            disabled={isAdopt}
          />
        </div>
      </div>

      {/* Location Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Area</label>
        <input type="text" placeholder="Enter area" className="border rounded w-full p-2" />
      </div>

      {/* Age of Youngest Child Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Min Age of Children in Home</label>
        <input type="number" placeholder="Min age" className="border rounded w-full p-2" />
      </div>

      {/* Checkboxes for Other Filters */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Additional Preferences</label>
        <div className="space-y-2">
          <div>
            <input type="checkbox" className="mr-2" />
            <label>Can live with cats</label>
          </div>
          <div>
            <input type="checkbox" className="mr-2" />
            <label>Vaccinated</label>
          </div>
          <div>
            <input type="checkbox" className="mr-2" />
            <label>Neutered</label>
          </div>
          <div>
            <input type="checkbox" className="mr-2" />
            <label>Can live with dogs</label>
          </div>
        </div>
      </div>

      <button className="text-white rounded p-2 w-full mb-2" style={{backgroundColor:'#A03048'}}>Reset Search</button>
    </div>
  );
};

export default VerticalSearchBar;
