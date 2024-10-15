import { configureStore } from '@reduxjs/toolkit';
import petReducer from './slices/petSlice';
import cityReducer from './slices/citySlice';
import petCategoryReducer from './slices/petCategorySlice';
import qualificationReducer from './slices/qualificationSlice';
import favoriteThingsReducer from './slices/favoriteThingsSlice';

export const store = configureStore({
  reducer: {
    pets: petReducer,
    cities: cityReducer,
    petCategories: petCategoryReducer,
    qualifications: qualificationReducer,
    favoriteThings: favoriteThingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
