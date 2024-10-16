import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface FavoriteThing {
  fav_thing_id: number;
  fav_thing_name: string;
}

interface PetFavoriteThingsState {
  favoriteThings: FavoriteThing[];
  loading: boolean;
  error: string | null;
}

const initialState: PetFavoriteThingsState = {
  favoriteThings: [],
  loading: false,
  error: null,
};

export const fetchPetFavoriteThings = createAsyncThunk('favoriteThings/fetchPetFavoriteThings', async () => {
  const response = await fetch('/api/pet-favorite-things');
  const data = await response.json();
  return data as FavoriteThing[];
});

const petFavoriteThingsSlice = createSlice({
  name: 'favoriteThings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPetFavoriteThings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPetFavoriteThings.fulfilled, (state, action) => {
        state.loading = false;
        state.favoriteThings = action.payload;
      })
      .addCase(fetchPetFavoriteThings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch favorite things';
      });
  },
});

export const selectPetFavoriteThings = (state: RootState) => state.favoriteThings;

export default petFavoriteThingsSlice.reducer;
