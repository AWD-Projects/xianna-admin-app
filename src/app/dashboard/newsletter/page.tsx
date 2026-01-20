'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { fetchCampaigns, setSelectedCampaign } from '@/store/slices/newsletterSlice'
import type { AppDispatch, RootState } from '@/store'
import type { NewsletterCampaign } from '@/types'
import { Plus, Mail, Users, Calendar, AlertTriangle, CheckCircle, Filter, Clock, Send, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NewsletterPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { campaigns, loading, error } = useSelector((state: RootState) => state.newsletter)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    dispatch(fetchCampaigns())
  }, [dispatch])

  const getStyleName = (tipoEstilo: string | number) => {
    const styleMap: { [key: string]: string } = {
      '1': 'Casual', '2': 'Elegante', '3': 'Deportivo', '4': 'Boho', 
      '5': 'Minimalista', '6': 'Rockero', '7': 'Vintage'
    }
    return styleMap[tipoEstilo.toString()] || `Estilo ${tipoEstilo}`
  }

  const parseFilters = (filtersString: string) => {
    try {
      return JSON.parse(filtersString)
    } catch {
      return {}
    }
  }

  const getFiltersSummary = (filtersString: string) => {
    const filters = parseFilters(filtersString)
    const filterItems = []

    if (filters.estado) filterItems.push(`Estado: ${filters.estado}`)
    if (filters.genero) filterItems.push(`Género: ${filters.genero}`)
    if (filters.edad_min) filterItems.push(`Edad min: ${filters.edad_min}`)
    if (filters.edad_max) filterItems.push(`Edad max: ${filters.edad_max}`)
    if (filters.tipo_estilo) filterItems.push(`Estilo: ${getStyleName(filters.tipo_estilo)}`)
    if (filters.ocupacion) filterItems.push(`Ocupación: ${filters.ocupacion}`)

    return filterItems.length > 0 ? filterItems : []
  }

  // Filter campaigns by date
  const filteredCampaigns = campaigns.filter((campaign) => {
    const campaignDate = new Date(campaign.created_at)

    // Get date components to avoid timezone issues
    const campaignYear = campaignDate.getFullYear()
    const campaignMonth = campaignDate.getMonth()
    const campaignDay = campaignDate.getDate()

    // Create a date object with just the date components (no time)
    const campaignDateOnly = new Date(campaignYear, campaignMonth, campaignDay)

    if (startDate && endDate) {
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number)

      const startDateOnly = new Date(startYear, startMonth - 1, startDay)
      const endDateOnly = new Date(endYear, endMonth - 1, endDay)

      return campaignDateOnly >= startDateOnly && campaignDateOnly <= endDateOnly
    } else if (startDate) {
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
      const startDateOnly = new Date(startYear, startMonth - 1, startDay)

      return campaignDateOnly >= startDateOnly
    } else if (endDate) {
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
      const endDateOnly = new Date(endYear, endMonth - 1, endDay)

      return campaignDateOnly <= endDateOnly
    }

    return true
  })

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
  }

  const hasActiveFilters = startDate || endDate

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [startDate, endDate])

  // Pagination logic
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Calculate email metrics
  const totalEmailsSent = campaigns.reduce((total, campaign) => total + campaign.numero_usuarios_enviados, 0)
  const emailLimit = 1000
  const emailUsagePercentage = (totalEmailsSent / emailLimit) * 100
  const isNearLimit = emailUsagePercentage >= 80 // Warning at 80%
  const isAtLimit = emailUsagePercentage >= 95 // Critical at 95%

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-gray-600 mt-2">Gestiona tus campañas de newsletter</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-gray-600 mt-2">
            Gestiona y envía campañas de newsletter a tus usuarios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/newsletter/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Campaña
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Email Usage KPI Card */}
        <Card className={`${isAtLimit ? 'border-red-500 bg-red-50' : isNearLimit ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${isAtLimit ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-green-700'}`}>
              Emails Enviados
            </CardTitle>
            {isAtLimit ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : isNearLimit ? (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isAtLimit ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-green-700'}`}>
              {totalEmailsSent.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className={`text-xs ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'}`}>
                de {emailLimit.toLocaleString()} emails
              </div>
              <div className={`text-xs font-medium ${isAtLimit ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-green-700'}`}>
                {emailUsagePercentage.toFixed(1)}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(emailUsagePercentage, 100)}%` }}
              />
            </div>
            {isAtLimit && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                ⚠️ Límite casi alcanzado
              </div>
            )}
            {isNearLimit && !isAtLimit && (
              <div className="mt-2 text-xs text-yellow-600 font-medium">
                ⚠️ Acercándose al límite
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campañas</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Alcanzados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEmailsSent}
            </div>
            <p className="text-xs text-muted-foreground">
              Emails únicos enviados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Envío</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {campaigns.length > 0 
                ? format(new Date(campaigns[0].created_at), 'dd MMM yyyy', { locale: es })
                : 'Ninguno'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar por Fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha desde
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha hasta
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-600">
              Mostrando {filteredCampaigns.length} de {campaigns.length} campañas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 && campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay campañas creadas
              </h3>
              <p className="text-gray-500 mb-4">
                Comienza creando tu primera campaña de newsletter
              </p>
              <Link href="/dashboard/newsletter/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Campaña
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron campañas
              </h3>
              <p className="text-gray-500 mb-4">
                No hay campañas que coincidan con los filtros aplicados
              </p>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Campañas Recientes ({filteredCampaigns.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedCampaigns.map((campaign) => {
              const filters = getFiltersSummary(campaign.filtros_aplicados)
              const templateName = campaign.template_usado === '1' ? 'Promoción de Estilo' : 'Consejos de Outfit'
              
              return (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{campaign.nombre}</CardTitle>
                        <p className="text-sm text-gray-600 font-medium">{campaign.asunto}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {templateName}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Campaign Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Enviados</p>
                          <p className="font-semibold">{campaign.numero_usuarios_enviados.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Fecha</p>
                          <p className="font-semibold">
                            {format(new Date(campaign.created_at), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Applied Filters */}
                    {filters.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Filter className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Filtros aplicados</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {filters.map((filter, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {filter}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {filters.length === 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Sin filtros aplicados</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Campaign Time */}
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        Enviado el {format(new Date(campaign.created_at), 'dd MMMM yyyy', { locale: es })} a las{' '}
                        {format(new Date(campaign.created_at), 'HH:mm', { locale: es })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)

                  if (!showPage) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Page info */}
          {totalPages > 1 && (
            <div className="text-center text-sm text-gray-600 mt-4">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCampaigns.length)} de {filteredCampaigns.length} campañas
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}