import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import type {
  UserAnalytics,
  BlogAnalytics,
  OutfitAnalytics,
  QuestionnaireAnalytics,
  DashboardInsights
} from '@/types'

async function buildUserAnalytics(): Promise<UserAnalytics> {
  const supabase = createClient()

  const { count: totalUsers } = await supabase
    .from('user_details')
    .select('*', { count: 'exact', head: true })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: allUsers } = await supabase
    .from('user_details')
    .select('*')
    .limit(1)

  let newUsersThisMonth = 0
  if (allUsers && allUsers.length > 0 && allUsers[0].created_at) {
    const { count } = await supabase
      .from('user_details')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())
    newUsersThisMonth = count || 0
  }

  const { data: usersWithStyles } = await supabase
    .from('user_details')
    .select(`
      *,
      estilos!left(tipo)
    `)

  const styleCounts: Record<string, number> = {}
  const stateCounts: Record<string, number> = {}
  const ageCounts: Record<string, number> = {}
  const bodyTypeCounts: Record<string, number> = {}

  usersWithStyles?.forEach((user) => {
    const style = user.estilos?.tipo || 'Sin estilo'
    styleCounts[style] = (styleCounts[style] || 0) + 1

    if (user.estado) {
      stateCounts[user.estado] = (stateCounts[user.estado] || 0) + 1
    }

    const age = user.edad
    let ageRange = 'Sin especificar'
    if (age >= 18 && age <= 25) ageRange = '18-25'
    else if (age >= 26 && age <= 35) ageRange = '26-35'
    else if (age >= 36 && age <= 50) ageRange = '36-50'
    else if (age > 50) ageRange = '50+'
    else if (age && age < 18) ageRange = 'Menor de 18'

    ageCounts[ageRange] = (ageCounts[ageRange] || 0) + 1

    if (user.tipo_cuerpo) {
      bodyTypeCounts[user.tipo_cuerpo] = (bodyTypeCounts[user.tipo_cuerpo] || 0) + 1
    }
  })

  const usersByStyle = Object.entries(styleCounts)
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count)

  const usersByState = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)

  const usersByAge = Object.entries(ageCounts)
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => b.count - a.count)

  const usersByBodyType = Object.entries(bodyTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalUsers: totalUsers || 0,
    newUsersThisMonth,
    usersByStyle,
    usersByState,
    usersByAge,
    usersByBodyType,
  }
}

async function buildBlogAnalytics(): Promise<BlogAnalytics> {
  const supabase = createClient()

  const { count: totalBlogs } = await supabase
    .from('blogs')
    .select('*', { count: 'exact', head: true })

  const { data: ratings, count: totalRatings } = await supabase
    .from('blogs_calificados')
    .select('calificacion, blog')

  const allRatings = ratings?.map((r) => r.calificacion) || []
  const averageRating =
    allRatings.length > 0
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
      : 0

  const { data: blogsWithCategories } = await supabase
    .from('blogs')
    .select(`
      id,
      titulo,
      categoria_blog!inner(categoria)
    `)

  const categoryCounts: Record<string, number> = {}
  const ratingCounts: Record<number, number> = {}

  ratings?.forEach((rating) => {
    ratingCounts[rating.calificacion] = (ratingCounts[rating.calificacion] || 0) + 1
  })

  const ratedBlogIds = ratings?.map((r) => r.blog) || []
  blogsWithCategories?.forEach((blog) => {
    if (ratedBlogIds.includes(blog.id)) {
      const category = (blog.categoria_blog as any)?.categoria || 'Sin categoría'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    }
  })

  const blogsByCategory = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const ratingDistribution = Object.entries(ratingCounts)
    .map(([rating, count]) => ({ rating: Number(rating), count }))
    .sort((a, b) => a.rating - b.rating)

  const blogRatingMap: Record<number, { sum: number; count: number }> = {}
  ratings?.forEach((rating) => {
    const blogId = rating.blog
    if (!blogId) return
    if (!blogRatingMap[blogId]) {
      blogRatingMap[blogId] = { sum: 0, count: 0 }
    }
    blogRatingMap[blogId].sum += rating.calificacion
    blogRatingMap[blogId].count += 1
  })

  const blogRatings = Object.entries(blogRatingMap)
    .map(([blogId, data]) => {
      const blog = blogsWithCategories?.find((b) => b.id.toString() === blogId)
      const blogTitle = blog?.titulo || `Blog ${blogId}`
      return {
        blog: blogTitle.length > 15 ? `${blogTitle.substring(0, 15)}...` : blogTitle,
        averageRating: Math.round((data.sum / data.count) * 10) / 10,
      }
    })
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 10)

  return {
    totalBlogs: totalBlogs || 0,
    totalRatings: totalRatings || 0,
    averageRating: Math.round(averageRating * 10) / 10,
    mostPopularCategory: blogsByCategory[0]?.category || 'N/A',
    blogsByCategory,
    ratingDistribution,
    blogRatings,
  }
}

async function buildOutfitAnalytics(): Promise<OutfitAnalytics> {
  const supabase = createClient()

  const { count: totalOutfits } = await supabase
    .from('outfits')
    .select('*', { count: 'exact', head: true })

  const { count: totalFavorites } = await supabase
    .from('favoritos')
    .select('*', { count: 'exact', head: true })

  const { data: outfitsData } = await supabase
    .from('outfits')
    .select(`
      *,
      estilos!inner(tipo)
    `)

  const { data: favorites } = await supabase
    .from('favoritos')
    .select(`
      outfit,
      outfits!inner(nombre)
    `)

  const outfitFavorites: Record<string, number> = {}
  favorites?.forEach((fav) => {
    const outfitName = (fav.outfits as any)?.nombre || 'Sin nombre'
    outfitFavorites[outfitName] = (outfitFavorites[outfitName] || 0) + 1
  })

  const mostSavedOutfit =
    Object.entries(outfitFavorites).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

  const styleCounts: Record<string, number> = {}
  outfitsData?.forEach((outfit) => {
    const style = outfit.estilos?.tipo || 'Sin estilo'
    styleCounts[style] = (styleCounts[style] || 0) + 1
  })

  const { data: outfitOccasions } = await supabase
    .from('outfit_ocasion')
    .select('id_ocasion')

  const { data: allOccasions } = await supabase
    .from('ocasion')
    .select('id, ocasion')

  const occasionMap: Record<number, string> = {}
  allOccasions?.forEach((occasion) => {
    occasionMap[occasion.id] = occasion.ocasion
  })

  const occasionCounts: Record<string, number> = {}
  outfitOccasions?.forEach((item) => {
    const occasionName = occasionMap[item.id_ocasion]
    if (occasionName) {
      occasionCounts[occasionName] = (occasionCounts[occasionName] || 0) + 1
    }
  })

  const outfitsByStyle = Object.entries(styleCounts)
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count)

  const outfitsByOccasion = Object.entries(occasionCounts)
    .map(([occasion, count]) => ({ occasion, count }))
    .sort((a, b) => b.count - a.count)

  const outfitFavoritesArray = Object.entries(outfitFavorites)
    .map(([outfit, favoritesCount]) => ({
      outfit: outfit.length > 15 ? `${outfit.substring(0, 15)}...` : outfit,
      favorites: favoritesCount,
    }))
    .sort((a, b) => b.favorites - a.favorites)
    .slice(0, 10)

  return {
    totalOutfits: totalOutfits || 0,
    totalFavorites: totalFavorites || 0,
    mostSavedOutfit,
    outfitsByStyle,
    outfitsByOccasion,
    outfitFavorites: outfitFavoritesArray,
  }
}

async function buildQuestionnaireAnalytics(): Promise<QuestionnaireAnalytics> {
  const supabase = createClient()

  const { count: totalQuestions } = await supabase
    .from('preguntas')
    .select('*', { count: 'exact', head: true })

  const { count: totalAnswers } = await supabase
    .from('respuestas')
    .select('*', { count: 'exact', head: true })

  const { data: answersData } = await supabase
    .from('respuestas')
    .select(`
      *,
      estilos!inner(tipo)
    `)

  const styleCounts: Record<string, number> = {}
  answersData?.forEach((answer) => {
    const style = answer.estilos?.tipo || 'Sin estilo'
    styleCounts[style] = (styleCounts[style] || 0) + 1
  })

  const answersByStyle = Object.entries(styleCounts)
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalQuestions: totalQuestions || 0,
    totalAnswers: totalAnswers || 0,
    answersByStyle,
  }
}

export async function GET() {
  try {
    const [userAnalytics, blogAnalytics, outfitAnalytics, questionnaireAnalytics] =
      await Promise.all([
        buildUserAnalytics(),
        buildBlogAnalytics(),
        buildOutfitAnalytics(),
        buildQuestionnaireAnalytics(),
      ])

    const insights: DashboardInsights = {
      users: userAnalytics,
      blogs: blogAnalytics,
      outfits: outfitAnalytics,
      questionnaire: questionnaireAnalytics,
    }

    return NextResponse.json({ success: true, data: insights })
  } catch (error) {
    console.error('Insights API error:', error)
    return NextResponse.json(
      { success: false, error: 'Error retrieving analytics data' },
      { status: 500 }
    )
  }
}
