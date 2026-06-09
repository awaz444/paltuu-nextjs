import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';  // Adjust the import based on your store location

// Define the Pet type
interface Pet {
    pet_id: number;
    owner_id: number;
    pet_name: string;
    pet_type: number;
    pet_breed: string | null;
    city_id: number;
    area: string;
    age_months: number;
    contact_number: string | null;
    description: string;
    adoption_status: string;
    price: string;
    min_age_of_children: number;
    can_live_with_dogs: boolean;
    can_live_with_cats: boolean;
    must_have_someone_home: boolean;
    energy_level: number;
    cuddliness_level: number;
    health_issues: string;
    created_at: string;
    sex: string | null;
    listing_type: string;
    vaccinated: boolean | null;
    neutered: boolean | null;
    city: string;
    profile_image_url: string | null;
    image_id: number | null;
    image_url: string | null;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Define initial state
interface AdoptionPetsState {
    pets: Pet[];
    meta: Meta | null;
    loading: boolean;
    error: string | null;
}

const initialState: AdoptionPetsState = {
    pets: [],
    meta: null,
    loading: false,
    error: null,
};

// Async thunk to fetch adoption pets
export const fetchAdoptionPets = createAsyncThunk(
    'adoptionPets/fetchAdoptionPets',
    async (params: { page?: number; limit?: number; filters?: any } = {}) => {
        const { page = 1, limit = 10, filters = {} } = params;
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters,
        });

        const response = await fetch(`/api/v1/browse-pets?${queryParams.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch adoption pets');
        }
        const data = await response.json();
        return data; // Expected { data: Pet[], meta: Meta }
    },
    {
        condition: (_, { getState }) => {
            const { adoptionPets } = getState() as RootState;
            if (adoptionPets.loading) return false;
            return true;
        }
    }
);

// Create slice
const adoptionPetsSlice = createSlice({
    name: 'adoptionPets',
    initialState,
    reducers: {
        clearAdoptionPets: (state) => {
            state.pets = [];
            state.meta = null;
            state.error = null;
        },
        setAdoptionPets: (state, action) => {
            state.pets = action.payload.pets;
            state.meta = action.payload.meta;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdoptionPets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdoptionPets.fulfilled, (state, action) => {
                state.pets = action.payload.data;
                state.meta = action.payload.meta;
                state.loading = false;
            })
            .addCase(fetchAdoptionPets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch adoption pets';
            });
    },
});

export const { clearAdoptionPets, setAdoptionPets } = adoptionPetsSlice.actions;

// Selectors
export const selectAdoptionPets = (state: RootState) => state.adoptionPets.pets;
export const selectAdoptionPetsMeta = (state: RootState) => state.adoptionPets.meta;
export const selectAdoptionPetsLoading = (state: RootState) => state.adoptionPets.loading;
export const selectAdoptionPetsError = (state: RootState) => state.adoptionPets.error;

export default adoptionPetsSlice.reducer;
