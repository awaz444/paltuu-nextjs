import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Vet interface
interface Vet {
  vet_id: number;
  user_id: number;
  clinic_name: string;
  location: string;
  minimum_fee: number;
  contact_details: string;
  profile_verified: boolean;
  bio: string;
  created_at: string;
}

// Vet state interface
interface VetState {
  vets: Vet[];
  loading: boolean;
  error: string | null;
}

// Initial state for the vets slice
const initialState: VetState = {
  vets: [],
  loading: false,
  error: null,
};

// Async thunk to fetch vets
export const fetchVets = createAsyncThunk('vets/fetchVets', async () => {
  const response = await fetch('/api/vets'); // Adjust API endpoint
  if (!response.ok) {
    throw new Error('Failed to fetch vets');
  }
  const data: Vet[] = await response.json();
  return data;
});

// Create the vet slice
const vetSlice = createSlice({
  name: 'vets',
  initialState,
  reducers: {
    // You can add more reducers here if needed
    addVet: (state, action: PayloadAction<Vet>) => {
      state.vets.push(action.payload);
    },
    updateVet: (state, action: PayloadAction<Vet>) => {
      const index = state.vets.findIndex(vet => vet.vet_id === action.payload.vet_id);
      if (index !== -1) {
        state.vets[index] = action.payload;
      }
    },
    deleteVet: (state, action: PayloadAction<number>) => {
      state.vets = state.vets.filter(vet => vet.vet_id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVets.fulfilled, (state, action: PayloadAction<Vet[]>) => {
        state.loading = false;
        state.vets = action.payload;
      })
      .addCase(fetchVets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vets';
      });
  },
});

// Export actions and reducer
export const { addVet, updateVet, deleteVet } = vetSlice.actions;
export default vetSlice.reducer;
