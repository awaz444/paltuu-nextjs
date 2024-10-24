import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store'; // Ensure this path is correct

// Define your Pet interface
// Assuming your Pet type is defined like this
export type Pet = {
  pet_id: number; // assuming this exists
  owner_id: number;
  pet_name: string | null; // Allow null
  pet_type: number | null; // Allow null
  pet_breed: string | null; // Allow null
  city_id: number | null; // Allow null
  area: string; // This will need to be updated if you want it to allow null
  age: number | null; // Allow null
  description: string | null; // Allow null
  adoption_status: string;
  price: number | null; // Allow null
  min_age_of_children: number | null; // Allow null
  can_live_with_dogs: boolean;
  can_live_with_cats: boolean;
  must_have_someone_home: boolean;
  energy_level: number;
  cuddliness_level: number;
  health_issues: string | null; // Allow null
  sex: string;
  listing_type: string;
  vaccinated: boolean;
  neutered: boolean;
  payment_frequency?: string | null; // Optional field for foster
};


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

// Create an async thunk for posting a new pet
export const postPet = createAsyncThunk<Pet, Omit<Pet, 'pet_id'>>(
  'pets/postPet',
  async (newPet, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPet),
      });

      if (!response.ok) {
        throw new Error('Failed to post new pet');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
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
      const index = state.pets.findIndex((pet) => pet.pet_id === action.payload.pet_id);
      if (index !== -1) {
        state.pets[index] = action.payload;
      }
    },
    deletePet: (state, action: PayloadAction<number>) => {
      state.pets = state.pets.filter((pet) => pet.pet_id !== action.payload);
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
      })

      // Handle postPet cases
      .addCase(postPet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postPet.fulfilled, (state, action: PayloadAction<Pet>) => {
        state.pets.push(action.payload); // Add the newly created pet to the state
        state.loading = false;
      })
      .addCase(postPet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to post new pet';
      });
  },
});

// Export actions and reducer
export const { setPets, addPet, updatePet, deletePet } = petSlice.actions;
export default petSlice.reducer;
