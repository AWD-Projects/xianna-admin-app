'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createOutfit, updateOutfit, fetchStyles, fetchOccasions } from '@/store/slices/outfitSlice'
import { fetchAdvisors } from '@/store/slices/advisorSlice'
import { createClient } from '@/lib/supabase/client'
import type { AppDispatch, RootState } from '@/store'
import type { Outfit, OutfitFormData } from '@/types'
import { Plus, Trash2, Upload, X, Save, Camera } from 'lucide-react'
import { toast } from 'sonner'

const prendaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la prenda es requerido'),
  link: z.string().url('Debe ser una URL válida'),
  imagen: z.any().optional()
})

const outfitSchema = z.object({
  nombre: z.string().min(1, 'El nombre del outfit es requerido'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  id_estilo: z.number().min(1, 'Selecciona un estilo'),
  ocasiones: z.array(z.number()).min(1, 'Selecciona al menos una ocasión'),
  imagen: z.any().optional(),
  prendas: z.array(prendaSchema).min(1, 'Agrega al menos una prenda'),
  advisor_id: z.number().optional()
})

interface PrendaWithImage {
  nombre: string
  link: string
  imagen?: File
  imagenPreview?: string
  imagenExistente?: string // For existing images when editing
}

interface OutfitFormProps {
  outfitId?: number
  initialData?: Partial<Outfit>
  onSuccess?: () => void
  onCancel?: () => void
}

export function OutfitForm({ outfitId, initialData, onSuccess, onCancel }: OutfitFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { loading, styles, occasions } = useSelector((state: RootState) => state.outfit)
  const { advisors } = useSelector((state: RootState) => state.advisor)

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedOccasions, setSelectedOccasions] = useState<number[]>([])
  const [prendasWithImages, setPrendasWithImages] = useState<PrendaWithImage[]>([
    { nombre: '', link: '' }
  ])

  // Ref to track if component is mounted (prevents FileReader memory leak)
  const isMountedRef = useRef(true)

  const isEditing = !!outfitId

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
    watch
  } = useForm<OutfitFormData>({
    resolver: zodResolver(outfitSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      descripcion: initialData?.descripcion || '',
      id_estilo: initialData?.id_estilo || 0,
      ocasiones: [],
      prendas: [{ nombre: '', link: '' }],
      advisor_id: initialData?.advisor_id || undefined
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prendas'
  })

  // Watch prendas to sync with prendasWithImages
  const watchedPrendas = watch('prendas')

  useEffect(() => {
    dispatch(fetchStyles())
    dispatch(fetchOccasions())
    dispatch(fetchAdvisors({ page: 1, pageSize: 100, activeFilter: 'true' }))
  }, [dispatch])

  // Cleanup effect to prevent FileReader memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchPrendasForOutfit = useCallback(async (outfitId: number) => {
    try {
      const supabase = createClient()
      const { data: prendas, error } = await supabase
        .from('prendas')
        .select('id, nombre, link')
        .eq('id_outfit', outfitId)

      if (error) throw error

      if (prendas && prendas.length > 0) {
        // Get images for each prenda
        const prendasWithImageData = await Promise.all(
          prendas.map(async (prenda) => {
            let imagenExistente = undefined

            try {
              const { data: files } = await supabase.storage
                .from('Outfits')
                .list(`uploads/${outfitId}/prendas/${prenda.id}`)

              if (files && files.length > 0) {
                const { data: urlData } = supabase.storage
                  .from('Outfits')
                  .getPublicUrl(`uploads/${outfitId}/prendas/${prenda.id}/${files[0].name}`)
                imagenExistente = urlData.publicUrl
              }
            } catch (error) {
              console.warn(`Error loading image for prenda ${prenda.id}:`, error)
            }

            // Strip UTM tags from link for editing (they will be re-added on save)
            const linkWithoutUTM = prenda.link.replace(/[?&]utm_campaign=xianna_[^&]*/, '')

            return {
              nombre: prenda.nombre,
              link: linkWithoutUTM,
              imagenExistente,
              imagenPreview: imagenExistente
            }
          })
        )

        setValue('prendas', prendasWithImageData.map(p => ({
          nombre: p.nombre,
          link: p.link
        })))
        setPrendasWithImages(prendasWithImageData)
      } else {
        setValue('prendas', [{ nombre: '', link: '' }])
        setPrendasWithImages([{ nombre: '', link: '' }])
      }
    } catch (error) {
      console.error('Error fetching prendas:', error)
      setValue('prendas', [{ nombre: '', link: '' }])
      setPrendasWithImages([{ nombre: '', link: '' }])
    }
  }, [setValue])

  useEffect(() => {
    if (initialData && isEditing) {
      const occasionIds = initialData.ocasiones ? 
        occasions.filter(occ => initialData.ocasiones!.includes(occ.ocasion)).map(occ => occ.id) : []
      
      setSelectedOccasions(occasionIds)
      
      reset({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        id_estilo: initialData.id_estilo || 0,
        ocasiones: occasionIds,
        prendas: [],
        advisor_id: initialData.advisor_id || undefined
      })
      
      if (initialData.imagen) {
        setImagePreview(initialData.imagen)
      }
      
      if (outfitId) {
        fetchPrendasForOutfit(outfitId)
      }
    }
  }, [initialData, isEditing, occasions, outfitId, fetchPrendasForOutfit, reset])

  // Sync prendasWithImages when fields change
  useEffect(() => {
    if (watchedPrendas && watchedPrendas.length !== prendasWithImages.length) {
      const newPrendasWithImages = watchedPrendas.map((prenda, index) => ({
        ...(prendasWithImages[index] || { nombre: '', link: '' }),
        nombre: prenda.nombre || '',
        link: prenda.link || ''
      }))
      setPrendasWithImages(newPrendasWithImages)
    }
  }, [watchedPrendas, prendasWithImages])

  const handleImageChange = (file: File | null) => {
    if (file) {
      setImagePreview(null)
      setValue('imagen', file)

      const reader = new FileReader()

      reader.onloadend = () => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setImagePreview(reader.result as string)
        }
      }

      reader.onerror = () => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          console.error('Error reading file:', reader.error)
          setImagePreview(null)
        }
      }

      reader.readAsDataURL(file)
    } else {
      setValue('imagen', undefined)
      setImagePreview(null)
    }
  }

  const handlePrendaImageChange = (index: number, file: File | null) => {
    const newPrendasWithImages = [...prendasWithImages]
    
    if (file) {
      newPrendasWithImages[index] = {
        ...newPrendasWithImages[index],
        imagen: file,
        imagenPreview: URL.createObjectURL(file)
      }
    } else {
      newPrendasWithImages[index] = {
        ...newPrendasWithImages[index],
        imagen: undefined,
        imagenPreview: undefined
      }
    }
    
    setPrendasWithImages(newPrendasWithImages)
  }

  const handleReplaceImage = () => {
    setImagePreview(null)
    setValue('imagen', undefined)
    document.getElementById('main-image-upload')?.click()
  }

  const handleOccasionToggle = (occasionId: number) => {
    const newOccasions = selectedOccasions.includes(occasionId)
      ? selectedOccasions.filter(id => id !== occasionId)
      : [...selectedOccasions, occasionId]
    
    setSelectedOccasions(newOccasions)
    setValue('ocasiones', newOccasions)
  }

  const addPrenda = () => {
    append({ nombre: '', link: '' })
    setPrendasWithImages([...prendasWithImages, { nombre: '', link: '' }])
  }

  const removePrenda = (index: number) => {
    // Clean up preview URL if exists
    if (prendasWithImages[index]?.imagenPreview && 
        prendasWithImages[index].imagenPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(prendasWithImages[index].imagenPreview!)
    }
    
    remove(index)
    const newPrendasWithImages = prendasWithImages.filter((_, i) => i !== index)
    setPrendasWithImages(newPrendasWithImages)
  }

  // Helper function to sanitize advisor name for UTM parameter
  const sanitizeAdvisorNameForUTM = (name: string): string => {
    return name
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
  }

  // Helper function to generate full URL with UTM
  const generateURLWithUTM = (baseURL: string, advisorId?: number): string => {
    const selectedAdvisor = advisorId && advisorId > 0
      ? advisors.find(advisor => advisor.id === advisorId)
      : null

    if (!selectedAdvisor || !baseURL) return baseURL

    const advisorName = sanitizeAdvisorNameForUTM(selectedAdvisor.nombre)
    const utmTag = `utm_campaign=xianna_${advisorName}_${selectedAdvisor.id}`
    const separator = baseURL.includes('?') ? '&' : '?'

    return `${baseURL}${separator}${utmTag}`
  }

  const onSubmit = async (data: OutfitFormData) => {
    try {
      // Get selected advisor info for UTM tags
      const selectedAdvisor = data.advisor_id && data.advisor_id > 0
        ? advisors.find(advisor => advisor.id === data.advisor_id)
        : null

      // Add prenda images to form data and append UTM tags to links
      const formDataWithImages = {
        ...data,
        prendas: data.prendas.map((prenda, index) => {
          let prendaLink = prenda.link

          // Add UTM tag if advisor is selected
          if (selectedAdvisor) {
            const advisorName = sanitizeAdvisorNameForUTM(selectedAdvisor.nombre)
            const utmTag = `utm_campaign=xianna_${advisorName}_${selectedAdvisor.id}`

            // Check if URL already has query parameters
            const separator = prendaLink.includes('?') ? '&' : '?'
            prendaLink = `${prendaLink}${separator}${utmTag}`
          }

          return {
            ...prenda,
            link: prendaLink,
            imagen: prendasWithImages[index]?.imagen
          }
        })
      }

      if (isEditing && outfitId) {
        await dispatch(updateOutfit({ id: outfitId, outfitData: formDataWithImages })).unwrap()
        toast.success('Outfit actualizado exitosamente')
      } else {
        await dispatch(createOutfit(formDataWithImages)).unwrap()
        toast.success('Outfit creado exitosamente')
      }

      // Clean up preview URLs
      prendasWithImages.forEach(prenda => {
        if (prenda.imagenPreview && prenda.imagenPreview.startsWith('blob:')) {
          URL.revokeObjectURL(prenda.imagenPreview)
        }
      })

      onSuccess?.()
    } catch (error) {
      toast.error(isEditing ? 'Error al actualizar el outfit' : 'Error al crear el outfit')
      console.error('Error submitting outfit:', error)
    }
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      prendasWithImages.forEach(prenda => {
        if (prenda.imagenPreview && prenda.imagenPreview.startsWith('blob:')) {
          URL.revokeObjectURL(prenda.imagenPreview)
        }
      })
    }
  }, [prendasWithImages])

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Asesor@ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asesor@ (Opcional)
                </label>
                <select
                  {...register('advisor_id', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value={0}>Sin asesor@ asignad@</option>
                  {advisors.filter(advisor => advisor.activo).map((advisor) => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.nombre} - {advisor.especialidad}
                    </option>
                  ))}
                </select>
                {errors.advisor_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.advisor_id.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona un@ asesor@ para asociarlo con este outfit
                </p>
              </div>
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
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageChange(file)
                e.target.value = ''
              }}
              className="hidden"
              id="main-image-upload"
            />
            
            {!imagePreview ? (
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
                      PNG, JPG hasta 6MB
                    </p>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen del outfit seleccionada
                </label>
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <Image
                      src={imagePreview}
                      alt="Preview del outfit"
                      width={192}
                      height={192}
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
                onClick={addPrenda}
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
                      onClick={() => removePrenda(index)}
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

                    {/* Show full URL preview with UTM if advisor is selected */}
                    {(() => {
                      const advisorId = watch('advisor_id')
                      const prendaLink = watch(`prendas.${index}.link`)
                      const hasValidAdvisor = advisorId != null && advisorId > 0
                      const hasLink = prendaLink && prendaLink.trim() !== ''

                      if (!hasValidAdvisor || !hasLink) return null

                      return (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            URL completa que se guardará:
                          </p>
                          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 break-all">
                            <code className="text-xs text-blue-800">
                              {generateURLWithUTM(prendaLink, advisorId)}
                            </code>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            El tag UTM se agregará automáticamente al guardar
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Prenda Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen de la Prenda (Opcional)
                  </label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      handlePrendaImageChange(index, file || null)
                      e.target.value = ''
                    }}
                    className="hidden"
                    id={`prenda-image-upload-${index}`}
                  />
                  
                  {!prendasWithImages[index]?.imagenPreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <label htmlFor={`prenda-image-upload-${index}`} className="cursor-pointer">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Haz clic para agregar imagen
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG hasta 6MB
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <Image
                          src={prendasWithImages[index].imagenPreview!}
                          alt={`Preview prenda ${index + 1}`}
                          width={96}
                          height={96}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handlePrendaImageChange(index, null)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Eliminar imagen"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`prenda-image-upload-${index}`)?.click()}
                          className="flex items-center gap-1"
                        >
                          <Camera className="h-3 w-3" />
                          Cambiar
                        </Button>
                      </div>
                    </div>
                  )}
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
