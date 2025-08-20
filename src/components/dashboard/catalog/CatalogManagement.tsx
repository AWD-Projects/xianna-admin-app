'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCardSkeleton, CardSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { fetchOutfits, fetchStyles, fetchOccasions, deleteOutfit } from '@/store/slices/outfitSlice'
import { OutfitForm } from '@/components/dashboard/outfits/OutfitForm'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import type { AppDispatch, RootState } from '@/store'
import type { Outfit } from '@/types'
import { Plus, Download, Heart, Shirt, Search, X, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export function CatalogManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { outfits, loading, pagination, styles, occasions } = useSelector(
    (state: RootState) => state.outfit
  )

  const [search, setSearch] = useState('')
  const [styleFilter, setStyleFilter] = useState('')
  const [occasionFilter, setOccasionFilter] = useState('')
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null)
  const [deletingOutfit, setDeletingOutfit] = useState<Outfit | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    dispatch(fetchOutfits({ page: 1, pageSize: 12 }))
    dispatch(fetchStyles())
    dispatch(fetchOccasions())
  }, [dispatch])

  const handlePageChange = (newPage: number) => {
    dispatch(fetchOutfits({ 
      page: newPage, 
      pageSize: 12, 
      search, 
      styleFilter, 
      occasionFilter 
    }))
  }

  const handleSearch = () => {
    dispatch(fetchOutfits({ 
      page: 1, 
      pageSize: 12, 
      search, 
      styleFilter, 
      occasionFilter 
    }))
  }

  const handleFilterChange = (type: 'style' | 'occasion', value: string) => {
    if (type === 'style') {
      setStyleFilter(value)
    } else {
      setOccasionFilter(value)
    }
    
    dispatch(fetchOutfits({ 
      page: 1, 
      pageSize: 12, 
      search, 
      styleFilter: type === 'style' ? value : styleFilter, 
      occasionFilter: type === 'occasion' ? value : occasionFilter 
    }))
  }

  const clearFilters = () => {
    setSearch('')
    setStyleFilter('')
    setOccasionFilter('')
    dispatch(fetchOutfits({ page: 1, pageSize: 12 }))
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    setEditingOutfit(null)
    // Refresh the outfits list
    dispatch(fetchOutfits({ page: 1, pageSize: 12, search, styleFilter, occasionFilter }))
  }

  const handleEditOutfit = (outfit: Outfit) => {
    setEditingOutfit(outfit)
  }

  const handleDeleteClick = (outfit: Outfit) => {
    setDeletingOutfit(outfit)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingOutfit) return
    
    setIsDeleting(true)
    try {
      await dispatch(deleteOutfit(deletingOutfit.id)).unwrap()
      toast.success('Outfit eliminado exitosamente')
      setDeletingOutfit(null)
      // Refresh the outfits list
      dispatch(fetchOutfits({ page: 1, pageSize: 12, search, styleFilter, occasionFilter }))
    } catch (error) {
      toast.error('Error al eliminar el outfit')
      console.error('Error deleting outfit:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catálogo</h1>
            <p className="text-gray-600 mt-2">
              Gestiona los outfits y productos del catálogo
            </p>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Outfits Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  // Show create form if in create mode
  if (showCreateForm) {
    return (
      <OutfitForm
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }
  
  // Show edit form if editing
  if (editingOutfit) {
    return (
      <OutfitForm
        outfitId={editingOutfit.id}
        initialData={editingOutfit}
        onSuccess={handleCreateSuccess}
        onCancel={() => setEditingOutfit(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo</h1>
          <p className="text-gray-600 mt-2">
            Gestiona outfits, prendas y estilos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Outfit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Outfits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalOutfits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outfits.length}</div>
            <p className="text-sm text-muted-foreground">En esta página</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Favoritos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outfits.reduce((acc, outfit) => acc + outfit.favoritos, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Guardados por usuarios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promedio Favoritos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outfits.length > 0 
                ? Math.round(outfits.reduce((acc, outfit) => acc + outfit.favoritos, 0) / outfits.length)
                : 0
              }
            </div>
            <p className="text-sm text-muted-foreground">Por outfit</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar outfits por nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={handleSearch} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filtrar por estilo
            </label>
            <Select value={styleFilter || undefined} onValueChange={(value) => handleFilterChange('style', value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estilos" />
              </SelectTrigger>
              <SelectContent>
                {styles.map((style) => (
                  <SelectItem key={style.id} value={style.tipo}>
                    {style.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filtrar por ocasión
            </label>
            <Select value={occasionFilter || undefined} onValueChange={(value) => handleFilterChange('occasion', value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las ocasiones" />
              </SelectTrigger>
              <SelectContent>
                {occasions.map((occasion) => (
                  <SelectItem key={occasion.id} value={occasion.ocasion}>
                    {occasion.ocasion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(search || styleFilter || occasionFilter) && (
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Outfits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {outfits.map((outfit) => (
          <Card key={outfit.id} className="overflow-hidden flex flex-col">
            <div className="aspect-square bg-gray-200 relative">
              {outfit.imagen ? (
                <Image
                  src={outfit.imagen}
                  alt={outfit.nombre}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-400">
                    <Shirt className="h-12 w-12 mx-auto mb-2" />
                    <span className="text-sm">Sin imagen</span>
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">{outfit.estilo}</Badge>
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1">
                <Heart className="h-3 w-3 text-red-500" />
                <span className="text-xs font-medium">{outfit.favoritos}</span>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="line-clamp-1 text-lg">{outfit.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1">
              <div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {outfit.descripcion}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {outfit.ocasiones.slice(0, 2).map((ocasion, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {ocasion}
                    </Badge>
                  ))}
                  {outfit.ocasiones.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{outfit.ocasiones.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditOutfit(outfit)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleDeleteClick(outfit)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagination.page === 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Anterior
            </Button>
            <span className="px-4 py-2 text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingOutfit}
        onClose={() => setDeletingOutfit(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Outfit"
        message={`¿Estás seguro de que deseas eliminar el outfit "${deletingOutfit?.nombre}"? Esta acción no se puede deshacer y se eliminarán todas las imágenes y prendas asociadas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}
