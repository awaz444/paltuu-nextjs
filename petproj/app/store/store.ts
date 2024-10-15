import { configureStore } from '@reduxjs/toolkit';
import petReducer from './slices/petSlice'; // Adjust this path if necessary
import vetReducer from './slices/vetSlice'; // Import the vet slice

// Configure the Redux store
export const store = configureStore({
  reducer: {
    pets: petReducer, // Pet reducer
    vets: vetReducer, // Vet reducer added here
  },
});

// Define RootState type from the store itself
export type RootState = ReturnType<typeof store.getState>;

// Export dispatch type for use with TypeScript
export type AppDispatch = typeof store.dispatch;
