import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface PermissionMapping {
  [key: string]: boolean;
}

interface PermissionsUiState {
  permissions: PermissionMapping;
  isOwner: boolean;
  role: string | null;
  email: string | null;
  name: string | null;
  userId: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  hasInitialized: boolean;
}

const initialState: PermissionsUiState = {
  permissions: {},
  isOwner: false,
  role: null,
  email: null,
  name: null,
  userId: null,
  isLoading: false,
  isSuccess: false,
  error: null,
  hasInitialized: false,
};

const permissionsUiSlice = createSlice({
  name: 'permissionsUi',
  initialState,
  reducers: {
    resetState: () => initialState,
    setPermissions(state, action: PayloadAction<{
      permissions: PermissionMapping;
      isOwner: boolean;
      role?: string;
      email?: string;
      name?: string;
      userId?: string;
    }>) {
      state.permissions = action.payload.permissions;
      state.isOwner = action.payload.isOwner;
      state.role = action.payload.role ?? null;
      state.email = action.payload.email ?? null;
      state.name = action.payload.name ?? null;
      state.userId = action.payload.userId ?? null;
      state.hasInitialized = true;
      state.isSuccess = true;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clear(state) {
      Object.assign(state, initialState);
    },
  },
});

export const permissionsUiActions = permissionsUiSlice.actions;
export default permissionsUiSlice.reducer;

// Selectors
export const selectUserPermissions = (state: RootState) => state.permissionsUi?.permissions;
export const selectIsOwner = (state: RootState) => state.permissionsUi?.isOwner;
export const selectPermissionsRole = (state: RootState) => state.permissionsUi?.role;
export const selectPermissionsLoading = (state: RootState) => state.permissionsUi?.isLoading;
export const selectPermissionsError = (state: RootState) => state.permissionsUi?.error;
export const selectHasInitialized = (state: RootState) => state.permissionsUi?.hasInitialized;
