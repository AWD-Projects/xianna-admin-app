'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'
import { StatCardSkeleton, ChartSkeleton } from '@/components/ui/skeleton'
import { fetchAllAnalytics } from '@/store/slices/insightsSlice'
import type { AppDispatch, RootState } from '@/store'

export function InsightsDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    userAnalytics,
    blogAnalytics,
    outfitAnalytics,
    questionnaireAnalytics,
    loading,
    error 
  } = useSelector((state: RootState) => state.insights)

  useEffect(() => {
    dispatch(fetchAllAnalytics())
  }, [dispatch])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600 mt-2">
            Analíticas y métricas clave de tu plataforma
          </p>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error al cargar las analíticas: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-600 mt-2">
          Analíticas y métricas clave de tu plataforma
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userAnalytics?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{userAnalytics?.newUsersThisMonth || 0} este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogAnalytics?.totalBlogs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {blogAnalytics?.totalRatings || 0} calificaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Outfits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outfitAnalytics?.totalOutfits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {outfitAnalytics?.totalFavorites || 0} favoritos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questionnaireAnalytics?.totalQuestions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {questionnaireAnalytics?.totalAnswers || 0} respuestas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Categoría Más Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {blogAnalytics?.mostPopularCategory || 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground">
              En blogs y contenido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outfit Más Guardado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {outfitAnalytics?.mostSavedOutfit || 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground">
              Por los usuarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {blogAnalytics?.averageRating || 0}/5
            </div>
            <p className="text-sm text-muted-foreground">
              En todos los blogs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios por Estilo</CardTitle>
          </CardHeader>
          <CardContent>
            {userAnalytics?.usersByStyle && userAnalytics.usersByStyle.length > 0 ? (
              <Chart
                type="pie"
                data={userAnalytics.usersByStyle.slice(0, 5).map(item => ({
                  name: item.style,
                  value: item.count
                }))}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p className="text-sm">No hay datos de estilos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blogs por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {blogAnalytics?.blogsByCategory && blogAnalytics.blogsByCategory.length > 0 ? (
              <Chart
                type="column"
                data={blogAnalytics.blogsByCategory.slice(0, 5).map(item => ({
                  name: item.category,
                  value: item.count
                }))}
                categories={blogAnalytics.blogsByCategory.slice(0, 5).map(item => item.category)}
                yAxisTitle="Cantidad de Blogs"
                color="#3b82f6"
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p className="text-sm">No hay datos de blogs disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outfits por Estilo</CardTitle>
          </CardHeader>
          <CardContent>
            {outfitAnalytics?.outfitsByStyle && outfitAnalytics.outfitsByStyle.length > 0 ? (
              <Chart
                type="bar"
                data={outfitAnalytics.outfitsByStyle.slice(0, 5).map(item => ({
                  name: item.style,
                  value: item.count
                }))}
                categories={outfitAnalytics.outfitsByStyle.slice(0, 5).map(item => item.style)}
                yAxisTitle="Cantidad de Outfits"
                color="#eab308"
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p className="text-sm">No hay datos de outfits disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {userAnalytics?.usersByState && userAnalytics.usersByState.length > 0 ? (
              <Chart
                type="area"
                data={userAnalytics.usersByState.slice(0, 5).map(item => ({
                  name: item.state,
                  value: item.count
                }))}
                categories={userAnalytics.usersByState.slice(0, 5).map(item => item.state)}
                yAxisTitle="Cantidad de Usuarios"
                color="#22c55e"
                gradient={true}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <p className="text-sm">No hay datos de estados disponibles</p>
                  <p className="text-xs mt-1">Los usuarios necesitan completar su información de ubicación</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
