import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Clinic } from '../../types/clinic';
import { RootState } from '../store';

interface ClinicState {
    clinics: Clinic[];
    loading: boolean;
    error: string | null;
}

const initialState: ClinicState = {
    clinics: [],
    loading: false,
    error: null,
};

export const fetchClinics = createAsyncThunk('clinics/fetchClinics', async () => {
    const response = await fetch('/api/v1/clinics');
    if (!response.ok) {
        throw new Error('Failed to fetch clinics');
    }
    const data: Clinic[] = await response.json();
    return data;
}, {
    condition: (_, { getState }) => {
        const { clinics } = getState() as RootState;
        if (clinics.loading) return false;
        return true;
    }
});

const clinicSlice = createSlice({
    name: 'clinics',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchClinics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClinics.fulfilled, (state, action: PayloadAction<Clinic[]>) => {
                state.loading = false;
                state.clinics = action.payload;
            })
            .addCase(fetchClinics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch clinics';
            });
    },
});

export default clinicSlice.reducer;
