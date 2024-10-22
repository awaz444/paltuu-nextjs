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
  user_id: number;
  profile_image_url: string | null;
  image_id: number | null;
  image_url: string | null;
}

// Define initial state
interface FosterPetsState {
  pets: Pet[];
  loading: boolean;
  error: string | null;
}

const initialState: FosterPetsState = {
  pets: [],
  loading: false,
  error: null,
};

// Async thunk to fetch foster pets
export const fetchFosterPets = createAsyncThunk('fosterPets/fetchFosterPets', async () => {
  const response = await fetch('/api/foster-pets');
  if (!response.ok) {
    throw new Error('Failed to fetch foster pets');
  }
  const data = await response.json();
  return data as Pet[];
});

// Create slice
const fosterPetsSlice = createSlice({
  name: 'fosterPets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFosterPets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFosterPets.fulfilled, (state, action) => {
        state.pets = action.payload;
        state.loading = false;
      })
      .addCase(fetchFosterPets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch foster pets';
      });
  },
});

// Selectors
export const selectFosterPets = (state: RootState) => state.fosterPets.pets;
export const selectFosterPetsLoading = (state: RootState) => state.fosterPets.loading;
export const selectFosterPetsError = (state: RootState) => state.fosterPets.error;

export default fosterPetsSlice.reducer;
