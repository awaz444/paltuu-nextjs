import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface Qualification {
  qualification_id: number;
  qualification_name: string;
  description: string;
}

interface QualificationsState {
  qualifications: Qualification[];
  loading: boolean;
  error: string | null;
}

const initialState: QualificationsState = {
  qualifications: [],
  loading: false,
  error: null,
};

export const fetchQualifications = createAsyncThunk('qualifications/fetchQualifications', async () => {
  const response = await fetch('/api/qualifications');
  const data = await response.json();
  return data as Qualification[];
});

const qualificationsSlice = createSlice({
  name: 'qualifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQualifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQualifications.fulfilled, (state, action) => {
        state.loading = false;
        state.qualifications = action.payload;
      })
      .addCase(fetchQualifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch qualifications';
      });
  },
});

export const selectQualifications = (state: RootState) => state.qualifications;

export default qualificationsSlice.reducer;
