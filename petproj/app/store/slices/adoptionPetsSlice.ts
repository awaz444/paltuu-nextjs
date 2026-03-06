import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';  // Adjust the import based on your store location
import { getPetsApi } from '../../../utils/api';
import { PetWithImages } from '@/app/types/petWithImages';

// Define the Pet type
type Pet = PetWithImages;

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Define initial state
interface AdoptionPetsState {
    pets: Pet[];
    meta: Meta | null;
    loading: boolean;
    error: string | null;
}

const initialState: AdoptionPetsState = {
    pets: [],
    meta: null,
    loading: false,
    error: null,
};

// Async thunk to fetch adoption pets
export const fetchAdoptionPets = createAsyncThunk(
    'adoptionPets/fetchAdoptionPets',
    async (params: { page?: number; limit?: number; filters?: any } = {}) => {
        const { page = 1, limit = 10, filters = {} } = params;
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters,
        });

        return await getPetsApi(queryParams.toString());
    }
);

// Create slice
const adoptionPetsSlice = createSlice({
    name: 'adoptionPets',
    initialState,
    reducers: {
        clearAdoptionPets: (state) => {
            state.pets = [];
            state.meta = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdoptionPets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAdoptionPets.fulfilled, (state, action) => {
                state.pets = action.payload.data;
                state.meta = action.payload.meta;
                state.loading = false;
            })
            .addCase(fetchAdoptionPets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch adoption pets';
            });
    },
});

export const { clearAdoptionPets } = adoptionPetsSlice.actions;

// Selectors
export const selectAdoptionPets = (state: RootState) => state.adoptionPets.pets;
export const selectAdoptionPetsMeta = (state: RootState) => state.adoptionPets.meta;
export const selectAdoptionPetsLoading = (state: RootState) => state.adoptionPets.loading;
export const selectAdoptionPetsError = (state: RootState) => state.adoptionPets.error;

export default adoptionPetsSlice.reducer;
