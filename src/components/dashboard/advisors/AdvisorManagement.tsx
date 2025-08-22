'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { fetchAdvisors, deleteAdvisor, clearError } from '@/store/slices/advisorSlice'
import { AdvisorForm } from './AdvisorForm'
import type { AppDispatch, RootState } from '@/store'
import type { Advisor } from '@/types'
import { Search, Plus, Edit, Trash2, Filter, Eye, User, Mail, Globe, MapPin } from 'lucide-react'
import { toast } from 'sonner'

// Helper function to get gender-appropriate text
const getGenderText = (gender: string, maleText: string, femaleText: string, neutralText: string = maleText) => {
  switch (gender?.toUpperCase()) {
    case 'F': return femaleText
    case 'M': return maleText
    case 'O': return neutralText
    default: return neutralText
  }
}

export function AdvisorManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { advisors, loading, error, pagination } = useSelector((state: RootState) => state.advisor)
  
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null)
  const [deletingAdvisor, setDeletingAdvisor] = useState<Advisor | null>(null)
  const [viewingAdvisor, setViewingAdvisor] = useState<Advisor | null>(null)

  const fetchData = useCallback(() => {
    dispatch(fetchAdvisors({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search,
      activeFilter
    }))
  }, [dispatch, pagination.page, pagination.pageSize, search, activeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleSearch = (value: string) => {
    setSearch(value)
  }

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
  }

  const handleAddAdvisor = () => {
    setEditingAdvisor(null)
    setShowForm(true)
  }

  const handleEditAdvisor = (advisor: Advisor) => {
    setEditingAdvisor(advisor)
    setShowForm(true)
  }

  const handleViewAdvisor = (advisor: Advisor) => {
    setViewingAdvisor(advisor)
  }

  const handleDeleteAdvisor = async () => {
    if (!deletingAdvisor) return
    
    try {
      await dispatch(deleteAdvisor(deletingAdvisor.id)).unwrap()
      toast.success('Asesora eliminada exitosamente')
      setDeletingAdvisor(null)
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar la asesora')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingAdvisor(null)
    fetchData()
  }

  const handlePageChange = (page: number) => {
    dispatch(fetchAdvisors({
      page,
      pageSize: pagination.pageSize,
      search,
      activeFilter
    }))
  }

  if (showForm) {
    return (
      <AdvisorForm
        advisorId={editingAdvisor?.id}
        initialData={editingAdvisor || undefined}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingAdvisor(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Asesor@s</h1>
          <p className="text-gray-600 mt-2">
            Administra los asesor@s de moda de la plataforma
          </p>
        </div>
        <Button onClick={handleAddAdvisor} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuev@ Asesor@
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o especialidad..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={activeFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Todos los estados</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-full">
                <User className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Asesor@s</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalAdvisors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activ@s</p>
                <p className="text-2xl font-bold text-gray-900">
                  {advisors.filter(a => a.activo).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-full">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactiv@s</p>
                <p className="text-2xl font-bold text-gray-900">
                  {advisors.filter(a => !a.activo).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advisors List */}
      <Card>
        <CardHeader>
          <CardTitle>Asesor@s ({pagination.totalAdvisors})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
          ) : advisors.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron asesor@s</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advisors.map((advisor) => (
                <Card key={advisor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {advisor.nombre}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{advisor.especialidad}</p>
                        </div>
                        <Badge variant={advisor.activo ? "default" : "secondary"}>
                          {advisor.activo ? getGenderText(advisor.genero, "Activo", "Activa", "Activ@") : getGenderText(advisor.genero, "Inactivo", "Inactiva", "Inactiv@")}
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{advisor.correo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{advisor.estado}, {advisor.pais}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{advisor.anos_experiencia} años de experiencia</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAdvisor(advisor)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAdvisor(advisor)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingAdvisor(advisor)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Advisor Modal */}
      {viewingAdvisor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Información de {getGenderText(viewingAdvisor.genero, "Asesor", "Asesora", "Asesor@")}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingAdvisor(null)}
                >
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <p className="text-gray-900">{viewingAdvisor.nombre}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo
                  </label>
                  <p className="text-gray-900">{viewingAdvisor.correo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Género
                  </label>
                  <p className="text-gray-900">{viewingAdvisor.genero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad
                  </label>
                  <p className="text-gray-900">{viewingAdvisor.especialidad}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Años de Experiencia
                  </label>
                  <p className="text-gray-900">{viewingAdvisor.anos_experiencia}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <Badge variant={viewingAdvisor.activo ? "default" : "secondary"}>
                    {viewingAdvisor.activo ? getGenderText(viewingAdvisor.genero, "Activo", "Activa", "Activ@") : getGenderText(viewingAdvisor.genero, "Inactivo", "Inactiva", "Inactiv@")}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <p className="text-gray-900">{viewingAdvisor.pais}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado/Provincia
                  </label>
                  <p className="text-gray-900">{viewingAdvisor.estado}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingAdvisor.biografia}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link de Contacto
                </label>
                <a 
                  href={viewingAdvisor.contact_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 flex items-center gap-1"
                >
                  <Globe className="h-4 w-4" />
                  {viewingAdvisor.contact_link}
                </a>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Portfolio
                </label>
                <a 
                  href={viewingAdvisor.portfolio_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 flex items-center gap-1"
                >
                  <Globe className="h-4 w-4" />
                  {viewingAdvisor.portfolio_url}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingAdvisor}
        onClose={() => setDeletingAdvisor(null)}
        onConfirm={handleDeleteAdvisor}
        title={`Eliminar ${deletingAdvisor ? getGenderText(deletingAdvisor.genero, "Asesor", "Asesora", "Asesor@") : "Asesor@"}`}
        message={`¿Estás seguro de que quieres eliminar a ${deletingAdvisor?.nombre}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}