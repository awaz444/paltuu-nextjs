import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchCities = createAsyncThunk(
    'cities/fetchCities', 
    async () => {
        const response = await fetch('/api/v1/cities', { credentials: 'include' });
        const data = await response.json();
        return data;
    },
    {
        condition: (_, { getState }) => {
            const state = getState() as any;
            const { cities, loading } = state.cities;
            
            // Skip if already loading
            if (loading) return false;
            
            // Skip if we already have data
            if (cities && cities.length > 0) return false;
            
            return true;
        }
    }
);

interface City {
    city_id: number;
    city_name: string;
}

interface CityState {
    cities: City[];
    loading: boolean;
    error: string | null;
}

const initialState: CityState = {
    cities: [],
    loading: false,
    error: null,
};

const citySlice = createSlice({
    name: 'cities',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCities.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCities.fulfilled, (state, action) => {
                state.loading = false;
                state.cities = action.payload;
            })
            .addCase(fetchCities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch cities';
            });
    },
});

export default citySlice.reducer;
