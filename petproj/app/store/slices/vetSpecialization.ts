import { RootState } from '../store';
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

// VetSpecialization interface
interface VetSpecialization {
  vet_id: number;
  category_id: number;
}

// VetSpecialization state interface
interface VetSpecializationState {
  specializations: VetSpecialization[];
  loading: boolean;
  error: string | null;
}

// Initial state for the vetSpecialization slice
const initialState: VetSpecializationState = {
  specializations: [],
  loading: false,
  error: null,
};

// Async thunk to fetch vet specializations
export const fetchVetSpecializations = createAsyncThunk(
  'vetSpecializations/fetchVetSpecializations',
  async () => {
    const response = await fetch('/api/vet-specialization'); // Adjust API endpoint

    if (!response.ok) {
      throw new Error('Failed to fetch vet specializations');
    }

    const data: VetSpecialization[] = await response.json();
    return data;
  }
);

// Async thunk to post a new vet specialization
export const postVetSpecialization = createAsyncThunk(
  'vetSpecializations/postVetSpecialization',
  async (
    specializationData: { vet_id: number; category_id: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/vet-specialization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specializationData),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error('Error response:', errorDetails);
        throw new Error('Failed to create vet specialization');
      }

      return specializationData; // Return the specialization data for state update
    } catch (err: any) {
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Async thunk to delete a vet specialization
export const deleteVetSpecialization = createAsyncThunk(
  'vetSpecializations/deleteVetSpecialization',
  async (
    specializationData: { vet_id: number; category_id: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `/api/vet-specialization?vet_id=${specializationData.vet_id}&category_id=${specializationData.category_id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error('Error response:', errorDetails);
        throw new Error('Failed to delete vet specialization');
      }

      return specializationData; // Return the deleted specialization data
    } catch (err: any) {
      return rejectWithValue(err.message || 'Something went wrong');
    }
  }
);

// Create the vetSpecialization slice
const vetSpecializationSlice = createSlice({
  name: 'vetSpecializations',
  initialState,
  reducers: {
    addVetSpecialization: (
      state,
      action: PayloadAction<VetSpecialization>
    ) => {
      state.specializations.push(action.payload);
    },
    removeVetSpecialization: (
      state,
      action: PayloadAction<{ vet_id: number; category_id: number }>
    ) => {
      state.specializations = state.specializations.filter(
        (spec) =>
          spec.vet_id !== action.payload.vet_id ||
          spec.category_id !== action.payload.category_id
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVetSpecializations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchVetSpecializations.fulfilled,
        (state, action: PayloadAction<VetSpecialization[]>) => {
          state.loading = false;
          state.specializations = action.payload;
        }
      )
      .addCase(fetchVetSpecializations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch specializations';
      })

      .addCase(postVetSpecialization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        postVetSpecialization.fulfilled,
        (state, action: PayloadAction<VetSpecialization>) => {
          state.loading = false;
          state.specializations.push(action.payload);
        }
      )
      .addCase(postVetSpecialization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(deleteVetSpecialization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteVetSpecialization.fulfilled,
        (
          state,
          action: PayloadAction<{ vet_id: number; category_id: number }>
        ) => {
          state.loading = false;
          state.specializations = state.specializations.filter(
            (spec) =>
              spec.vet_id !== action.payload.vet_id ||
              spec.category_id !== action.payload.category_id
          );
        }
      )
      .addCase(deleteVetSpecialization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const { addVetSpecialization, removeVetSpecialization } =
  vetSpecializationSlice.actions;
export default vetSpecializationSlice.reducer;
