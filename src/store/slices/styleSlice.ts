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
      .insert(styleData)
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

export const deleteStyle = createAsyncThunk(
  'style/deleteStyle',
  async (id: number) => {
    const supabase = createClient()
    
    // First, check if this style is being used by any outfits
    const { data: usedByOutfits, error: checkError } = await supabase
      .from('outfits')
      .select('id')
      .eq('id_estilo', id)
      .limit(1)

    if (checkError) throw checkError

    if (usedByOutfits && usedByOutfits.length > 0) {
      throw new Error('No se puede eliminar este estilo porque está siendo usado por uno o más outfits')
    }

    // Also check if it's being used by questionnaire answers
    const { data: usedByAnswers, error: answersError } = await supabase
      .from('respuestas')
      .select('id')
      .eq('id_estilo', id)
      .limit(1)

    if (answersError) throw answersError

    if (usedByAnswers && usedByAnswers.length > 0) {
      throw new Error('No se puede eliminar este estilo porque está siendo usado por respuestas del cuestionario')
    }

    // If not used, proceed with deletion
    const { error } = await supabase
      .from('estilos')
      .delete()
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