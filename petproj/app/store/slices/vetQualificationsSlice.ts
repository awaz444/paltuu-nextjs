import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// ✅ Types for the qualification
interface VetQualification {
  qualification_id: number;
  qualification_name: string;
  year_acquired: string;
  note: string;
}

interface VetQualificationsState {
  qualifications: VetQualification[];
  loading: boolean;
  error: string | null;
}

// ✅ Initial state
const initialState: VetQualificationsState = {
  qualifications: [],
  loading: false,
  error: null,
};

// ✅ Async thunk to fetch vet qualifications
export const fetchVetQualifications = createAsyncThunk(
  'vetQualifications/fetchVetQualifications',
  async (vetId: string, thunkAPI) => {
    try {
      const response = await fetch(`/api/vet-qualification?vet_id=${vetId}`);
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail?.message || 'Failed to fetch vet qualifications');
      }
      const result = await response.json();
      if (!Array.isArray(result)) {
        throw new Error('Unexpected response format. Expected an array of qualifications.');
      }
      return result; // Return the list of qualifications as the payload
    } catch (error: unknown) {
      if (error instanceof Error) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue('An unknown error occurred while fetching vet qualifications.');
    }
  }
);

// ✅ Async thunk to post a new qualification
export const postVetQualification = createAsyncThunk(
  'vetQualifications/postVetQualification',
  async (qualificationData: { vet_id: string, qualification_id: number, year_acquired: string, note: string }, thunkAPI) => {
    try {
      const response = await fetch(`/api/vet-qualification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qualificationData),
      });

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail?.message || 'Failed to post vet qualification');
      }

      const result = await response.json();

      // Check if response has "data" field to extract the qualification
      const qualification = result?.data || result;
      if (!qualification || !qualification.qualification_id) {
        throw new Error('Unexpected response format. Expected qualification object.');
      }

      return qualification; // Return the created qualification as payload
    } catch (error: unknown) {
      if (error instanceof Error) {
        return thunkAPI.rejectWithValue(error.message);
      }
      return thunkAPI.rejectWithValue('An unknown error occurred while posting vet qualification.');
    }
  }
);

// ✅ Slice definition
const vetQualificationsSlice = createSlice({
  name: 'vetQualifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ✅ Handle fetchVetQualifications cases
    builder
      .addCase(fetchVetQualifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVetQualifications.fulfilled, (state, action: PayloadAction<VetQualification[]>) => {
        state.loading = false;
        state.qualifications = action.payload;
      })
      .addCase(fetchVetQualifications.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to fetch vet qualifications.';
      });

    // ✅ Handle postVetQualification cases
    builder
      .addCase(postVetQualification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postVetQualification.fulfilled, (state, action: PayloadAction<VetQualification>) => {
        state.loading = false;
        if (action.payload && action.payload.qualification_id) {
          state.qualifications.push(action.payload);
        } else {
          console.warn('Unexpected payload format:', action.payload);
        }
      })
      .addCase(postVetQualification.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Failed to post vet qualification.';
      });
  },
});

export default vetQualificationsSlice.reducer;
