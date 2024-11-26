import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

// Define the schedule type
export interface VetSchedule {
    vet_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
  }
  

// State type for the slice
interface VetScheduleState {
    schedules: VetSchedule[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
}

// Initial state
const initialState: VetScheduleState = {
    schedules: [],
    status: "idle",
    error: null,
};

// Async thunk to fetch all schedules
export const fetchVetSchedules = createAsyncThunk<VetSchedule[], void>(
    "vetSchedules/fetchVetSchedules",
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch("/api/vet-schedule", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch vet schedules.");
            }

            return await response.json();
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Async thunk to add new schedules
export const addVetSchedules = createAsyncThunk<
    VetSchedule[],
    VetSchedule[],
    { rejectValue: string }
>("vetSchedules/addVetSchedules", async (schedules, { rejectWithValue }) => {
    try {
        const response = await fetch("/api/vet-schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(schedules),
        });

        if (!response.ok) {
            throw new Error("Failed to add vet schedules.");
        }

        return await response.json();
    } catch (error: any) {
        return rejectWithValue(error.message);
    }
});

// Vet schedule slice
const vetScheduleSlice = createSlice({
    name: "vetSchedules",
    initialState,
    reducers: {
        // Optional reducers for non-API actions
        clearSchedules(state) {
            state.schedules = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch schedules
            .addCase(fetchVetSchedules.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchVetSchedules.fulfilled, (state, action: PayloadAction<VetSchedule[]>) => {
                state.status = "succeeded";
                state.schedules = action.payload;
            })
            .addCase(fetchVetSchedules.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            })
            // Add schedules
            .addCase(addVetSchedules.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(addVetSchedules.fulfilled, (state, action: PayloadAction<VetSchedule[]>) => {
                state.status = "succeeded";
                state.schedules.push(...action.payload); // Append new schedules
            })
            .addCase(addVetSchedules.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
            });
    },
});

// Export actions and reducer
export const { clearSchedules } = vetScheduleSlice.actions;
export default vetScheduleSlice.reducer;

// Selector to access schedules in the state
// export const selectVetSchedules = (state: RootState) => state.vetSchedules.schedules;
// export const selectScheduleStatus = (state: RootState) => state.vetSchedules.status;
// export const selectScheduleError = (state: RootState) => state.vetSchedules.error;