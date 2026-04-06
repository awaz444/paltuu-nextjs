import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store'; // Ensure this path is correct

// Define your Pet interface
// Assuming your Pet type is defined like this
export type Pet = {
  pet_id: number; // assuming this exists
  owner_id: number;
    pet_name: string | null;
    pet_type: number | null;
    pet_breed: string | null;
    city_id: number | null;
    area: string;
    age_months: number | null;
    contact_number?: string | null;
    city?: string;
    tags?: number[];
    description: string | null;
    adoption_status: string;
    price: number | null;
    min_age_of_children?: number | null;
    can_live_with_dogs?: boolean;
    can_live_with_cats?: boolean;
    must_have_someone_home?: boolean;
    health_issues: string | null;
    sex: string;
    listing_type: string;
    vaccinated?: boolean;
    neutered?: boolean;
    energy_level?: number | null;
    cuddliness_level?: number | null;
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

export const deletePet = createAsyncThunk<number, number>(
  'pets/deletePet',
  async (petId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pet');
      }

      return petId; // Return the ID of the deleted pet
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
    deletePets: (state, action: PayloadAction<number>) => {
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
      })
      .addCase(deletePet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePet.fulfilled, (state, action: PayloadAction<number>) => {
        state.pets = state.pets.filter((pet) => pet.pet_id !== action.payload);
        state.loading = false;
      })
      .addCase(deletePet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete pet';
      });
  },
});

// Export actions and reducer
export const { setPets, addPet, updatePet, deletePets } = petSlice.actions;
export default petSlice.reducer;
