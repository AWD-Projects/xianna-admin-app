import { configureStore } from '@reduxjs/toolkit'

import authSlice from './slices/authSlice'
import blogSlice from './slices/blogSlice'
import outfitSlice from './slices/outfitSlice'
import userSlice from './slices/userSlice'
import questionnaireSlice from './slices/questionnaireSlice'
import insightsSlice from './slices/insightsSlice'
import advisorSlice from './slices/advisorSlice'
import styleSlice from './slices/styleSlice'
import occasionSlice from './slices/occasionSlice'
import newsletterSlice from './slices/newsletterSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    blog: blogSlice,
    outfit: outfitSlice,
    user: userSlice,
    questionnaire: questionnaireSlice,
    insights: insightsSlice,
    advisor: advisorSlice,
    style: styleSlice,
    occasion: occasionSlice,
    newsletter: newsletterSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
