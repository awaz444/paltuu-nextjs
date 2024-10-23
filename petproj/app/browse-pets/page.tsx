'use client'; 
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'; 
import { RootState, AppDispatch } from '../store/store'; 
import { fetchAdoptionPets } from '../store/slices/adoptionPetsSlice'; 
import Navbar from '@/components/navbar';
import VerticalSearchBar from '../../components/VerticalSearchBar'; 
import FilterSection from '../../components/FilterSection'; 
import PetGrid from "../../components/petGrid";
import './styles.css';

export default function BrowsePets() {
    const dispatch = useDispatch<AppDispatch>();
    const { pets, loading, error } = useSelector((state: RootState) => state.adoptionPets); 

    const [filters, setFilters] = useState({
        selectedSex: '',
        minAge: '',
        maxAge: '',
        minPrice: '',
        maxPrice: '',
        area: '',
        minChildAge: '',
        canLiveWithDogs: false,
        canLiveWithCats: false,
        vaccinated: false,
        neutered: false,
        selectedCity: '',
        selectedSpecies: '',
        breed: '',
    });

    const [activeTab, setActiveTab] = useState<'adopt' | 'buy'>('adopt');

    useEffect(() => {
        dispatch(fetchAdoptionPets()); 
    }, [dispatch]);

    const handleReset = () => {
        setFilters({
            selectedSex: '',
            minAge: '',
            maxAge: '',
            minPrice: '',
            maxPrice: '',
            area: '',
            minChildAge: '',
            canLiveWithDogs: false,
            canLiveWithCats: false,
            vaccinated: false,
            neutered: false,
            selectedCity: '',
            selectedSpecies: '',
            breed: '',
        });
    };

    const handleSearch = () => {
        console.log('Searching with filters:', filters);
    };

    const filteredPets = pets.filter((pet) => {
        const matchesSex = filters.selectedSex ? pet.sex === filters.selectedSex : true;
        const matchesMinAge = filters.minAge ? pet.age >= Number(filters.minAge) : true;
        const matchesMaxAge = filters.maxAge ? pet.age <= Number(filters.maxAge) : true;
        const matchesMinPrice = filters.minPrice ? Number(pet.price) >= Number(filters.minPrice) : true;
        const matchesMaxPrice = filters.maxPrice ? Number(pet.price) <= Number(filters.maxPrice) : true;
        const matchesArea = filters.area ? pet.area.includes(filters.area) : true;
        const matchesMinChildAge = filters.minChildAge ? pet.min_age_of_children >= Number(filters.minChildAge) : true;
        const matchesDogs = filters.canLiveWithDogs ? pet.can_live_with_dogs : true;
        const matchesCats = filters.canLiveWithCats ? pet.can_live_with_cats : true;
        const matchesVaccinated = filters.vaccinated ? pet.vaccinated : true;
        const matchesNeutered = filters.neutered ? pet.neutered : true;
        const matchesCity = filters.selectedCity ? pet.city_id === Number(filters.selectedCity) : true;
        const matchesSpecies = filters.selectedSpecies ? pet.pet_type === Number(filters.selectedSpecies) : true;
        const matchesBreed = filters.breed ? pet.pet_breed?.toLowerCase().includes(filters.breed.toLowerCase()) : true;

        // Logic for adopt/buy switch
        const matchesAdopt = activeTab === 'adopt' ? Number(pet.price) === 0 : Number(pet.price) > 0;

        return (
            matchesSex &&
            matchesMinAge &&
            matchesMaxAge &&
            matchesMinPrice &&
            matchesMaxPrice &&
            matchesArea &&
            matchesMinChildAge &&
            matchesDogs &&
            matchesCats &&
            matchesVaccinated &&
            matchesNeutered &&
            matchesCity &&
            matchesSpecies &&
            matchesBreed &&
            matchesAdopt
        );
    });

    const handleTabToggle = (tab: 'adopt' | 'buy') => {
        setActiveTab(tab);
    };

    const tabData = [
        { label: 'Adopt', key: 'adopt' },
        { label: 'Buy', key: 'buy' },
    ];

  return (
    <>
      <Navbar />
      <div className="fullBody" style={{maxWidth: '90%', margin: '0 auto'}}>
        <FilterSection onSearch={(filters) => setFilters((prev) => ({ ...prev, ...filters }))} />
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
          <div className="flex w-full">
            <div className="w-1/4 mr-4">
              <VerticalSearchBar
                onSearch={setFilters}
                onReset={handleReset}
                onSearchAction={handleSearch}
              />
            </div>
            <div className="w-3/4">
              {/* Tab Switch for Adopt and Buy */}
              <div className="tab-switch-container">
        {/* Sliding background for active tab */}
        <div
          className="tab-switch-slider"
          style={{
            transform: activeTab === 'adopt' ? 'translateX(0)' : 'translateX(100%)', // Sliding effect
          }}
        />
        <div
          className={`tab ${activeTab === 'adopt' ? 'active' : ''}`}
          onClick={() => handleTabToggle('adopt')}
        >
          Adopt
        </div>
        <div
          className={`tab ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => handleTabToggle('buy')}
        >
          Buy
        </div>
      </div>

                            {loading ? (
                                <p>Loading pets...</p>
                            ) : error ? (
                                <p>Error: {error}</p>
                            ) : (
                                <PetGrid pets={filteredPets} />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
