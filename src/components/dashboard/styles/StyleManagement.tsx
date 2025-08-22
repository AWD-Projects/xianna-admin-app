'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { fetchStyles, createStyle, updateStyle, deleteStyle, clearError } from '@/store/slices/styleSlice'
import type { AppDispatch, RootState } from '@/store'
import type { Style, StyleFormData } from '@/types'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

const styleSchema = z.object({
  tipo: z.string().min(1, 'El tipo es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida')
})

export function StyleManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { styles, loading, error } = useSelector((state: RootState) => state.style)
  
  const [showForm, setShowForm] = useState(false)
  const [editingStyle, setEditingStyle] = useState<Style | null>(null)
  const [deletingStyle, setDeletingStyle] = useState<Style | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<StyleFormData>({
    resolver: zodResolver(styleSchema),
    defaultValues: {
      tipo: '',
      descripcion: ''
    }
  })

  useEffect(() => {
    dispatch(fetchStyles())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  useEffect(() => {
    if (editingStyle) {
      reset({
        tipo: editingStyle.tipo,
        descripcion: editingStyle.descripcion
      })
    } else {
      reset({
        tipo: '',
        descripcion: ''
      })
    }
  }, [editingStyle, reset])

  const handleAddNew = () => {
    setEditingStyle(null)
    setShowForm(true)
  }

  const handleEdit = (style: Style) => {
    setEditingStyle(style)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingStyle(null)
    reset()
  }

  const onSubmit = async (data: StyleFormData) => {
    try {
      if (editingStyle) {
        await dispatch(updateStyle({ id: editingStyle.id, styleData: data })).unwrap()
        toast.success('Estilo actualizado exitosamente')
      } else {
        await dispatch(createStyle(data)).unwrap()
        toast.success('Estilo creado exitosamente')
      }
      handleCancelForm()
    } catch (error) {
      toast.error(editingStyle ? 'Error al actualizar el estilo' : 'Error al crear el estilo')
    }
  }

  const handleDelete = async () => {
    if (!deletingStyle) return
    
    try {
      await dispatch(deleteStyle(deletingStyle.id)).unwrap()
      toast.success('Estilo eliminado exitosamente')
      setDeletingStyle(null)
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el estilo')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Estilos</h1>
          <p className="text-gray-600 mt-2">
            Administra los estilos de moda disponibles
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Estilo
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
                    {editingStyle ? 'Editar Estilo' : 'Nuevo Estilo'}
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
                      Tipo *
                    </label>
                    <input
                      {...register('tipo')}
                      type="text"
                      placeholder="Ej: Casual"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    {errors.tipo && (
                      <p className="text-red-500 text-sm mt-1">{errors.tipo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      {...register('descripcion')}
                      rows={3}
                      placeholder="Describe el estilo..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                    />
                    {errors.descripcion && (
                      <p className="text-red-500 text-sm mt-1">{errors.descripcion.message}</p>
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
                      : (editingStyle ? 'Actualizar' : 'Crear')
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
              <CardTitle>Estilos ({styles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                </div>
              ) : styles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay estilos registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {styles.map((style) => (
                    <div key={style.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{style.tipo}</h3>
                        <p className="text-sm text-gray-600">{style.descripcion}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(style)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingStyle(style)}
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
        isOpen={!!deletingStyle}
        onClose={() => setDeletingStyle(null)}
        onConfirm={handleDelete}
        title="Eliminar Estilo"
        message={`¿Estás seguro de que quieres eliminar el estilo "${deletingStyle?.tipo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}