import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { NewsletterCampaign, NewsletterFormData, SelectedUser } from '@/types'

interface NewsletterState {
  campaigns: NewsletterCampaign[]
  selectedUsers: SelectedUser[]
  loading: boolean
  error: string | null
  selectedCampaign: NewsletterCampaign | null
}

const initialState: NewsletterState = {
  campaigns: [],
  selectedUsers: [],
  loading: false,
  error: null,
  selectedCampaign: null
}

// Async thunks
export const fetchCampaigns = createAsyncThunk(
  'newsletter/fetchCampaigns',
  async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
)

export const createCampaign = createAsyncThunk(
  'newsletter/createCampaign',
  async (formData: NewsletterFormData) => {
    const supabase = createClient()
    
    const campaignData = {
      nombre: formData.nombre,
      asunto: formData.asunto,
      template_usado: formData.template_usado,
      numero_usuarios_enviados: formData.selectedEmails.length,
      filtros_aplicados: JSON.stringify(formData.filtros_aplicados || {}),
      emails: JSON.stringify(formData.selectedEmails || [])
    }

    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .insert([campaignData])
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const fetchUsersForNewsletter = createAsyncThunk(
  'newsletter/fetchUsersForNewsletter',
  async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_details')
      .select('id, nombre, correo, estado, genero, edad, tipo_estilo, ocupacion')

    if (error) throw error
    return data.map(user => ({ ...user, selected: false }))
  }
)

export const sendNewsletterCampaign = createAsyncThunk(
  'newsletter/sendCampaign',
  async ({ campaignId, users, template }: { 
    campaignId: number
    users: SelectedUser[]
    template: { subject: string; htmlContent: string }
  }) => {
    const response = await fetch('/api/newsletter/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        users,
        template
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to send newsletter'
      try {
        const payload = await response.json()
        errorMessage = payload?.message || payload?.details || payload?.error || errorMessage
      } catch {
        // ignore parse errors
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }
)

const newsletterSlice = createSlice({
  name: 'newsletter',
  initialState,
  reducers: {
    setSelectedCampaign: (state, action: PayloadAction<NewsletterCampaign | null>) => {
      state.selectedCampaign = action.payload
    },
    toggleUserSelection: (state, action: PayloadAction<number>) => {
      const userId = action.payload
      const user = state.selectedUsers.find(u => u.id === userId)
      if (user) {
        user.selected = !user.selected
      }
    },
    selectAllUsers: (state, action: PayloadAction<boolean>) => {
      state.selectedUsers.forEach(user => {
        user.selected = action.payload
      })
    },
    clearSelectedUsers: (state) => {
      state.selectedUsers.forEach(user => {
        user.selected = false
      })
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch campaigns
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false
        state.campaigns = action.payload
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch campaigns'
      })
      // Create campaign
      .addCase(createCampaign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.loading = false
        state.campaigns.unshift(action.payload)
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create campaign'
      })
      // Fetch users
      .addCase(fetchUsersForNewsletter.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsersForNewsletter.fulfilled, (state, action) => {
        state.loading = false
        state.selectedUsers = action.payload
      })
      .addCase(fetchUsersForNewsletter.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch users'
      })
      // Send campaign
      .addCase(sendNewsletterCampaign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sendNewsletterCampaign.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(sendNewsletterCampaign.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to send newsletter'
      })
  }
})

export const {
  setSelectedCampaign,
  toggleUserSelection,
  selectAllUsers,
  clearSelectedUsers,
  clearError
} = newsletterSlice.actions

export default newsletterSlice.reducer
