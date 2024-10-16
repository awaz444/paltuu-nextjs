import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface PetCategory {
  category_id: number;
  category_name: string;
}

interface PetCategoriesState {
  categories: PetCategory[];
  loading: boolean;
  error: string | null;
}

const initialState: PetCategoriesState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchPetCategories = createAsyncThunk('categories/fetchPetCategories', async () => {
  const response = await fetch('/api/pet-categories');
  const data = await response.json();
  return data as PetCategory[];
});

const petCategoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPetCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPetCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchPetCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      });
  },
});

export const selectPetCategories = (state: RootState) => state.categories;

export default petCategoriesSlice.reducer;
