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
        estilos!inner(tipo),
        advisors(id, nombre, especialidad)
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
            .list(`uploads/${outfit.id}/imagen_principal`)
            
          console.log(`Checking Outfits bucket for outfit ${outfit.id}:`, { files, listError })
          
          if (!listError && files && files.length > 0) {
            // Sort files by created_at timestamp to get the most recent one
            const sortedFiles = files.sort((a, b) => 
              new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )
            const path = `uploads/${outfit.id}/imagen_principal/${sortedFiles[0].name}`
              
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
          favoritos: favoritesCount || 0,
          advisor: outfit.advisors ? {
            id: outfit.advisors.id,
            nombre: outfit.advisors.nombre,
            especialidad: outfit.advisors.especialidad
          } : undefined
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
    const outfitInsert: any = {
      nombre: outfitData.nombre,
      descripcion: outfitData.descripcion,
      id_estilo: outfitData.id_estilo
    }
    
    // Only add advisor_id if it's provided and not 0
    if (outfitData.advisor_id && outfitData.advisor_id > 0) {
      outfitInsert.advisor_id = outfitData.advisor_id
    }

    const { data, error } = await supabase
      .from('outfits')
      .insert(outfitInsert)
      .select()
      .single()

    if (error) throw error

    // Upload main outfit image if provided
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

    // Create prendas and upload their images
    if (outfitData.prendas.length > 0) {
      const prendaInserts = outfitData.prendas.map(prenda => ({
        nombre: prenda.nombre,
        link: prenda.link,
        id_outfit: data.id
      }))
      
      const { data: insertedPrendas } = await supabase
        .from('prendas')
        .insert(prendaInserts)
        .select('id')

      // Upload prenda images if provided
      if (insertedPrendas) {
        for (let i = 0; i < outfitData.prendas.length; i++) {
          const prenda = outfitData.prendas[i]
          const prendaId = insertedPrendas[i].id
          
          if (prenda.imagen) {
            const fileName = `${Date.now()}_${prenda.imagen.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
            await supabase.storage
              .from('Outfits')
              .upload(`uploads/${data.id}/prendas/${prendaId}/${fileName}`, prenda.imagen)
          }
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
    
    const outfitUpdate: any = {
      nombre: outfitData.nombre,
      descripcion: outfitData.descripcion,
      id_estilo: outfitData.id_estilo
    }
    
    // Handle advisor_id update (including setting to null)
    if (outfitData.advisor_id !== undefined) {
      outfitUpdate.advisor_id = outfitData.advisor_id && outfitData.advisor_id > 0 ? outfitData.advisor_id : null
    }

    const { data, error } = await supabase
      .from('outfits')
      .update(outfitUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Upload new main image if provided
    if (outfitData.imagen) {
      // Delete existing images first
      const { data: existingFiles } = await supabase.storage
        .from('Outfits')
        .list(`uploads/${id}/imagen_principal`)
      
      if (existingFiles && existingFiles.length > 0) {
        const filePaths = existingFiles.map(file => `uploads/${id}/imagen_principal/${file.name}`)
        await supabase.storage
          .from('Outfits')
          .remove(filePaths)
      }
      
      // Upload new image
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

    // Update prendas if provided
    if (outfitData.prendas) {
      // Get existing prendas to delete their images
      const { data: existingPrendas } = await supabase
        .from('prendas')
        .select('id')
        .eq('id_outfit', id)

      // Delete existing prenda images
      if (existingPrendas) {
        for (const prenda of existingPrendas) {
          const { data: prendaFiles } = await supabase.storage
            .from('Outfits')
            .list(`uploads/${id}/prendas/${prenda.id}`)
          
          if (prendaFiles && prendaFiles.length > 0) {
            const filePaths = prendaFiles.map(file => `uploads/${id}/prendas/${prenda.id}/${file.name}`)
            await supabase.storage
              .from('Outfits')
              .remove(filePaths)
          }
        }
      }

      // Delete existing prendas
      await supabase
        .from('prendas')
        .delete()
        .eq('id_outfit', id)

      // Insert new prendas
      if (outfitData.prendas.length > 0) {
        const prendaInserts = outfitData.prendas.map(prenda => ({
          nombre: prenda.nombre,
          link: prenda.link,
          id_outfit: id
        }))
        
        const { data: insertedPrendas } = await supabase
          .from('prendas')
          .insert(prendaInserts)
          .select('id')

        // Upload new prenda images if provided
        if (insertedPrendas) {
          for (let i = 0; i < outfitData.prendas.length; i++) {
            const prenda = outfitData.prendas[i]
            const prendaId = insertedPrendas[i].id
            
            if (prenda.imagen) {
              const fileName = `${Date.now()}_${prenda.imagen.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
              await supabase.storage
                .from('Outfits')
                .upload(`uploads/${id}/prendas/${prendaId}/${fileName}`, prenda.imagen)
            }
          }
        }
      }
    }

    return data
  }
)

export const deleteOutfit = createAsyncThunk(
  'outfit/deleteOutfit',
  async (id: number) => {
    const supabase = createClient()
    
    // Get prendas to delete their images
    const { data: prendas } = await supabase
      .from('prendas')
      .select('id')
      .eq('id_outfit', id)

    // Delete prenda images
    if (prendas) {
      for (const prenda of prendas) {
        const { data: prendaFiles } = await supabase.storage
          .from('Outfits')
          .list(`uploads/${id}/prendas/${prenda.id}`)
        
        if (prendaFiles && prendaFiles.length > 0) {
          const filePaths = prendaFiles.map(file => `uploads/${id}/prendas/${prenda.id}/${file.name}`)
          await supabase.storage
            .from('Outfits')
            .remove(filePaths)
        }
      }
    }
    
    // Delete outfit main images from storage
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