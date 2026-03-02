import { baseApi } from './baseApi';

export interface LeaderboardEntry {
    rank: number;
    submission_id: number;
    competitor_email: string;
    score: number;
    submitted_at: string;
}

export const leaderboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getLeaderboard: builder.query<LeaderboardEntry[], number>({
            query: (competitionId) => `/leaderboard/${competitionId}`,
            providesTags: (result, error, id) => [{ type: 'Leaderboard', id }],
        }),
    }),
});

export const { useGetLeaderboardQuery } = leaderboardApi;
