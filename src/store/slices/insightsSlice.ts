import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { 
  UserAnalytics, 
  BlogAnalytics, 
  OutfitAnalytics, 
  QuestionnaireAnalytics,
  DashboardInsights 
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

// Async thunks
export const fetchUserAnalytics = createAsyncThunk(
  'insights/fetchUserAnalytics',
  async () => {
    const supabase = createClient()
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('user_details')
      .select('*', { count: 'exact', head: true })

    // Get users from this month - check if created_at column exists
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // First try to get all users to check what columns exist, then apply date filter if available
    const { data: allUsers } = await supabase
      .from('user_details')
      .select('*')
      .limit(1)

    let newUsersThisMonth = 0
    if (allUsers && allUsers.length > 0 && allUsers[0].created_at) {
      // If created_at exists, use date filtering
      const { count } = await supabase
        .from('user_details')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
      newUsersThisMonth = count || 0
    } else {
      // If no created_at column, just return 0 for new users this month
      console.warn('user_details table does not have created_at column')
      newUsersThisMonth = 0
    }

    // Get users with their styles
    const { data: usersWithStyles } = await supabase
      .from('user_details')
      .select(`
        *,
        estilos!left(tipo)
      `)

    // Process analytics
    const usersByStyle: { style: string; count: number }[] = []
    const usersByState: { state: string; count: number }[] = []
    const usersByAge: { range: string; count: number }[] = []
    const usersByBodyType: { type: string; count: number }[] = []

    // Count by style
    const styleCounts: { [key: string]: number } = {}
    const stateCounts: { [key: string]: number } = {}
    const ageCounts: { [key: string]: number } = {}
    const bodyTypeCounts: { [key: string]: number } = {}

    usersWithStyles?.forEach(user => {
      // Style
      const style = user.estilos?.tipo || 'Sin estilo'
      styleCounts[style] = (styleCounts[style] || 0) + 1

      // State
      if (user.estado) {
        stateCounts[user.estado] = (stateCounts[user.estado] || 0) + 1
      }

      // Age range
      const age = user.edad
      let ageRange = 'Sin especificar'
      if (age >= 18 && age <= 25) ageRange = '18-25'
      else if (age >= 26 && age <= 35) ageRange = '26-35'
      else if (age >= 36 && age <= 50) ageRange = '36-50'
      else if (age > 50) ageRange = '50+'
      else if (age < 18) ageRange = 'Menor de 18'

      ageCounts[ageRange] = (ageCounts[ageRange] || 0) + 1

      // Body type
      if (user.tipo_cuerpo) {
        bodyTypeCounts[user.tipo_cuerpo] = (bodyTypeCounts[user.tipo_cuerpo] || 0) + 1
      }
    })

    // Convert to arrays
    Object.entries(styleCounts).forEach(([style, count]) => {
      usersByStyle.push({ style, count })
    })

    Object.entries(stateCounts).forEach(([state, count]) => {
      usersByState.push({ state, count })
    })

    Object.entries(ageCounts).forEach(([range, count]) => {
      usersByAge.push({ range, count })
    })

    Object.entries(bodyTypeCounts).forEach(([type, count]) => {
      usersByBodyType.push({ type, count })
    })

    return {
      totalUsers: totalUsers || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      usersByStyle: usersByStyle.sort((a, b) => b.count - a.count),
      usersByState: usersByState.sort((a, b) => b.count - a.count),
      usersByAge: usersByAge.sort((a, b) => b.count - a.count),
      usersByBodyType: usersByBodyType.sort((a, b) => b.count - a.count)
    }
  }
)

export const fetchBlogAnalytics = createAsyncThunk(
  'insights/fetchBlogAnalytics',
  async () => {
    const supabase = createClient()
    
    // Get total blogs
    const { count: totalBlogs } = await supabase
      .from('blogs')
      .select('*', { count: 'exact', head: true })

    // Get all blog ratings
    const { data: ratings, count: totalRatings } = await supabase
      .from('blogs_calificados')
      .select('calificacion, blogs!inner(id_categoria, categoria_blog!inner(categoria))')

    // Calculate average rating
    const allRatings = ratings?.map(r => r.calificacion) || []
    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
      : 0

    // Count by category
    const categoryCounts: { [key: string]: number } = {}
    const ratingCounts: { [key: number]: number } = {}

    ratings?.forEach(rating => {
      const category = (rating.blogs as any)?.categoria_blog?.categoria || 'Sin categoría'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
      
      const ratingValue = rating.calificacion
      ratingCounts[ratingValue] = (ratingCounts[ratingValue] || 0) + 1
    })

    const blogsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => b.count - a.count)

    const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
      rating: Number(rating),
      count
    })).sort((a, b) => a.rating - b.rating)

    const mostPopularCategory = blogsByCategory[0]?.category || 'N/A'

    return {
      totalBlogs: totalBlogs || 0,
      totalRatings: totalRatings || 0,
      averageRating: Math.round(averageRating * 10) / 10,
      mostPopularCategory,
      blogsByCategory,
      ratingDistribution
    }
  }
)

export const fetchOutfitAnalytics = createAsyncThunk(
  'insights/fetchOutfitAnalytics',
  async () => {
    const supabase = createClient()
    
    // Get total outfits
    const { count: totalOutfits } = await supabase
      .from('outfits')
      .select('*', { count: 'exact', head: true })

    // Get total favorites
    const { count: totalFavorites } = await supabase
      .from('favoritos')
      .select('*', { count: 'exact', head: true })

    // Get outfits with their details
    const { data: outfitsData } = await supabase
      .from('outfits')
      .select(`
        *,
        estilos!inner(tipo)
      `)

    // Find most saved outfit
    const { data: favorites } = await supabase
      .from('favoritos')
      .select(`
        outfit,
        outfits!inner(nombre)
      `)

    const outfitFavorites: { [key: string]: number } = {}
    favorites?.forEach(fav => {
      const outfitName = (fav.outfits as any)?.nombre || 'Sin nombre'
      outfitFavorites[outfitName] = (outfitFavorites[outfitName] || 0) + 1
    })

    const mostSavedOutfit = Object.entries(outfitFavorites)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    // Count by style
    const styleCounts: { [key: string]: number } = {}
    outfitsData?.forEach(outfit => {
      const style = outfit.estilos.tipo
      styleCounts[style] = (styleCounts[style] || 0) + 1
    })

    // Get occasions data - use a safer approach without assuming relationship name
    const { data: outfitOcasions } = await supabase
      .from('outfit_ocasion')
      .select('id_ocasion')

    // Get all occasions separately - use correct table name 'ocasion'
    const { data: allOcasiones } = await supabase
      .from('ocasion')
      .select('id, ocasion')

    // Create a map of ocasion id to name
    const ocasionMap: { [key: number]: string } = {}
    allOcasiones?.forEach(ocasion => {
      ocasionMap[ocasion.id] = ocasion.ocasion
    })

    const occasionCounts: { [key: string]: number } = {}
    outfitOcasions?.forEach(item => {
      const ocasionName = ocasionMap[item.id_ocasion]
      if (ocasionName) {
        occasionCounts[ocasionName] = (occasionCounts[ocasionName] || 0) + 1
      }
    })

    const outfitsByStyle = Object.entries(styleCounts).map(([style, count]) => ({
      style,
      count
    })).sort((a, b) => b.count - a.count)

    const outfitsByOccasion = Object.entries(occasionCounts).map(([occasion, count]) => ({
      occasion,
      count
    })).sort((a, b) => b.count - a.count)

    return {
      totalOutfits: totalOutfits || 0,
      totalFavorites: totalFavorites || 0,
      mostSavedOutfit,
      outfitsByStyle,
      outfitsByOccasion
    }
  }
)

export const fetchQuestionnaireAnalytics = createAsyncThunk(
  'insights/fetchQuestionnaireAnalytics',
  async () => {
    const supabase = createClient()
    
    // Get total questions
    const { count: totalQuestions } = await supabase
      .from('preguntas')
      .select('*', { count: 'exact', head: true })

    // Get total answers
    const { count: totalAnswers } = await supabase
      .from('respuestas')
      .select('*', { count: 'exact', head: true })

    // Get answers by style
    const { data: answersData } = await supabase
      .from('respuestas')
      .select(`
        *,
        estilos!inner(tipo)
      `)

    const styleCounts: { [key: string]: number } = {}
    answersData?.forEach(answer => {
      const style = answer.estilos.tipo
      styleCounts[style] = (styleCounts[style] || 0) + 1
    })

    const answersByStyle = Object.entries(styleCounts).map(([style, count]) => ({
      style,
      count
    })).sort((a, b) => b.count - a.count)

    return {
      totalQuestions: totalQuestions || 0,
      totalAnswers: totalAnswers || 0,
      answersByStyle
    }
  }
)

export const fetchAllAnalytics = createAsyncThunk(
  'insights/fetchAllAnalytics',
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchUserAnalytics()),
      dispatch(fetchBlogAnalytics()),
      dispatch(fetchOutfitAnalytics()),
      dispatch(fetchQuestionnaireAnalytics())
    ])
  }
)

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
      // Fetch all analytics
      .addCase(fetchAllAnalytics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllAnalytics.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(fetchAllAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar analíticas'
      })
      // User analytics
      .addCase(fetchUserAnalytics.fulfilled, (state, action) => {
        state.userAnalytics = action.payload
      })
      .addCase(fetchUserAnalytics.rejected, (state, action) => {
        state.error = action.error.message || 'Error al cargar analíticas de usuarios'
      })
      // Blog analytics
      .addCase(fetchBlogAnalytics.fulfilled, (state, action) => {
        state.blogAnalytics = action.payload
      })
      .addCase(fetchBlogAnalytics.rejected, (state, action) => {
        state.error = action.error.message || 'Error al cargar analíticas de blogs'
      })
      // Outfit analytics
      .addCase(fetchOutfitAnalytics.fulfilled, (state, action) => {
        state.outfitAnalytics = action.payload
      })
      .addCase(fetchOutfitAnalytics.rejected, (state, action) => {
        state.error = action.error.message || 'Error al cargar analíticas de outfits'
      })
      // Questionnaire analytics
      .addCase(fetchQuestionnaireAnalytics.fulfilled, (state, action) => {
        state.questionnaireAnalytics = action.payload
      })
      .addCase(fetchQuestionnaireAnalytics.rejected, (state, action) => {
        state.error = action.error.message || 'Error al cargar analíticas del cuestionario'
      })
  },
})

export const { clearError } = insightsSlice.actions
export default insightsSlice.reducer
