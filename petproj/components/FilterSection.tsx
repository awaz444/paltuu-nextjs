import styles from '@/styles/FilterSection.module.css';

const FilterSection = () => {
  return (
    <div className={`bg-white shadow-xl p-6`} style={{ margin: '20px', borderRadius: '2rem' }}>
      <div className="flex flex-wrap gap-4 mb-4 mt-6 items-center"> {/* Added items-center to align vertically */}
        {/* Filter for species, breed, and color */}
        <div className="flex-1 min-w-[150px]"> {/* Set a minimum width for better alignment */}
          <label>Species</label>
          <select className="w-full p-3 border rounded">
            <option value="">Select Species</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label>Breed</label>
          <select className="w-full p-3 border rounded">
            <option value="">Select Breed</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label>Colour</label>
          <select className="w-full p-3 border rounded">
            <option value="">Select Colour</option>
          </select>
        </div>
        {/* Buttons on the same line */}
        <div className="flex gap-4 mt-4"> {/* Added mt-4 for spacing above the buttons */}
          <button className="bg-gray-300 p-3 rounded">Reset</button>
          <button className="text-white p-3 rounded w-40" style={{ backgroundColor: '#A03048' }}>Search</button> {/* Increased width */}
        </div>
      </div>
    </div>
  );
};



export default FilterSection;
