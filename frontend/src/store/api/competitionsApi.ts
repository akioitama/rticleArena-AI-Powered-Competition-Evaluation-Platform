import { baseApi } from './baseApi';

export interface Criteria {
    id: number;
    competition_id: number;
    name: string;
    description: string | null;
    weight: number;
}

export interface Competition {
    id: number;
    title: string;
    description: string | null;
    guidelines: string | null;
    is_active: boolean;
    created_at: string;
    criteria: Criteria[];
}

export const competitionsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCompetitions: builder.query<Competition[], void>({
            query: () => '/competitions/',
            providesTags: ['Competition'],
        }),
        getCompetition: builder.query<Competition, number>({
            query: (id) => `/competitions/${id}`,
            providesTags: (result, error, id) => [{ type: 'Competition', id }],
        }),
        createCompetition: builder.mutation<Competition, Partial<Competition>>({
            query: (body) => ({
                url: '/competitions/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Competition'],
        }),
    }),
});

export const {
    useGetCompetitionsQuery,
    useGetCompetitionQuery,
    useCreateCompetitionMutation,
} = competitionsApi;
