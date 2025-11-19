import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import type {
  UserAnalytics,
  BlogAnalytics,
  OutfitAnalytics,
  QuestionnaireAnalytics,
  DashboardInsights,
} from '@/types'

interface InsightsState {
  userAnalytics: UserAnalytics | null
  blogAnalytics: BlogAnalytics | null
  outfitAnalytics: OutfitAnalytics | null
  questionnaireAnalytics: QuestionnaireAnalytics | null
  loading: boolean
  error: string | null
}

const initialState: InsightsState = {
  userAnalytics: null,
  blogAnalytics: null,
  outfitAnalytics: null,
  questionnaireAnalytics: null,
  loading: false,
  error: null,
}

interface InsightsApiResponse {
  success: boolean
  data?: DashboardInsights
  error?: string
}

export const fetchAllAnalytics = createAsyncThunk('insights/fetchAllAnalytics', async () => {
  const response = await fetch('/api/insights', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('No se pudieron obtener las analíticas')
  }

  const payload = (await response.json()) as InsightsApiResponse

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || 'Respuesta inválida del servidor de analíticas')
  }

  return payload.data
})

const insightsSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAnalytics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllAnalytics.fulfilled, (state, action) => {
        state.loading = false
        state.userAnalytics = action.payload.users
        state.blogAnalytics = action.payload.blogs
        state.outfitAnalytics = action.payload.outfits
        state.questionnaireAnalytics = action.payload.questionnaire
      })
      .addCase(fetchAllAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar analíticas'
      })
  },
})

export const { clearError } = insightsSlice.actions
export default insightsSlice.reducer
