import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { Occasion, OccasionFormData } from '@/types'

interface OccasionState {
  occasions: Occasion[]
  loading: boolean
  error: string | null
}

const initialState: OccasionState = {
  occasions: [],
  loading: false,
  error: null
}

export const fetchOccasions = createAsyncThunk(
  'occasion/fetchOccasions',
  async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('ocasion')
      .select('*')
      .order('ocasion')

    if (error) throw error
    return data || []
  }
)

export const createOccasion = createAsyncThunk(
  'occasion/createOccasion',
  async (occasionData: OccasionFormData) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('ocasion')
      .insert(occasionData)
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const updateOccasion = createAsyncThunk(
  'occasion/updateOccasion',
  async ({ id, occasionData }: { id: number; occasionData: OccasionFormData }) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('ocasion')
      .update(occasionData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const deleteOccasion = createAsyncThunk(
  'occasion/deleteOccasion',
  async (id: number) => {
    const supabase = createClient()
    
    // First, check if this occasion is being used by any outfits
    const { data: usedByOutfits, error: checkError } = await supabase
      .from('outfit_ocasion')
      .select('id')
      .eq('id_ocasion', id)
      .limit(1)

    if (checkError) throw checkError

    if (usedByOutfits && usedByOutfits.length > 0) {
      throw new Error('No se puede eliminar esta ocasión porque está siendo usada por uno o más outfits')
    }

    // If not used, proceed with deletion
    const { error } = await supabase
      .from('ocasion')
      .delete()
      .eq('id', id)

    if (error) throw error
    return id
  }
)

const occasionSlice = createSlice({
  name: 'occasion',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch occasions
      .addCase(fetchOccasions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOccasions.fulfilled, (state, action) => {
        state.loading = false
        state.occasions = action.payload
      })
      .addCase(fetchOccasions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar ocasiones'
      })
      // Create occasion
      .addCase(createOccasion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOccasion.fulfilled, (state, action) => {
        state.loading = false
        state.occasions.push(action.payload)
      })
      .addCase(createOccasion.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al crear ocasión'
      })
      // Update occasion
      .addCase(updateOccasion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOccasion.fulfilled, (state, action) => {
        state.loading = false
        const index = state.occasions.findIndex(occasion => occasion.id === action.payload.id)
        if (index !== -1) {
          state.occasions[index] = action.payload
        }
      })
      .addCase(updateOccasion.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al actualizar ocasión'
      })
      // Delete occasion
      .addCase(deleteOccasion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteOccasion.fulfilled, (state, action) => {
        state.loading = false
        state.occasions = state.occasions.filter(occasion => occasion.id !== action.payload)
      })
      .addCase(deleteOccasion.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al eliminar ocasión'
      })
  }
})

export const { clearError } = occasionSlice.actions
export default occasionSlice.reducer