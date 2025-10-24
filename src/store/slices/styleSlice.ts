import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { Style, StyleFormData } from '@/types'

interface StyleState {
  styles: Style[]
  loading: boolean
  error: string | null
}

const initialState: StyleState = {
  styles: [],
  loading: false,
  error: null
}

export const fetchStyles = createAsyncThunk(
  'style/fetchStyles',
  async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('estilos')
      .select('*')
      .order('tipo')

    if (error) throw error
    return data || []
  }
)

export const createStyle = createAsyncThunk(
  'style/createStyle',
  async (styleData: StyleFormData) => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('estilos')
      .insert({ ...styleData, status: 'activo' })
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const updateStyle = createAsyncThunk(
  'style/updateStyle',
  async ({ id, styleData }: { id: number; styleData: StyleFormData }) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('estilos')
      .update(styleData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const toggleStyleStatus = createAsyncThunk(
  'style/toggleStyleStatus',
  async ({ id, currentStatus }: { id: number; currentStatus: 'activo' | 'inactivo' }) => {
    const supabase = createClient()

    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo'

    const { data, error } = await supabase
      .from('estilos')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
)

// Keep deleteStyle for backward compatibility (soft delete)
export const deleteStyle = createAsyncThunk(
  'style/deleteStyle',
  async (id: number) => {
    const supabase = createClient()

    // Soft delete: update status to 'inactivo' instead of deleting
    const { error } = await supabase
      .from('estilos')
      .update({ status: 'inactivo' })
      .eq('id', id)

    if (error) throw error
    return id
  }
)

const styleSlice = createSlice({
  name: 'style',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch styles
      .addCase(fetchStyles.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStyles.fulfilled, (state, action) => {
        state.loading = false
        state.styles = action.payload
      })
      .addCase(fetchStyles.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar estilos'
      })
      // Create style
      .addCase(createStyle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createStyle.fulfilled, (state, action) => {
        state.loading = false
        state.styles.push(action.payload)
      })
      .addCase(createStyle.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al crear estilo'
      })
      // Update style
      .addCase(updateStyle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateStyle.fulfilled, (state, action) => {
        state.loading = false
        const index = state.styles.findIndex(style => style.id === action.payload.id)
        if (index !== -1) {
          state.styles[index] = action.payload
        }
      })
      .addCase(updateStyle.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al actualizar estilo'
      })
      // Toggle style status
      .addCase(toggleStyleStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleStyleStatus.fulfilled, (state, action) => {
        state.loading = false
        const index = state.styles.findIndex(style => style.id === action.payload.id)
        if (index !== -1) {
          state.styles[index] = action.payload
        }
      })
      .addCase(toggleStyleStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cambiar el estado del estilo'
      })
      // Delete style
      .addCase(deleteStyle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteStyle.fulfilled, (state, action) => {
        state.loading = false
        state.styles = state.styles.filter(style => style.id !== action.payload)
      })
      .addCase(deleteStyle.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al eliminar estilo'
      })
  }
})

export const { clearError } = styleSlice.actions
export default styleSlice.reducer