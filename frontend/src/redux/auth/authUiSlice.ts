import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface AuthUiState {
  isLoggedIn: boolean;
  current: Record<string, unknown>;
  isLoading: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
}

const initialState: AuthUiState = {
  isLoggedIn: false,
  current: {},
  isLoading: false,
  isSuccess: false,
  errorMessage: null,
};

const authUiSlice = createSlice({
  name: 'authUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setLoggedIn(state, action: PayloadAction<boolean>) {
      state.isLoggedIn = action.payload;
    },
    setCurrentUser(state, action: PayloadAction<Record<string, unknown>>) {
      state.current = action.payload;
      state.isLoggedIn = true;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.errorMessage = action.payload;
      state.isLoading = false;
    },
    loginSuccess(state, action: PayloadAction<Record<string, unknown>>) {
      state.current = action.payload;
      state.isLoggedIn = true;
      state.isLoading = false;
      state.isSuccess = true;
      state.errorMessage = null;
    },
    logoutSuccess(state) {
      state.current = {};
      state.isLoggedIn = false;
      state.isLoading = false;
      state.isSuccess = false;
    },
  },
});

export const authUiActions = authUiSlice.actions;
export default authUiSlice.reducer;

// Selectors
export const selectAuthIsLoggedIn = (state: RootState) => state.authUi?.isLoggedIn;
export const selectAuthCurrentUser = (state: RootState) => state.authUi?.current;
export const selectAuthIsLoading = (state: RootState) => state.authUi?.isLoading;
export const selectAuthIsSuccess = (state: RootState) => state.authUi?.isSuccess;
export const selectAuthError = (state: RootState) => state.authUi?.errorMessage;
