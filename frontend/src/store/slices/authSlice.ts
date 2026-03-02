import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
    id: number;
    email: string;
    role: 'admin' | 'competitor';
    is_active: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

function loadStoredAuth() {
    if (typeof window === 'undefined') return { user: null, token: null };
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token) return { user: null, token: null };
    let user = null;
    try {
        if (userStr) user = JSON.parse(userStr);
    } catch {}
    return { user, token };
}

const stored = typeof window !== 'undefined' ? loadStoredAuth() : { user: null, token: null };

const initialState: AuthState = {
    user: stored.user,
    token: stored.token,
    isAuthenticated: !!(stored.token && stored.user),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string }>
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('user', JSON.stringify(action.payload.user));
                document.cookie = `token=${action.payload.token}; path=/; max-age=86400; SameSite=Lax`;
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                document.cookie = 'token=; path=/; max-age=0';
            }
        },
        rehydrate: (state) => {
            if (typeof window === 'undefined') return;
            const { user, token } = loadStoredAuth();
            if (token && user) {
                state.user = user;
                state.token = token;
                state.isAuthenticated = true;
            }
        },
    },
});

export const { setCredentials, logout, rehydrate } = authSlice.actions;
export default authSlice.reducer;
