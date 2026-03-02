import { baseApi } from './baseApi';

export interface Evaluation {
    id: number;
    submission_id: number;
    score: number;
    feedback: string;
    created_at: string;
}

export interface Submission {
    id: number;
    competitor_id: number;
    competition_id: number;
    content: string;
    status: 'pending' | 'evaluated' | 'error';
    created_at: string;
    evaluation?: Evaluation;
}

export const submissionsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCompetitionSubmissions: builder.query<Submission[], number>({
            query: (competitionId) => `/submissions/competition/${competitionId}`,
            providesTags: (result, error, id) => [{ type: 'Submission', id }],
        }),
        getMySubmissions: builder.query<Submission[], void>({
            query: () => '/submissions/me',
            providesTags: ['Submission'],
        }),
        getPendingSubmissions: builder.query<Submission[], void>({
            query: () => '/submissions/pending',
            providesTags: ['Submission'],
        }),
        createSubmission: builder.mutation<Submission, FormData>({
            query: (formData) => ({
                url: '/submissions/',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Submission'],
        }),
        triggerEvaluation: builder.mutation<{ message: string }, number>({
            query: (submissionId) => ({
                url: `/evaluation/${submissionId}`,
                method: 'POST',
            }),
            invalidatesTags: ['Submission', 'Leaderboard']
        }),
        submitManualEvaluation: builder.mutation<Evaluation, { submissionId: number; score: number; feedback: string }>({
            query: ({ submissionId, score, feedback }) => ({
                url: `/evaluation/${submissionId}/manual`,
                method: 'POST',
                body: { score, feedback }
            }),
            invalidatesTags: ['Submission', 'Leaderboard']
        })
    }),
});

export const {
    useGetCompetitionSubmissionsQuery,
    useGetMySubmissionsQuery,
    useGetPendingSubmissionsQuery,
    useCreateSubmissionMutation,
    useTriggerEvaluationMutation,
    useSubmitManualEvaluationMutation
} = submissionsApi;
