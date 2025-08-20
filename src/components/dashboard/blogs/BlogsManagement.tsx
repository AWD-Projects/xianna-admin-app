'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCardSkeleton, BlogCardSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { fetchBlogs, deleteBlog, fetchCategories } from '@/store/slices/blogSlice'
import type { AppDispatch, RootState } from '@/store'
import type { Blog } from '@/types'
import { Plus, Download, Star, Users, Edit, Trash2, Search, Filter, X } from 'lucide-react'
import { BlogForm } from './BlogForm'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { toast } from 'sonner'

export function BlogsManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { blogs, loading, error, pagination, categories } = useSelector(
    (state: RootState) => state.blog
  )
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [deletingBlog, setDeletingBlog] = useState<Blog | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    dispatch(fetchBlogs({ page: 1, pageSize: 10 }))
    dispatch(fetchCategories())
  }, [dispatch])

  const handlePageChange = (newPage: number) => {
    dispatch(fetchBlogs({ 
      page: newPage, 
      pageSize: 10, 
      search, 
      category: categoryFilter, 
      minRating 
    }))
  }

  const handleSearch = () => {
    dispatch(fetchBlogs({ 
      page: 1, 
      pageSize: 10, 
      search, 
      category: categoryFilter, 
      minRating 
    }))
  }

  const handleFilterChange = (type: 'category' | 'rating', value: string | number) => {
    if (type === 'category') {
      setCategoryFilter(value as string)
    } else {
      setMinRating(value as number)
    }
    
    dispatch(fetchBlogs({ 
      page: 1, 
      pageSize: 10, 
      search, 
      category: type === 'category' ? value as string : categoryFilter, 
      minRating: type === 'rating' ? value as number : minRating 
    }))
  }

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setMinRating(0)
    dispatch(fetchBlogs({ page: 1, pageSize: 10 }))
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    setEditingBlog(null)
    // Refresh the blogs list
    dispatch(fetchBlogs({ page: 1, pageSize: 10, search, category: categoryFilter, minRating }))
  }
  
  const handleEditBlog = (blog: Blog) => {
    setEditingBlog(blog)
  }
  
  const handleDeleteClick = (blog: Blog) => {
    setDeletingBlog(blog)
  }
  
  const handleDeleteConfirm = async () => {
    if (!deletingBlog) return
    
    setIsDeleting(true)
    try {
      await dispatch(deleteBlog(deletingBlog.id)).unwrap()
      toast.success('Blog eliminado exitosamente')
      setDeletingBlog(null)
      // Refresh the blogs list
      dispatch(fetchBlogs({ page: 1, pageSize: 10, search, category: categoryFilter, minRating }))
    } catch (error) {
      toast.error('Error al eliminar el blog')
      console.error('Error deleting blog:', error)
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
            <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
            <p className="text-gray-600 mt-2">
              Gestiona el contenido de blogs y artículos
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Blogs Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BlogCardSkeleton />
          <BlogCardSkeleton />
          <BlogCardSkeleton />
          <BlogCardSkeleton />
          <BlogCardSkeleton />
          <BlogCardSkeleton />
        </div>
      </div>
    )
  }

  // Show create form if in create mode
  if (showCreateForm) {
    return (
      <BlogForm
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }
  
  // Show edit form if editing
  if (editingBlog) {
    return (
      <BlogForm
        blogId={editingBlog.id}
        initialData={editingBlog}
        onSuccess={handleCreateSuccess}
        onCancel={() => setEditingBlog(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-600 mt-2">
            Gestiona el contenido de blogs y artículos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Blog
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Blogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalBlogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogs.length}</div>
            <p className="text-sm text-muted-foreground">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs.length > 0 
                ? (blogs.reduce((acc, blog) => acc + blog.rating, 0) / blogs.length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-sm text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Lectores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs.reduce((acc, blog) => acc + blog.persons, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Calificaciones</p>
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
                placeholder="Buscar blogs por título, descripción o contenido..."
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
              Filtrar por categoría
            </label>
            <Select value={categoryFilter || undefined} onValueChange={(value) => handleFilterChange('category', value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.categoria}>
                    {category.categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Rating mínimo
            </label>
            <Select value={minRating > 0 ? minRating.toString() : undefined} onValueChange={(value) => handleFilterChange('rating', parseFloat(value || '0'))}>
              <SelectTrigger>
                <SelectValue placeholder="Cualquier rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1+ estrellas</SelectItem>
                <SelectItem value="2">2+ estrellas</SelectItem>
                <SelectItem value="3">3+ estrellas</SelectItem>
                <SelectItem value="4">4+ estrellas</SelectItem>
                <SelectItem value="5">5 estrellas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(search || categoryFilter || minRating > 0) && (
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Card key={blog.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-200 relative">
              <img
                src={blog.image}
                alt={blog.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">{blog.categoria}</Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2">{blog.titulo}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {blog.descripcion}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{blog.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{blog.persons}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditBlog(blog)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteClick(blog)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </Button>
                </div>
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
        isOpen={!!deletingBlog}
        onClose={() => setDeletingBlog(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Blog"
        message={`¿Estás seguro de que deseas eliminar el blog "${deletingBlog?.titulo}"? Esta acción no se puede deshacer y se eliminarán todas las imágenes y calificaciones asociadas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}
