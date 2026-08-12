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
    /** Skip pagination and return every matching clinic — used for map pins. */
    all?: boolean;
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
    /** Full, unpaginated result set for the current filters — map pins only. */
    mapClinics: Clinic[];
    mapLoading: boolean;
}

const initialState: ClinicState = {
    clinics: [],
    cities: [],
    pagination: { page: 1, limit: 15, total: 0, totalPages: 1, hasMore: false },
    loading: false,
    error: null,
    mapClinics: [],
    mapLoading: false,
};

interface FetchClinicsResponse {
    data: Clinic[];
    pagination: ClinicPagination;
    cities: string[];
}

const buildQuery = (params: ClinicQueryParams) => {
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
    if (params.all) query.set('all', 'true');
    return query;
};

export const fetchClinics = createAsyncThunk('clinics/fetchClinics', async (params: ClinicQueryParams = {}) => {
    const response = await fetch(`/api/v1/clinics?${buildQuery(params).toString()}`);
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

// Separate from `fetchClinics` — this one is for the map, which needs every
// matching clinic's coordinates regardless of which page the list is on, so
// it's tracked with its own loading flag and never paginated/appended.
export const fetchClinicsForMap = createAsyncThunk('clinics/fetchClinicsForMap', async (params: ClinicQueryParams = {}) => {
    const response = await fetch(`/api/v1/clinics?${buildQuery({ ...params, all: true }).toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch clinics for map');
    }
    const data: FetchClinicsResponse = await response.json();
    return data;
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
                // page 1 is a fresh search/filter — replace. Later pages are
                // infinite-scroll continuations — append.
                state.clinics = action.payload.pagination.page > 1
                    ? [...state.clinics, ...action.payload.data]
                    : action.payload.data;
                state.pagination = action.payload.pagination;
                state.cities = action.payload.cities;
            })
            .addCase(fetchClinics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch clinics';
            })
            .addCase(fetchClinicsForMap.pending, (state) => {
                state.mapLoading = true;
            })
            .addCase(fetchClinicsForMap.fulfilled, (state, action: PayloadAction<FetchClinicsResponse>) => {
                state.mapLoading = false;
                state.mapClinics = action.payload.data;
            })
            .addCase(fetchClinicsForMap.rejected, (state) => {
                state.mapLoading = false;
            });
    },
});

export default clinicSlice.reducer;
