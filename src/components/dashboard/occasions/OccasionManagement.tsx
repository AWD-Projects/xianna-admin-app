'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { fetchOccasions, createOccasion, updateOccasion, deleteOccasion, clearError } from '@/store/slices/occasionSlice'
import type { AppDispatch, RootState } from '@/store'
import type { Occasion, OccasionFormData } from '@/types'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

const occasionSchema = z.object({
  ocasion: z.string().min(1, 'La ocasión es requerida')
})

export function OccasionManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { occasions, loading, error } = useSelector((state: RootState) => state.occasion)
  
  const [showForm, setShowForm] = useState(false)
  const [editingOccasion, setEditingOccasion] = useState<Occasion | null>(null)
  const [deletingOccasion, setDeletingOccasion] = useState<Occasion | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<OccasionFormData>({
    resolver: zodResolver(occasionSchema),
    defaultValues: {
      ocasion: ''
    }
  })

  useEffect(() => {
    dispatch(fetchOccasions())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  useEffect(() => {
    if (editingOccasion) {
      reset({
        ocasion: editingOccasion.ocasion
      })
    } else {
      reset({
        ocasion: ''
      })
    }
  }, [editingOccasion, reset])

  const handleAddNew = () => {
    setEditingOccasion(null)
    setShowForm(true)
  }

  const handleEdit = (occasion: Occasion) => {
    setEditingOccasion(occasion)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingOccasion(null)
    reset()
  }

  const onSubmit = async (data: OccasionFormData) => {
    try {
      if (editingOccasion) {
        await dispatch(updateOccasion({ id: editingOccasion.id, occasionData: data })).unwrap()
        toast.success('Ocasión actualizada exitosamente')
      } else {
        await dispatch(createOccasion(data)).unwrap()
        toast.success('Ocasión creada exitosamente')
      }
      handleCancelForm()
    } catch (error) {
      toast.error(editingOccasion ? 'Error al actualizar la ocasión' : 'Error al crear la ocasión')
    }
  }

  const handleDelete = async () => {
    if (!deletingOccasion) return
    
    try {
      await dispatch(deleteOccasion(deletingOccasion.id)).unwrap()
      toast.success('Ocasión eliminada exitosamente')
      setDeletingOccasion(null)
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la ocasión')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Ocasiones</h1>
          <p className="text-gray-600 mt-2">
            Administra las ocasiones de uso disponibles
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Ocasión
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        {showForm && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>
                    {editingOccasion ? 'Editar Ocasión' : 'Nueva Ocasión'}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleCancelForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ocasión *
                    </label>
                    <input
                      {...register('ocasion')}
                      type="text"
                      placeholder="Ej: Trabajo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    {errors.ocasion && (
                      <p className="text-red-500 text-sm mt-1">{errors.ocasion.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting 
                      ? 'Guardando...' 
                      : (editingOccasion ? 'Actualizar' : 'Crear')
                    }
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* List */}
        <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader>
              <CardTitle>Ocasiones ({occasions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                </div>
              ) : occasions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay ocasiones registradas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {occasions.map((occasion) => (
                    <div key={occasion.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{occasion.ocasion}</h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(occasion)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingOccasion(occasion)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingOccasion}
        onClose={() => setDeletingOccasion(null)}
        onConfirm={handleDelete}
        title="Eliminar Ocasión"
        message={`¿Estás seguro de que quieres eliminar la ocasión "${deletingOccasion?.ocasion}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}