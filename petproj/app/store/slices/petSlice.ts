import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store'; // Ensure this path is correct

// Define your Pet interface
interface Pet {
  pet_id: number;
  owner_id: number;
  pet_name: string;
  pet_type: number;
  pet_breed: string;
  city_id: number;
  area: string;
  age: number;
  description: string;
  adoption_status: string;
  adoption_price: string;
  min_age_of_children: number;
  can_live_with_dogs: boolean;
  can_live_with_cats: boolean;
  must_have_someone_home: boolean;
  energy_level: number;
  cuddliness_level: number;
  health_issues: string;
  sex: string | null;
  listing_type: string | null;
  vaccinated: boolean | null;
  neutered: boolean | null;
}

// Define the initial state
interface PetState {
  pets: Pet[];
  loading: boolean;
  error: string | null;
}

const initialState: PetState = {
  pets: [],
  loading: false,
  error: null,
};

// Create an async thunk for fetching pets
export const fetchPets = createAsyncThunk<Pet[], void>(
  'pets/fetchPets',
  async () => {
    const response = await fetch('/api/pets');
    if (!response.ok) {
      throw new Error('Failed to fetch pets');
    }
    return await response.json();
  }
);

// Create the slice
const petSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    setPets: (state, action: PayloadAction<Pet[]>) => {
      state.pets = action.payload;
    },
    addPet: (state, action: PayloadAction<Pet>) => {
      state.pets.push(action.payload);
    },
    updatePet: (state, action: PayloadAction<Pet>) => {
      const index = state.pets.findIndex(pet => pet.pet_id === action.payload.pet_id);
      if (index !== -1) {
        state.pets[index] = action.payload;
      }
    },
    deletePet: (state, action: PayloadAction<number>) => {
      state.pets = state.pets.filter(pet => pet.pet_id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPets.fulfilled, (state, action: PayloadAction<Pet[]>) => {
        state.pets = action.payload;
        state.loading = false;
      })
      .addCase(fetchPets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch pets';
      });
  },
});

// Export actions and reducer
export const { setPets, addPet, updatePet, deletePet } = petSlice.actions;
export default petSlice.reducer;
