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
  age: number;
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
  payment_frequency: string | null;
  city: string;
  profile_image_url: string | null;
  image_id: number | null;
  image_url: string | null;
}

// Define initial state
interface AdoptionPetsState {
  pets: Pet[];
  loading: boolean;
  error: string | null;
}

const initialState: AdoptionPetsState = {
  pets: [],
  loading: false,
  error: null,
};

// Async thunk to fetch adoption pets
export const fetchAdoptionPets = createAsyncThunk('adoptionPets/fetchAdoptionPets', async () => {
  const response = await fetch('/api/browse-pets');
  if (!response.ok) {
    throw new Error('Failed to fetch adoption pets');
  }
  const data = await response.json();
  return data as Pet[];
});

// Create slice
const adoptionPetsSlice = createSlice({
  name: 'adoptionPets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdoptionPets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdoptionPets.fulfilled, (state, action) => {
        state.pets = action.payload;
        state.loading = false;
      })
      .addCase(fetchAdoptionPets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch adoption pets';
      });
  },
});

// Selectors
export const selectAdoptionPets = (state: RootState) => state.adoptionPets.pets;
export const selectAdoptionPetsLoading = (state: RootState) => state.adoptionPets.loading;
export const selectAdoptionPetsError = (state: RootState) => state.adoptionPets.error;

export default adoptionPetsSlice.reducer;
