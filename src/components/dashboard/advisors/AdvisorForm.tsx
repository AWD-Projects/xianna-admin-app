'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createAdvisor, updateAdvisor } from '@/store/slices/advisorSlice'
import type { AppDispatch, RootState } from '@/store'
import type { Advisor, AdvisorFormData } from '@/types'
import { Save } from 'lucide-react'
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

const advisorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  correo: z.string().email('Debe ser un email válido'),
  genero: z.string().min(1, 'El género es requerido'),
  especialidad: z.string().min(1, 'La especialidad es requerida'),
  anos_experiencia: z.number().min(0, 'Los años de experiencia deben ser mayor o igual a 0'),
  biografia: z.string().min(10, 'La biografía debe tener al menos 10 caracteres'),
  contact_link: z.string().url('Debe ser una URL válida'),
  portfolio_url: z.string().url('Debe ser una URL válida'),
  pais: z.string().min(1, 'El país es requerido'),
  estado: z.string().min(1, 'El estado es requerido'),
  activo: z.boolean()
})

interface AdvisorFormProps {
  advisorId?: number
  initialData?: Partial<Advisor>
  onSuccess?: () => void
  onCancel?: () => void
}

export function AdvisorForm({ advisorId, initialData, onSuccess, onCancel }: AdvisorFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { loading } = useSelector((state: RootState) => state.advisor)
  
  const isEditing = !!advisorId

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<AdvisorFormData>({
    resolver: zodResolver(advisorSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      correo: initialData?.correo || '',
      genero: initialData?.genero || '',
      especialidad: initialData?.especialidad || '',
      anos_experiencia: initialData?.anos_experiencia || 0,
      biografia: initialData?.biografia || '',
      contact_link: initialData?.contact_link || '',
      portfolio_url: initialData?.portfolio_url || '',
      pais: initialData?.pais || '',
      estado: initialData?.estado || '',
      activo: initialData?.activo ?? true
    }
  })

  // Watch the gender field to update labels dynamically
  const watchedGender = watch('genero')
  const selectedGender = watchedGender || initialData?.genero || ''

  useEffect(() => {
    if (initialData && isEditing) {
      reset({
        nombre: initialData.nombre || '',
        correo: initialData.correo || '',
        genero: initialData.genero || '',
        especialidad: initialData.especialidad || '',
        anos_experiencia: initialData.anos_experiencia || 0,
        biografia: initialData.biografia || '',
        contact_link: initialData.contact_link || '',
        portfolio_url: initialData.portfolio_url || '',
        pais: initialData.pais || '',
        estado: initialData.estado || '',
        activo: initialData.activo ?? true
      })
    }
  }, [initialData, isEditing, reset])

  const onSubmit = async (data: AdvisorFormData) => {
    try {
      if (isEditing && advisorId) {
        await dispatch(updateAdvisor({ id: advisorId, advisorData: data })).unwrap()
        toast.success(`${getGenderText(selectedGender, "Asesor", "Asesora", "Asesor@")} actualizad@ exitosamente`)
      } else {
        await dispatch(createAdvisor(data)).unwrap()
        toast.success(`${getGenderText(selectedGender, "Asesor", "Asesora", "Asesor@")} cread@ exitosamente`)
      }
      onSuccess?.()
    } catch (error) {
      toast.error(isEditing ? `Error al actualizar ${getGenderText(selectedGender, "el asesor", "la asesora", "el/la asesor@")}` : `Error al crear ${getGenderText(selectedGender, "el asesor", "la asesora", "el/la asesor@")}`)
      console.error('Error submitting advisor:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing 
              ? `Editar ${getGenderText(selectedGender, "Asesor", "Asesora", "Asesor@")}`
              : `Nuev@ ${getGenderText(selectedGender, "Asesor", "Asesora", "Asesor@")}`
            }
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing 
              ? `Actualiza la información ${getGenderText(selectedGender, "del asesor", "de la asesora", "de la persona")}`
              : `Completa la información para crear ${getGenderText(selectedGender, "un nuevo asesor", "una nueva asesora", "un@ nuev@ asesor@")}`
            }
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
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  {...register('nombre')}
                  type="text"
                  placeholder="Ej: María García"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
                )}
              </div>

              {/* Correo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  {...register('correo')}
                  type="email"
                  placeholder="maria@ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                {errors.correo && (
                  <p className="text-red-500 text-sm mt-1">{errors.correo.message}</p>
                )}
              </div>

              {/* Género */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género *
                </label>
                <select
                  {...register('genero')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Selecciona un género</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                  <option value="O">Otro</option>
                </select>
                {errors.genero && (
                  <p className="text-red-500 text-sm mt-1">{errors.genero.message}</p>
                )}
              </div>

              {/* Años de experiencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Años de Experiencia *
                </label>
                <input
                  {...register('anos_experiencia', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                {errors.anos_experiencia && (
                  <p className="text-red-500 text-sm mt-1">{errors.anos_experiencia.message}</p>
                )}
              </div>
            </div>

            {/* Especialidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidad *
              </label>
              <input
                {...register('especialidad')}
                type="text"
                placeholder="Ej: Moda casual, Moda formal, Moda urbana..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              {errors.especialidad && (
                <p className="text-red-500 text-sm mt-1">{errors.especialidad.message}</p>
              )}
            </div>

            {/* Biografía */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biografía *
              </label>
              <textarea
                {...register('biografia')}
                rows={4}
                placeholder={`Describe la experiencia, formación y especialidades ${getGenderText(selectedGender, "del asesor", "de la asesora", "de la persona")}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
              {errors.biografia && (
                <p className="text-red-500 text-sm mt-1">{errors.biografia.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* País */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País *
                </label>
                <input
                  {...register('pais')}
                  type="text"
                  placeholder="Ej: México"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                {errors.pais && (
                  <p className="text-red-500 text-sm mt-1">{errors.pais.message}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado/Provincia *
                </label>
                <input
                  {...register('estado')}
                  type="text"
                  placeholder="Ej: Ciudad de México"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                {errors.estado && (
                  <p className="text-red-500 text-sm mt-1">{errors.estado.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contact Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link de Contacto *
              </label>
              <input
                {...register('contact_link')}
                type="url"
                placeholder="https://wa.me/5555555555"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              {errors.contact_link && (
                <p className="text-red-500 text-sm mt-1">{errors.contact_link.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Link directo para contactar {getGenderText(selectedGender, "al asesor", "a la asesora", "a la persona")} (WhatsApp, Instagram, etc.)
              </p>
            </div>

            {/* Portfolio URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Portfolio *
              </label>
              <input
                {...register('portfolio_url')}
                type="url"
                placeholder="https://portfolio.ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              {errors.portfolio_url && (
                <p className="text-red-500 text-sm mt-1">{errors.portfolio_url.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Link al portfolio o sitio web profesional {getGenderText(selectedGender, "del asesor", "de la asesora", "de la persona")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                {...register('activo')}
                type="checkbox"
                id="activo"
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                {getGenderText(selectedGender, "Asesor activo", "Asesora activa", "Asesor@ activ@")}
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getGenderText(selectedGender, "Los asesores inactivos", "Las asesoras inactivas", "Los asesor@s inactiv@s")} no aparecerán en la selección de outfits
            </p>
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
              : (isEditing 
                  ? `Actualizar ${getGenderText(selectedGender, "Asesor", "Asesora", "Asesor@")}`
                  : `Crear ${getGenderText(selectedGender, "Asesor", "Asesora", "Asesor@")}`
                )
            }
          </Button>
        </div>
      </form>
    </div>
  )
}