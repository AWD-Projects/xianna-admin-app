'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCardSkeleton, ListItemSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { fetchQuestions, deleteQuestion, fetchStyles } from '@/store/slices/questionnaireSlice'
import { QuestionForm } from './QuestionForm'
import type { AppDispatch, RootState } from '@/store'
import type { Question } from '@/types'
import { Plus, Download, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function QuestionnaireManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { questions, styles, loading, error } = useSelector(
    (state: RootState) => state.questionnaire
  )

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    dispatch(fetchQuestions())
    dispatch(fetchStyles())
  }, [dispatch])

  // Helper function to get style name by id
  const getStyleName = (id_estilo: number): string => {
    const style = styles.find(s => s.id === id_estilo)
    return style ? style.tipo : `Estilo ${id_estilo}`
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    setEditingQuestion(null)
    // Refresh the questions list
    dispatch(fetchQuestions())
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
  }

  const handleDeleteClick = (question: Question) => {
    setDeletingQuestion(question)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingQuestion) return
    
    setIsDeleting(true)
    try {
      await dispatch(deleteQuestion(deletingQuestion.id)).unwrap()
      toast.success('Pregunta eliminada exitosamente')
      setDeletingQuestion(null)
      // Refresh the questions list
      dispatch(fetchQuestions())
    } catch (error) {
      toast.error('Error al eliminar la pregunta')
      console.error('Error deleting question:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportCSV = () => {
    if (questions.length === 0) {
      toast.error('No hay preguntas para exportar')
      return
    }

    // Prepare data for CSV export - detailed format with all questions and answers
    const data: any[] = []
    
    questions.forEach((question, questionIndex) => {
      question.answers.forEach((answer, answerIndex) => {
        data.push({
          'Pregunta #': questionIndex + 1,
          'Pregunta': question.pregunta,
          'Respuesta #': answerIndex + 1,
          'Respuesta': answer.respuesta,
          'Identificador': answer.identificador.toUpperCase(),
          'ID Estilo': answer.id_estilo,
          'ID Pregunta': question.id,
          'ID Respuesta': answer.id
        })
      })
    })

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cuestionario')
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0]
    const filename = `cuestionario_${date}.csv`
    
    // Export as CSV
    XLSX.writeFile(wb, filename, { bookType: 'csv' })
    toast.success('Cuestionario exportado exitosamente')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Formulario</h1>
            <p className="text-gray-600 mt-2">
              Gestiona las preguntas del formulario de usuarios
            </p>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse" />
        </div>

        {/* Stats Card Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCardSkeleton />
          <div className="md:col-span-3" />
        </div>

        {/* Questions List Skeleton */}
        <div className="space-y-4">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>
    )
  }

  // Show create form if in create mode
  if (showCreateForm) {
    return (
      <QuestionForm
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }
  
  // Show edit form if editing
  if (editingQuestion) {
    return (
      <QuestionForm
        question={editingQuestion}
        onSuccess={handleCreateSuccess}
        onCancel={() => setEditingQuestion(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuestionario</h1>
          <p className="text-gray-600 mt-2">
            Gestiona las preguntas del test de estilo
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleExportCSV}
            disabled={questions.length === 0}
            title={questions.length === 0 ? 'No hay preguntas para exportar' : 'Exportar cuestionario a CSV'}
          >
            <Download className="h-4 w-4" />
            Exportar CSV {questions.length > 0 && `(${questions.length})`}
          </Button>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Pregunta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Preguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questions.reduce((acc, q) => acc + q.answers.length, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Opciones disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promedio Opciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questions.length > 0 
                ? Math.round(questions.reduce((acc, q) => acc + q.answers.length, 0) / questions.length)
                : 0
              }
            </div>
            <p className="text-sm text-muted-foreground">Por pregunta</p>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-yellow-700">
                      {index + 1}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{question.pregunta}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditQuestion(question)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteClick(question)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {question.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {answer.identificador.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getStyleName(answer.id_estilo)}
                      </Badge>
                    </div>
                    <p className="text-sm">{answer.respuesta}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {questions.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay preguntas
          </h3>
          <p className="text-gray-500 mb-4">
            Comienza creando la primera pregunta del cuestionario
          </p>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Primera Pregunta
          </Button>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingQuestion}
        onClose={() => setDeletingQuestion(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Pregunta"
        message={`¿Estás seguro de que deseas eliminar la pregunta "${deletingQuestion?.pregunta}"? Esta acción eliminará también todas las respuestas asociadas y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={isDeleting}
      />

    </div>
  )
}
