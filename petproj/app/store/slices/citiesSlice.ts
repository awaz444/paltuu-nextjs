import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCitiesApi } from '@/utils/api';

export const fetchCities = createAsyncThunk('cities/fetchCities', async () => {
    const data = await getCitiesApi();
    return data;
});

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
