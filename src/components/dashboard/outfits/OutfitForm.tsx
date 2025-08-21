'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createOutfit, updateOutfit, fetchStyles, fetchOccasions } from '@/store/slices/outfitSlice'
import { createClient } from '@/lib/supabase/client'
import type { AppDispatch, RootState } from '@/store'
import type { Outfit, OutfitFormData } from '@/types'
import { Plus, Trash2, Upload, X, Save } from 'lucide-react'
import { toast } from 'sonner'

const prendaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la prenda es requerido'),
  link: z.string().url('Debe ser una URL válida')
})

const outfitSchema = z.object({
  nombre: z.string().min(1, 'El nombre del outfit es requerido'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  id_estilo: z.number().min(1, 'Selecciona un estilo'),
  ocasiones: z.array(z.number()).min(1, 'Selecciona al menos una ocasión'),
  imagen: z.any().optional(),
  prendas: z.array(prendaSchema).min(1, 'Agrega al menos una prenda')
})

interface OutfitFormProps {
  outfitId?: number
  initialData?: Partial<Outfit>
  onSuccess?: () => void
  onCancel?: () => void
}

export function OutfitForm({ outfitId, initialData, onSuccess, onCancel }: OutfitFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { loading, styles, occasions } = useSelector((state: RootState) => state.outfit)
  
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedOccasions, setSelectedOccasions] = useState<number[]>([])

  const isEditing = !!outfitId

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm<OutfitFormData>({
    resolver: zodResolver(outfitSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      descripcion: initialData?.descripcion || '',
      id_estilo: initialData?.id_estilo || 0,
      ocasiones: [],
      prendas: [{ nombre: '', link: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prendas'
  })

  useEffect(() => {
    dispatch(fetchStyles())
    dispatch(fetchOccasions())
  }, [dispatch])

  const fetchPrendasForOutfit = useCallback(async (outfitId: number) => {
    try {
      const supabase = createClient()
      const { data: prendas, error } = await supabase
        .from('prendas')
        .select('nombre, link')
        .eq('id_outfit', outfitId)
      
      if (error) throw error
      
      // Use setValue to directly set the prendas array instead of manipulating fields
      if (prendas && prendas.length > 0) {
        setValue('prendas', prendas.map(prenda => ({ 
          nombre: prenda.nombre, 
          link: prenda.link 
        })))
      } else {
        // Set default empty prenda if no prendas found
        setValue('prendas', [{ nombre: '', link: '' }])
      }
    } catch (error) {
      console.error('Error fetching prendas:', error)
      // Set default empty prenda on error
      setValue('prendas', [{ nombre: '', link: '' }])
    }
  }, [setValue])

  useEffect(() => {
    if (initialData && isEditing) {
      // Map occasions to IDs if available
      const occasionIds = initialData.ocasiones ? 
        occasions.filter(occ => initialData.ocasiones!.includes(occ.ocasion)).map(occ => occ.id) : []
      
      // Set selected occasions
      setSelectedOccasions(occasionIds)
      
      reset({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        id_estilo: initialData.id_estilo || 0,
        ocasiones: occasionIds,
        prendas: [] // Will be populated by fetchPrendasForOutfit
      })
      
      // Set image preview if exists
      if (initialData.imagen) {
        setImagePreview(initialData.imagen)
      }
      
      // Fetch prendas for this outfit
      if (outfitId) {
        fetchPrendasForOutfit(outfitId)
      }
    }
  }, [initialData, isEditing, occasions, outfitId, fetchPrendasForOutfit])

  const handleImageChange = (file: File | null) => {
    if (file) {
      // Clear existing image first
      setImagePreview(null)
      setValue('imagen', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setValue('imagen', undefined)
      setImagePreview(null)
    }
  }

  const handleReplaceImage = () => {
    // Clear current image to force new selection
    setImagePreview(null)
    setValue('imagen', undefined)
    // Trigger file input
    document.getElementById('main-image-upload')?.click()
  }


  const handleOccasionToggle = (occasionId: number) => {
    const newOccasions = selectedOccasions.includes(occasionId)
      ? selectedOccasions.filter(id => id !== occasionId)
      : [...selectedOccasions, occasionId]
    
    setSelectedOccasions(newOccasions)
    setValue('ocasiones', newOccasions)
  }

  const onSubmit = async (data: OutfitFormData) => {
    try {
      if (isEditing && outfitId) {
        await dispatch(updateOutfit({ id: outfitId, outfitData: data })).unwrap()
        toast.success('Outfit actualizado exitosamente')
      } else {
        await dispatch(createOutfit(data)).unwrap()
        toast.success('Outfit creado exitosamente')
      }
      onSuccess?.()
    } catch (error) {
      toast.error(isEditing ? 'Error al actualizar el outfit' : 'Error al crear el outfit')
      console.error('Error submitting outfit:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Outfit' : 'Crear Nuevo Outfit'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing ? 'Actualiza la información del outfit' : 'Completa la información para crear un nuevo outfit'}
          </p>
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
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Outfit *
              </label>
              <input
                {...register('nombre')}
                type="text"
                placeholder="Ej: Look casual de verano"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                {...register('descripcion')}
                rows={3}
                placeholder="Describe el outfit, su estilo y ocasiones de uso..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
              {errors.descripcion && (
                <p className="text-red-500 text-sm mt-1">{errors.descripcion.message}</p>
              )}
            </div>

            {/* Estilo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estilo *
              </label>
              <select
                {...register('id_estilo', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value={0}>Selecciona un estilo</option>
                {styles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.tipo}
                  </option>
                ))}
              </select>
              {errors.id_estilo && (
                <p className="text-red-500 text-sm mt-1">{errors.id_estilo.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Occasions */}
        <Card>
          <CardHeader>
            <CardTitle>Ocasiones *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Selecciona las ocasiones para las cuales es apropiado este outfit
              </p>
              <div className="flex flex-wrap gap-2">
                {occasions.map((occasion) => (
                  <Badge
                    key={occasion.id}
                    variant={selectedOccasions.includes(occasion.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleOccasionToggle(occasion.id)}
                  >
                    {occasion.ocasion}
                  </Badge>
                ))}
              </div>
              {errors.ocasiones && (
                <p className="text-red-500 text-sm">{errors.ocasiones.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Image */}
        <Card>
          <CardHeader>
            <CardTitle>Imagen Principal del Outfit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden file input that persists regardless of preview state */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageChange(file)
                // Clear the input so same file can be selected again
                e.target.value = ''
              }}
              className="hidden"
              id="main-image-upload"
            />
            
            {!imagePreview ? (
              /* Image Upload */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir una imagen para el outfit
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <label htmlFor="main-image-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Solo se permite una imagen
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Haz clic para seleccionar la imagen principal del outfit
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG hasta 5MB
                    </p>
                  </label>
                </div>
              </div>
            ) : (
              /* Image Preview with Replace Option */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen del outfit seleccionada
                </label>
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview del outfit"
                      className="w-48 h-48 object-cover rounded-lg border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageChange(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Eliminar imagen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReplaceImage}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Cambiar imagen
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleImageChange(null)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Solo puedes tener una imagen por outfit. Para cambiarla, usa el botón &quot;Cambiar imagen&quot;.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Prendas del Outfit *
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ nombre: '', link: '' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Prenda
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Prenda {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Prenda *
                    </label>
                    <input
                      {...register(`prendas.${index}.nombre`)}
                      type="text"
                      placeholder="Ej: Blusa blanca de algodón"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    {errors.prendas?.[index]?.nombre && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.prendas[index]?.nombre?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link de Compra *
                    </label>
                    <input
                      {...register(`prendas.${index}.link`)}
                      type="url"
                      placeholder="https://tienda.com/prenda"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    {errors.prendas?.[index]?.link && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.prendas[index]?.link?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {errors.prendas && typeof errors.prendas === 'object' && 'message' in errors.prendas && (
              <p className="text-red-500 text-sm">{errors.prendas.message}</p>
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
              : (isEditing ? 'Actualizar Outfit' : 'Crear Outfit')
            }
          </Button>
        </div>
      </form>
    </div>
  )
}