import { baseApi } from './baseApi';
import { User } from '../slices/authSlice';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<{ access_token: string; token_type: string }, URLSearchParams>({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: credentials.toString(),
            }),
        }),
        register: builder.mutation<User, { email: string; password: string }>({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
        }),
    }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
