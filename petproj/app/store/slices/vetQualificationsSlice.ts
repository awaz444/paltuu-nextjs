import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define types for the qualification
interface vetQualification {
  qualification_id: number;
  qualification_name: string;
  year_acquired: string;
  note: string;
}

interface VetQualificationsState {
  qualifications: vetQualification[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: VetQualificationsState = {
  qualifications: [],
  loading: false,
  error: null,
};

// Async thunk to fetch vet qualifications
export const fetchVetQualifications = createAsyncThunk(
  'vetQualifications/fetchVetQualifications',
  async (vetId: string, thunkAPI) => {
    try {
      const response = await fetch(`/api/vet-qualification`);
      if (!response.ok) {
        throw new Error('Failed to fetch vet qualifications');
      }
      return await response.json(); // Return response as payload
    } catch (error) {
      return thunkAPI.rejectWithValue('Failed to fetch vet qualifications');
    }
  }
);

// Async thunk to post a new qualification
export const postVetQualification = createAsyncThunk(
  'vetQualifications/postVetQualification',
  async (qualificationData: { vet_id: string, qualification_id: number, year_acquired: string, note: string }, thunkAPI) => {
    try {
      const response = await fetch('/api/vet-qualification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qualificationData),
      });

      if (!response.ok) {
        throw new Error('Failed to post vet qualification');
      }

      return await response.json(); // Return response as payload
    } catch (error) {
      return thunkAPI.rejectWithValue('Failed to post vet qualification');
    }
  }
);

// Slice definition
const vetQualificationsSlice = createSlice({
  name: 'vetQualifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVetQualifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVetQualifications.fulfilled, (state, action: PayloadAction<vetQualification[]>) => {
        state.loading = false;
        state.qualifications = action.payload;
      })
      .addCase(fetchVetQualifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(postVetQualification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postVetQualification.fulfilled, (state, action: PayloadAction<vetQualification>) => {
        state.loading = false;
        state.qualifications.push(action.payload);
      })
      .addCase(postVetQualification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});


export default vetQualificationsSlice.reducer;
