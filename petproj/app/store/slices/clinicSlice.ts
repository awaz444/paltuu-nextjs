import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Clinic } from '../../types/clinic';
import { RootState } from '../store';

export interface ClinicQueryParams {
    page?: number;
    limit?: number;
    city?: string;
    category?: string;
    search?: string;
    verified?: boolean;
    partner?: boolean;
    sort?: 'rating' | 'distance';
    lat?: number;
    lng?: number;
}

interface ClinicPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}

interface ClinicState {
    clinics: Clinic[];
    cities: string[];
    pagination: ClinicPagination;
    loading: boolean;
    error: string | null;
}

const initialState: ClinicState = {
    clinics: [],
    cities: [],
    pagination: { page: 1, limit: 15, total: 0, totalPages: 1, hasMore: false },
    loading: false,
    error: null,
};

interface FetchClinicsResponse {
    data: Clinic[];
    pagination: ClinicPagination;
    cities: string[];
}

export const fetchClinics = createAsyncThunk('clinics/fetchClinics', async (params: ClinicQueryParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.city) query.set('city', params.city);
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.verified) query.set('verified', 'true');
    if (params.partner) query.set('partner', 'true');
    if (params.sort) query.set('sort', params.sort);
    if (params.lat != null) query.set('lat', String(params.lat));
    if (params.lng != null) query.set('lng', String(params.lng));

    const response = await fetch(`/api/v1/clinics?${query.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch clinics');
    }
    const data: FetchClinicsResponse = await response.json();
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
            .addCase(fetchClinics.fulfilled, (state, action: PayloadAction<FetchClinicsResponse>) => {
                state.loading = false;
                state.clinics = action.payload.data;
                state.pagination = action.payload.pagination;
                state.cities = action.payload.cities;
            })
            .addCase(fetchClinics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch clinics';
            });
    },
});

export default clinicSlice.reducer;
