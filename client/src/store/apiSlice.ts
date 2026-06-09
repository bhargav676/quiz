import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from './authSlice';
import { STORAGE_KEYS } from '../constants';
import type { RootState } from './reduxStore';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      try {
        // We bypass headers prepare for refresh
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const resBody = (refreshResult.data as any);
          const data = resBody.data;
          
          const currentUser = (api.getState() as RootState).auth.user;
          if (currentUser) {
            api.dispatch(
              setCredentials({
                user: currentUser,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
              })
            );
            // retry original request
            result = await baseQuery(args, api, extraOptions);
          } else {
            api.dispatch(logout());
          }
        } else {
          api.dispatch(logout());
        }
      } catch (err) {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Dashboard', 'Quizzes', 'QuizDetails', 'Results', 'Users'],
  endpoints: (builder) => ({
    // Auth Endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Dashboard'],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    logoutApi: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // Admin Endpoints
    getDashboardStats: builder.query({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard'],
    }),
    getAdminQuizzes: builder.query({
      query: () => '/admin/quizzes',
      providesTags: ['Quizzes'],
    }),
    getAdminQuizById: builder.query({
      query: (id) => `/admin/quizzes/${id}`,
      providesTags: (result, error, id) => [{ type: 'QuizDetails', id }],
    }),
    createQuiz: builder.mutation({
      query: (quizData) => ({
        url: '/admin/quizzes',
        method: 'POST',
        body: quizData,
      }),
      invalidatesTags: ['Quizzes', 'Dashboard'],
    }),
    updateQuiz: builder.mutation({
      query: ({ id, body }) => ({
        url: `/admin/quizzes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        'Quizzes',
        'Dashboard',
        { type: 'QuizDetails', id: id },
      ],
    }),
    cancelQuiz: builder.mutation({
      query: (id) => ({
        url: `/admin/quizzes/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        'Quizzes',
        'Dashboard',
        { type: 'QuizDetails', id },
      ],
    }),
    getQuizResults: builder.query({
      query: (id) => `/admin/quizzes/${id}/results`,
      providesTags: (result, error, id) => [{ type: 'Results', id }],
    }),
    assignInstructor: builder.mutation({
      query: (body) => ({
        url: '/admin/access/assign-instructor',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Dashboard'],
    }),

    // Instructor Endpoints
    getInstructorQuizzes: builder.query({
      query: () => '/instructor/quizzes',
      providesTags: ['Quizzes'],
    }),
    createInstructorQuiz: builder.mutation({
      query: (body) => ({
        url: '/instructor/quizzes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Quizzes'],
    }),
    getInstructorQuizById: builder.query({
      query: (id) => `/instructor/quizzes/${id}`,
      providesTags: (result, error, id) => [{ type: 'QuizDetails', id }],
    }),
    updateInstructorQuiz: builder.mutation({
      query: ({ id, body }) => ({
        url: `/instructor/quizzes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        'Quizzes',
        { type: 'QuizDetails', id },
      ],
    }),
    publishQuiz: builder.mutation({
      query: (id) => ({
        url: `/instructor/quizzes/${id}/publish`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        'Quizzes',
        { type: 'QuizDetails', id },
      ],
    }),
    cancelInstructorQuiz: builder.mutation({
      query: (id) => ({
        url: `/instructor/quizzes/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        'Quizzes',
        { type: 'QuizDetails', id },
      ],
    }),
    addQuestionsManual: builder.mutation({
      query: ({ id, questions }) => ({
        url: `/instructor/quizzes/${id}/questions`,
        method: 'POST',
        body: { questions },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'QuizDetails', id }],
    }),
    uploadQuestionsCSV: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/instructor/quizzes/${id}/questions/csv`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'QuizDetails', id }],
    }),
    addParticipants: builder.mutation({
      query: ({ id, emails }) => ({
        url: `/instructor/quizzes/${id}/participants`,
        method: 'POST',
        body: { emails },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'QuizDetails', id }],
    }),
    uploadParticipantsCSV: builder.mutation({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/instructor/quizzes/${id}/participants/csv`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'QuizDetails', id }],
    }),
    getQuizAnalytics: builder.query({
      query: (id) => `/instructor/quizzes/${id}/analytics`,
      providesTags: (result, error, id) => [{ type: 'Results', id }],
    }),

    // Participant Endpoints
    getParticipantQuizzes: builder.query({
      query: () => '/participant/quizzes',
      providesTags: ['Quizzes', 'Dashboard'],
    }),
    startAttempt: builder.mutation({
      query: (quizId) => ({
        url: `/participant/quizzes/${quizId}/start`,
        method: 'POST',
      }),
      invalidatesTags: ['Quizzes', 'Dashboard'],
    }),
    saveAnswer: builder.mutation({
      query: ({ attemptId, body }) => ({
        url: `/participant/attempts/${attemptId}/answer`,
        method: 'POST',
        body,
      }),
    }),
    submitAttempt: builder.mutation({
      query: ({ attemptId, body }) => ({
        url: `/participant/attempts/${attemptId}/submit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Quizzes', 'Dashboard', 'Results'],
    }),
    getAttemptResult: builder.query({
      query: (id) => `/participant/attempts/${id}/result`,
      providesTags: (result, error, id) => [{ type: 'Results', id }],
    }),
    getAttemptDetails: builder.query({
      query: (id) => `/participant/attempts/${id}/details`,
      providesTags: (result, error, id) => [{ type: 'Results', id }],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutApiMutation,
  useGetDashboardStatsQuery,
  useGetAdminQuizzesQuery,
  useGetAdminQuizByIdQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useCancelQuizMutation,
  useGetQuizResultsQuery,
  useAssignInstructorMutation,
  useGetInstructorQuizzesQuery,
  useCreateInstructorQuizMutation,
  useGetInstructorQuizByIdQuery,
  useUpdateInstructorQuizMutation,
  usePublishQuizMutation,
  useCancelInstructorQuizMutation,
  useAddQuestionsManualMutation,
  useUploadQuestionsCSVMutation,
  useAddParticipantsMutation,
  useUploadParticipantsCSVMutation,
  useGetQuizAnalyticsQuery,
  useGetParticipantQuizzesQuery,
  useStartAttemptMutation,
  useSaveAnswerMutation,
  useSubmitAttemptMutation,
  useGetAttemptResultQuery,
  useGetAttemptDetailsQuery,
} = apiSlice;
