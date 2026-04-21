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

export const fetchPetCategories = createAsyncThunk(
  'categories/fetchPetCategories',
  async () => {
    const response = await fetch('/api/v1/pet-categories', { credentials: 'include' });
    const data = await response.json();
    return data as PetCategory[];
  },
  {
    condition: (_, { getState }) => {
      const { categories, loading } = (getState() as RootState).categories;
      
      // Skip if already loading
      if (loading) return false;
      
      // Skip if we already have data
      if (categories && categories.length > 0) return false;
      
      return true;
    }
  }
);

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
