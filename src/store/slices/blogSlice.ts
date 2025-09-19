import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { Blog, BlogCategory, BlogFormData } from '@/types'

interface BlogState {
  blogs: Blog[]
  categories: BlogCategory[]
  currentBlog: Blog | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    totalPages: number
    totalBlogs: number
    pageSize: number
  }
}

const initialState: BlogState = {
  blogs: [],
  categories: [],
  currentBlog: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    totalBlogs: 0,
    pageSize: 10
  }
}

// Helper function to extract file path from URL
const getFilePathFromUrl = (url: string, blogId: number): string | null => {
  try {
    // Extract the path after the bucket name
    const urlParts = url.split('/')
    const uploadsIndex = urlParts.findIndex(part => part === 'uploads')
    if (uploadsIndex === -1) return null
    
    // Return path from 'uploads' onward
    return urlParts.slice(uploadsIndex).join('/')
  } catch {
    return null
  }
}

// Async thunks
export const fetchBlogs = createAsyncThunk(
  'blog/fetchBlogs',
  async ({ 
    page = 1, 
    pageSize = 10, 
    category = '', 
    search = '',
    minRating = 0
  }: { 
    page?: number; 
    pageSize?: number; 
    category?: string; 
    search?: string;
    minRating?: number;
  }) => {
    const supabase = createClient()
    
    let query = supabase
      .from('blogs')
      .select(`
        id,
        titulo,
        descripcion,
        contenido,
        id_categoria,
        categoria_blog!inner(categoria)
      `, { count: 'exact' })
      .order('id', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%,contenido.ilike.%${search}%`)
    }

    // Apply category filter
    if (category && category !== 'all' && category !== '') {
      query = query.eq('categoria_blog.categoria', category)
    }

    const { data, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    // Get images and ratings for each blog
    const blogsWithDetails = await Promise.all(
      (data || []).map(async (blog: any) => {
        // Get blog image from storage
        let imageUrl = '/images/placeholder.jpg'
        
        const { data: files } = await supabase.storage
          .from('Blogs')
          .list(`uploads/${blog.id}`, { limit: 1 })
          
        if (files && files.length > 0) {
          const { data: urlData } = supabase.storage
            .from('Blogs')
            .getPublicUrl(`uploads/${blog.id}/${files[0].name}`)
          imageUrl = urlData.publicUrl
        }

        // Get all images
        const { data: allFiles } = await supabase.storage
          .from('Blogs')
          .list(`uploads/${blog.id}`)
          
        const images = allFiles?.map(file => 
          supabase.storage.from('Blogs').getPublicUrl(`uploads/${blog.id}/${file.name}`).data.publicUrl
        ) || []

        // Get ratings
        const { data: ratingsData } = await supabase
          .from('blogs_calificados')
          .select('calificacion')
          .eq('blog', blog.id)

        const ratings = ratingsData?.map(r => r.calificacion) || []
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0

        return {
          ...blog,
          categoria: blog.categoria_blog.categoria,
          image: imageUrl,
          name: blog.titulo,
          category: blog.categoria_blog.categoria,
          rating: Math.round(averageRating * 10) / 10,
          persons: ratings.length,
          images: images
        }
      })
    )

    // Apply rating filter after data processing
    let filteredBlogs = blogsWithDetails
    if (minRating > 0) {
      filteredBlogs = blogsWithDetails.filter(blog => blog.rating >= minRating)
    }

    return {
      blogs: filteredBlogs,
      totalBlogs: minRating > 0 ? filteredBlogs.length : count || 0,
      totalPages: Math.ceil((minRating > 0 ? filteredBlogs.length : count || 0) / pageSize),
      currentPage: page
    }
  }
)

export const fetchCategories = createAsyncThunk(
  'blog/fetchCategories',
  async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categoria_blog')
      .select('*')
      .order('categoria')

    if (error) throw error
    return data
  }
)

export const fetchBlogById = createAsyncThunk(
  'blog/fetchBlogById',
  async (id: number) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('blogs')
      .select(`
        *,
        categoria_blog(categoria)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Get blog images
    const { data: files } = await supabase.storage
      .from('Blogs')
      .list(`uploads/${data.id}`)

    const images = files?.map(file => 
      supabase.storage.from('Blogs').getPublicUrl(`uploads/${data.id}/${file.name}`).data.publicUrl
    ) || []

    return {
      ...data,
      categoria: data.categoria_blog.categoria,
      image: images[0] || '/images/placeholder.jpg',
      images: images
    }
  }
)

export const fetchBlogCategories = createAsyncThunk(
  'blog/fetchBlogCategories',
  async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categoria_blog')
      .select('*')
      .order('categoria')

    if (error) throw error
    return data
  }
)

export const createBlog = createAsyncThunk(
  'blog/createBlog',
  async (blogData: BlogFormData) => {
    const supabase = createClient()
    
    // Create blog
    const { data, error } = await supabase
      .from('blogs')
      .insert({
        titulo: blogData.titulo,
        descripcion: blogData.descripcion,
        contenido: blogData.contenido,
        id_categoria: blogData.id_categoria
      })
      .select()
      .single()

    if (error) throw error

    // Upload images if provided
    if (blogData.images && blogData.images.length > 0) {
      for (const image of blogData.images) {
        const fileName = `${Date.now()}_${image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        await supabase.storage
          .from('Blogs')
          .upload(`uploads/${data.id}/${fileName}`, image)
      }
    }

    return data
  }
)

export const updateBlog = createAsyncThunk(
  'blog/updateBlog',
  async ({ id, blogData }: { id: number; blogData: Partial<BlogFormData> & { imagesToDelete?: string[] } }) => {
    const supabase = createClient()
    
    // Update blog data
    const { data, error } = await supabase
      .from('blogs')
      .update({
        titulo: blogData.titulo,
        descripcion: blogData.descripcion,
        contenido: blogData.contenido,
        id_categoria: blogData.id_categoria
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Delete removed images if specified
    if (blogData.imagesToDelete && blogData.imagesToDelete.length > 0) {
      const imagePaths = blogData.imagesToDelete
        .map(url => getFilePathFromUrl(url, id))
        .filter((path): path is string => path !== null)
      
      if (imagePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('Blogs')
          .remove(imagePaths)
        
        if (deleteError) {
          console.error('Error deleting images:', deleteError)
          // Don't throw here to avoid blocking the update
        }
      }
    }

    // Upload new images if provided
    if (blogData.images && blogData.images.length > 0) {
      for (const image of blogData.images) {
        const fileName = `${Date.now()}_${image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const { error: uploadError } = await supabase.storage
          .from('Blogs')
          .upload(`uploads/${id}/${fileName}`, image)
        
        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          // Don't throw here to avoid blocking the update
        }
      }
    }

    return data
  }
)

export const deleteBlog = createAsyncThunk(
  'blog/deleteBlog',
  async (id: number) => {
    const supabase = createClient()
    
    // Delete blog images from storage
    const { data: files } = await supabase.storage
      .from('Blogs')
      .list(`uploads/${id}`)
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => `uploads/${id}/${file.name}`)
      await supabase.storage
        .from('Blogs')
        .remove(filePaths)
    }
    
    // Delete blog ratings
    await supabase
      .from('blogs_calificados')
      .delete()
      .eq('blog', id)
    
    // Delete blog
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id)

    if (error) throw error
    return id
  }
)

export const deleteBlogImage = createAsyncThunk(
  'blog/deleteBlogImage',
  async ({ blogId, imagePath }: { blogId: number; imagePath: string }) => {
    const supabase = createClient()
    
    const { error } = await supabase.storage
      .from('Blogs')
      .remove([imagePath])

    if (error) throw error
    return { blogId, imagePath }
  }
)

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentBlog: (state) => {
      state.currentBlog = null
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch blogs
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false
        state.blogs = action.payload.blogs
        state.pagination = {
          ...state.pagination,
          page: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalBlogs: action.payload.totalBlogs
        }
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar blogs'
      })
      // Fetch blog by ID
      .addCase(fetchBlogById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        state.loading = false
        state.currentBlog = action.payload
      })
      .addCase(fetchBlogById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar blog'
      })
      // Fetch categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })
      // Create blog
      .addCase(createBlog.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.loading = false
        state.blogs.unshift(action.payload as any)
        state.pagination.totalBlogs += 1
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al crear blog'
      })
      // Update blog
      .addCase(updateBlog.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.loading = false
        const index = state.blogs.findIndex(blog => blog.id === action.payload.id)
        if (index !== -1) {
          state.blogs[index] = { ...state.blogs[index], ...action.payload }
        }
        if (state.currentBlog?.id === action.payload.id) {
          state.currentBlog = { ...state.currentBlog, ...action.payload }
        }
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al actualizar blog'
      })
      // Delete blog
      .addCase(deleteBlog.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.loading = false
        state.blogs = state.blogs.filter(blog => blog.id !== action.payload)
        state.pagination.totalBlogs -= 1
        if (state.currentBlog?.id === action.payload) {
          state.currentBlog = null
        }
      })
      .addCase(deleteBlog.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al eliminar blog'
      })
  },
})

export const { clearError, clearCurrentBlog, setPagination } = blogSlice.actions
export default blogSlice.reducer
