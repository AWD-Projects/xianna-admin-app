'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { createBlog, updateBlog, fetchBlogCategories, fetchBlogById } from '@/store/slices/blogSlice'
import type { AppDispatch, RootState } from '@/store'
import type { BlogFormData, Blog } from '@/types'
import { 
  Upload, 
  X, 
  Save
} from 'lucide-react'
import { toast } from 'sonner'

// Form validation schema
const blogSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  descripcion: z.string().min(1, 'La descripción es requerida').max(500, 'La descripción es muy larga'),
  contenido: z.string().min(1, 'El contenido es requerido').refine(
    (content) => {
      // Remove HTML tags and check if there's actual text content
      const textContent = content.replace(/<[^>]*>/g, '').trim()
      return textContent.length > 0
    },
    { message: 'El contenido no puede estar vacío' }
  ),
  id_categoria: z.number().min(1, 'La categoría es requerida'),
})

type BlogFormValues = z.infer<typeof blogSchema>

interface BlogFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  blogId?: number // For editing existing blog
  initialData?: Partial<Blog> // For prefilling form data
}

export function BlogForm({ onSuccess, onCancel, blogId, initialData }: BlogFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { categories, loading, currentBlog } = useSelector((state: RootState) => state.blog)
  
  const isEditing = !!blogId
  
  
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      titulo: initialData?.titulo || '',
      descripcion: initialData?.descripcion || '',
      contenido: initialData?.contenido || '',
      id_categoria: initialData?.id_categoria || 0
    }
  })


  useEffect(() => {
    dispatch(fetchBlogCategories())
  }, [dispatch])
  
  // Initialize form with data when editing
  useEffect(() => {
    if (isEditing) {
      // Use initialData if provided, otherwise fetch blog data
      if (initialData) {
        reset({
          titulo: initialData.titulo || '',
          descripcion: initialData.descripcion || '',
          contenido: initialData.contenido || '',
          id_categoria: initialData.id_categoria || 0
        })
        
        // Set existing images if available
        if (initialData.images && initialData.images.length > 0) {
          setPreviewUrls(initialData.images)
        }
      } else if (blogId) {
        // Fetch blog data if not provided
        dispatch(fetchBlogById(blogId))
      }
    }
  }, [isEditing, initialData, blogId, dispatch])
  
  // Update form when blog data is loaded from API
  useEffect(() => {
    if (isEditing && currentBlog && currentBlog.id === blogId && !initialData) {
      reset({
        titulo: currentBlog.titulo || '',
        descripcion: currentBlog.descripcion || '',
        contenido: currentBlog.contenido || '',
        id_categoria: currentBlog.id_categoria || 0
      })
      
      // Set existing images if available
      if (currentBlog.images && currentBlog.images.length > 0) {
        setPreviewUrls(currentBlog.images)
      }
    }
  }, [currentBlog, isEditing, blogId, initialData])

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} es muy grande (máximo 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles])
      
      // Create preview URLs
      const newUrls = validFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls(prev => [...prev, ...newUrls])
    }
  }

  // Remove image
  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Handle form submission
  const onSubmit = async (data: BlogFormValues) => {
    try {
      const blogData: BlogFormData = {
        ...data,
        images: selectedImages
      }

      if (isEditing && blogId) {
        await dispatch(updateBlog({ id: blogId, blogData })).unwrap()
        toast.success('Blog actualizado exitosamente')
      } else {
        await dispatch(createBlog(blogData)).unwrap()
        toast.success('Blog creado exitosamente')
      }
      
      // Cleanup preview URLs (only for newly created URLs)
      previewUrls.forEach((url, index) => {
        if (selectedImages[index]) {
          URL.revokeObjectURL(url)
        }
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const action = isEditing ? 'actualizar' : 'crear'
      toast.error(`Error al ${action} el blog`)
      console.error(`Error ${action}ing blog:`, error)
    }
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Editar Blog' : 'Crear Nuevo Blog'}
          </h2>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del Blog *
              </label>
              <input
                {...register('titulo')}
                type="text"
                placeholder="Ingresa el título del blog..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              {errors.titulo && (
                <p className="text-red-500 text-sm mt-1">{errors.titulo.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                {...register('descripcion')}
                rows={3}
                placeholder="Descripción breve del blog..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
              {errors.descripcion && (
                <p className="text-red-500 text-sm mt-1">{errors.descripcion.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                {...register('id_categoria', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value={0}>Selecciona una categoría</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.categoria}
                  </option>
                ))}
              </select>
              {errors.id_categoria && (
                <p className="text-red-500 text-sm mt-1">{errors.id_categoria.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Contenido del Blog</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido *
              </label>
              <Controller
                name="contenido"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Escribe el contenido completo del blog aquí..."
                    error={errors.contenido?.message}
                    className="min-h-[400px]"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes del Blog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subir Imágenes
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Haz clic para subir imágenes o arrastra aquí
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG hasta 5MB cada una
                  </p>
                </label>
              </div>
            </div>

            {/* Image Previews */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      width={96}
                      height={96}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting 
              ? (isEditing ? 'Actualizando...' : 'Creando...') 
              : (isEditing ? 'Actualizar Blog' : 'Crear Blog')
            }
          </Button>
        </div>
      </form>
    </div>
  )
}