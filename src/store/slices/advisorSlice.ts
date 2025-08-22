import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { Advisor, AdvisorFormData } from '@/types'

interface AdvisorState {
  advisors: Advisor[]
  currentAdvisor: Advisor | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    totalPages: number
    totalAdvisors: number
    pageSize: number
  }
}

const initialState: AdvisorState = {
  advisors: [],
  currentAdvisor: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    totalAdvisors: 0,
    pageSize: 10
  }
}

export const fetchAdvisors = createAsyncThunk(
  'advisor/fetchAdvisors',
  async ({ 
    page = 1, 
    pageSize = 10, 
    search = '', 
    activeFilter = '' 
  }: { 
    page?: number; 
    pageSize?: number; 
    search?: string; 
    activeFilter?: string; 
  }) => {
    const supabase = createClient()
    
    let query = supabase
      .from('advisors')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(`nombre.ilike.%${search}%,correo.ilike.%${search}%,especialidad.ilike.%${search}%`)
    }

    if (activeFilter !== '') {
      query = query.eq('activo', activeFilter === 'true')
    }

    const { data, error, count } = await query
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    return {
      advisors: data || [],
      totalAdvisors: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page
    }
  }
)

export const fetchAdvisor = createAsyncThunk(
  'advisor/fetchAdvisor',
  async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }
)

export const createAdvisor = createAsyncThunk(
  'advisor/createAdvisor',
  async (advisorData: AdvisorFormData) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('advisors')
      .insert(advisorData)
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const updateAdvisor = createAsyncThunk(
  'advisor/updateAdvisor',
  async ({ id, advisorData }: { id: number; advisorData: Partial<AdvisorFormData> }) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('advisors')
      .update(advisorData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const deleteAdvisor = createAsyncThunk(
  'advisor/deleteAdvisor',
  async (id: number) => {
    const supabase = createClient()
    
    // First, set advisor_id to null for all outfits that reference this advisor
    await supabase
      .from('outfits')
      .update({ advisor_id: null })
      .eq('advisor_id', id)
    
    // Then delete the advisor
    const { error } = await supabase
      .from('advisors')
      .delete()
      .eq('id', id)

    if (error) throw error
    return id
  }
)

const advisorSlice = createSlice({
  name: 'advisor',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentAdvisor: (state) => {
      state.currentAdvisor = null
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch advisors
      .addCase(fetchAdvisors.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAdvisors.fulfilled, (state, action) => {
        state.loading = false
        state.advisors = action.payload.advisors
        state.pagination = {
          ...state.pagination,
          page: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalAdvisors: action.payload.totalAdvisors
        }
      })
      .addCase(fetchAdvisors.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar asesoras'
      })
      // Fetch advisor
      .addCase(fetchAdvisor.fulfilled, (state, action) => {
        state.currentAdvisor = action.payload
      })
      // Create advisor
      .addCase(createAdvisor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAdvisor.fulfilled, (state, action) => {
        state.loading = false
        state.advisors.unshift(action.payload)
        state.pagination.totalAdvisors += 1
      })
      .addCase(createAdvisor.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al crear asesora'
      })
      // Update advisor
      .addCase(updateAdvisor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateAdvisor.fulfilled, (state, action) => {
        state.loading = false
        const index = state.advisors.findIndex(advisor => advisor.id === action.payload.id)
        if (index !== -1) {
          state.advisors[index] = action.payload
        }
        if (state.currentAdvisor?.id === action.payload.id) {
          state.currentAdvisor = action.payload
        }
      })
      .addCase(updateAdvisor.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al actualizar asesora'
      })
      // Delete advisor
      .addCase(deleteAdvisor.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAdvisor.fulfilled, (state, action) => {
        state.loading = false
        state.advisors = state.advisors.filter(advisor => advisor.id !== action.payload)
        state.pagination.totalAdvisors -= 1
        if (state.currentAdvisor?.id === action.payload) {
          state.currentAdvisor = null
        }
      })
      .addCase(deleteAdvisor.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al eliminar asesora'
      })
  },
})

export const { clearError, clearCurrentAdvisor, setPagination } = advisorSlice.actions
export default advisorSlice.reducer