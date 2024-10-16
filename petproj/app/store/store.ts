import { configureStore } from '@reduxjs/toolkit';
import petReducer from './slices/petSlice';
import citiesReducer from './slices/citiesSlice';
import petCategoriesReducer from './slices/petCategoriesSlice';
import qualificationsReducer from './slices/qualificationsSlice';
import favoriteThingsReducer from './slices/petFavoriteThingsSlice';
import vetSlice from './slices/vetSlice';

export const store = configureStore({
  reducer: {
    pets: petReducer,
    vets: vetSlice,
    cities: citiesReducer,
    categories: petCategoriesReducer,
    qualifications: qualificationsReducer,
    favoriteThings: favoriteThingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
