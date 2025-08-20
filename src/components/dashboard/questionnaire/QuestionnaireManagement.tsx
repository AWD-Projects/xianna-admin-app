'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCardSkeleton, ListItemSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { fetchQuestions } from '@/store/slices/questionnaireSlice'
import type { AppDispatch, RootState } from '@/store'
import { Plus, Download } from 'lucide-react'

export function QuestionnaireManagement() {
  const dispatch = useDispatch<AppDispatch>()
  const { questions, loading, error } = useSelector(
    (state: RootState) => state.questionnaire
  )

  useEffect(() => {
    dispatch(fetchQuestions())
  }, [dispatch])

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
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="flex items-center gap-2">
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
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm">
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
                        Estilo {answer.id_estilo}
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
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Crear Primera Pregunta
          </Button>
        </div>
      )}
    </div>
  )
}
