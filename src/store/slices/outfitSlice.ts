import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { Outfit, Style, Occasion, OutfitFormData } from '@/types'

interface OutfitState {
  outfits: Outfit[]
  styles: Style[]
  occasions: Occasion[]
  currentOutfit: Outfit | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    totalPages: number
    totalOutfits: number
    pageSize: number
  }
}

const initialState: OutfitState = {
  outfits: [],
  styles: [],
  occasions: [],
  currentOutfit: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    totalOutfits: 0,
    pageSize: 10
  }
}

// Async thunks
export const fetchOutfits = createAsyncThunk(
  'outfit/fetchOutfits',
  async ({ 
    page = 1, 
    pageSize = 10, 
    search = '', 
    styleFilter = '', 
    occasionFilter = '' 
  }: { 
    page?: number; 
    pageSize?: number; 
    search?: string; 
    styleFilter?: string; 
    occasionFilter?: string; 
  }) => {
    const supabase = createClient()
    
    let query = supabase
      .from('outfits')
      .select(`
        *,
        estilos!inner(tipo)
      `, { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%`)
    }

    // Apply style filter
    if (styleFilter) {
      query = query.eq('estilos.tipo', styleFilter)
    }

    const { data, error, count } = await query
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    // Get outfit details with images and occasions
    const outfitsWithDetails = await Promise.all(
      (data || []).map(async (outfit: any) => {
        // Get outfit image with error handling - using correct Outfits bucket and path
        let imageUrl = null
        try {
          // Use Outfits bucket with correct path structure
          const { data: files, error: listError } = await supabase.storage
            .from('Outfits')
            .list(`uploads/${outfit.id}/imagen_principal`, { limit: 1 })
            
          console.log(`Checking Outfits bucket for outfit ${outfit.id}:`, { files, listError })
          
          if (!listError && files && files.length > 0) {
            const path = `uploads/${outfit.id}/imagen_principal/${files[0].name}`
              
            const { data: urlData } = supabase.storage
              .from('Outfits')
              .getPublicUrl(path)
            
            // Only set imageUrl if we have a valid public URL
            if (urlData?.publicUrl) {
              imageUrl = urlData.publicUrl
              console.log(`Generated image URL for outfit ${outfit.id}:`, imageUrl)
            } else {
              console.warn(`No public URL generated for outfit ${outfit.id}`)
            }
          } else {
            console.warn(`No files found for outfit ${outfit.id} in Outfits bucket`)
          }
        } catch (error) {
          console.warn(`Error loading image for outfit ${outfit.id}:`, error)
          // imageUrl remains null, will show placeholder in UI
        }

        // Get occasions
        const { data: outfitOccasions } = await supabase
          .from('outfit_ocasion')
          .select('id_ocasion')
          .eq('id_outfit', outfit.id)

        // Get occasion names separately
        let ocasiones: string[] = []
        if (outfitOccasions && outfitOccasions.length > 0) {
          const occasionIds = outfitOccasions.map((oo: any) => oo.id_ocasion)
          const { data: occasionsData } = await supabase
            .from('ocasion')
            .select('ocasion')
            .in('id', occasionIds)
          
          ocasiones = occasionsData?.map((o: any) => o.ocasion) || []
        }

        // Get favorites count
        const { count: favoritesCount } = await supabase
          .from('favoritos')
          .select('*', { count: 'exact', head: true })
          .eq('outfit', outfit.id)

        return {
          ...outfit,
          estilo: outfit.estilos.tipo,
          imagen: imageUrl,
          ocasiones: ocasiones,
          favoritos: favoritesCount || 0
        }
      })
    )

    // Apply occasion filter after data processing
    let filteredOutfits = outfitsWithDetails
    if (occasionFilter) {
      filteredOutfits = outfitsWithDetails.filter(outfit => 
        outfit.ocasiones.some((ocasion: string) => 
          ocasion.toLowerCase().includes(occasionFilter.toLowerCase())
        )
      )
    }

    return {
      outfits: filteredOutfits,
      totalOutfits: occasionFilter ? filteredOutfits.length : count || 0,
      totalPages: Math.ceil((occasionFilter ? filteredOutfits.length : count || 0) / pageSize),
      currentPage: page
    }
  }
)

export const fetchStyles = createAsyncThunk(
  'outfit/fetchStyles',
  async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('estilos')
      .select('*')
      .order('tipo')

    if (error) throw error
    return data
  }
)

export const fetchOccasions = createAsyncThunk(
  'outfit/fetchOccasions',
  async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ocasion')
      .select('*')
      .order('ocasion')

    if (error) throw error
    return data
  }
)

export const createOutfit = createAsyncThunk(
  'outfit/createOutfit',
  async (outfitData: OutfitFormData) => {
    const supabase = createClient()
    
    // Create outfit
    const { data, error } = await supabase
      .from('outfits')
      .insert({
        nombre: outfitData.nombre,
        descripcion: outfitData.descripcion,
        id_estilo: outfitData.id_estilo
      })
      .select()
      .single()

    if (error) throw error

    // Upload image if provided
    if (outfitData.imagen) {
      const fileName = `${Date.now()}_${outfitData.imagen.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      await supabase.storage
        .from('Outfits')
        .upload(`uploads/${data.id}/imagen_principal/${fileName}`, outfitData.imagen)
    }

    // Add occasions
    if (outfitData.ocasiones.length > 0) {
      const occasionInserts = outfitData.ocasiones.map(occasionId => ({
        id_outfit: data.id,
        id_ocasion: occasionId
      }))
      
      await supabase
        .from('outfit_ocasion')
        .insert(occasionInserts)
    }

    // Create prendas
    if (outfitData.prendas.length > 0) {
      for (const prenda of outfitData.prendas) {
        const { data: prendaData } = await supabase
          .from('prendas')
          .insert({
            nombre: prenda.nombre,
            link: prenda.link,
            id_outfit: data.id
          })
          .select()
          .single()

        // Upload prenda image if provided
        if (prenda.imagen && prendaData) {
          const fileName = `prenda_${Date.now()}_${prenda.imagen.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
          await supabase.storage
            .from('Outfits')
            .upload(`uploads/${data.id}/prendas/${fileName}`, prenda.imagen)
        }
      }
    }

    return data
  }
)

export const updateOutfit = createAsyncThunk(
  'outfit/updateOutfit',
  async ({ id, outfitData }: { id: number; outfitData: Partial<OutfitFormData> }) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('outfits')
      .update({
        nombre: outfitData.nombre,
        descripcion: outfitData.descripcion,
        id_estilo: outfitData.id_estilo
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Upload new image if provided
    if (outfitData.imagen) {
      const fileName = `${Date.now()}_${outfitData.imagen.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      await supabase.storage
        .from('Outfits')
        .upload(`uploads/${id}/imagen_principal/${fileName}`, outfitData.imagen)
    }

    // Update occasions if provided
    if (outfitData.ocasiones) {
      // Delete existing occasions
      await supabase
        .from('outfit_ocasion')
        .delete()
        .eq('id_outfit', id)

      // Insert new occasions
      if (outfitData.ocasiones.length > 0) {
        const occasionInserts = outfitData.ocasiones.map(occasionId => ({
          id_outfit: id,
          id_ocasion: occasionId
        }))
        
        await supabase
          .from('outfit_ocasion')
          .insert(occasionInserts)
      }
    }

    return data
  }
)

export const deleteOutfit = createAsyncThunk(
  'outfit/deleteOutfit',
  async (id: number) => {
    const supabase = createClient()
    
    // Delete outfit images from storage
    const { data: files } = await supabase.storage
      .from('Outfits')
      .list(`uploads/${id}/imagen_principal`)
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => `uploads/${id}/imagen_principal/${file.name}`)
      await supabase.storage
        .from('Outfits')
        .remove(filePaths)
    }
    
    // Delete related data
    await Promise.all([
      supabase.from('prendas').delete().eq('id_outfit', id),
      supabase.from('outfit_ocasion').delete().eq('id_outfit', id),
      supabase.from('favoritos').delete().eq('outfit', id)
    ])
    
    // Delete outfit
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', id)

    if (error) throw error
    return id
  }
)

const outfitSlice = createSlice({
  name: 'outfit',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentOutfit: (state) => {
      state.currentOutfit = null
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch outfits
      .addCase(fetchOutfits.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOutfits.fulfilled, (state, action) => {
        state.loading = false
        state.outfits = action.payload.outfits
        state.pagination = {
          ...state.pagination,
          page: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalOutfits: action.payload.totalOutfits
        }
      })
      .addCase(fetchOutfits.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar outfits'
      })
      // Fetch styles
      .addCase(fetchStyles.fulfilled, (state, action) => {
        state.styles = action.payload
      })
      // Fetch occasions
      .addCase(fetchOccasions.fulfilled, (state, action) => {
        state.occasions = action.payload
      })
      // Create outfit
      .addCase(createOutfit.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createOutfit.fulfilled, (state, action) => {
        state.loading = false
        state.outfits.unshift(action.payload as any)
        state.pagination.totalOutfits += 1
      })
      .addCase(createOutfit.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al crear outfit'
      })
      // Update outfit
      .addCase(updateOutfit.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateOutfit.fulfilled, (state, action) => {
        state.loading = false
        const index = state.outfits.findIndex(outfit => outfit.id === action.payload.id)
        if (index !== -1) {
          state.outfits[index] = { ...state.outfits[index], ...action.payload }
        }
      })
      .addCase(updateOutfit.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al actualizar outfit'
      })
      // Delete outfit
      .addCase(deleteOutfit.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteOutfit.fulfilled, (state, action) => {
        state.loading = false
        state.outfits = state.outfits.filter(outfit => outfit.id !== action.payload)
        state.pagination.totalOutfits -= 1
      })
      .addCase(deleteOutfit.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al eliminar outfit'
      })
  },
})

export const { clearError, clearCurrentOutfit, setPagination } = outfitSlice.actions
export default outfitSlice.reducer
