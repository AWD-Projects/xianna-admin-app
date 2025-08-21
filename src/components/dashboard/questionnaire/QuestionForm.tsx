'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createQuestion, updateQuestion, fetchStyles } from '@/store/slices/questionnaireSlice'
import type { AppDispatch, RootState } from '@/store'
import type { Question, Answer } from '@/types'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const answerSchema = z.object({
  id: z.number().optional(),
  respuesta: z.string().min(1, 'La respuesta es requerida'),
  identificador: z.string().min(1, 'El identificador es requerido').max(1, 'Solo un carácter'),
  id_estilo: z.number().min(1, 'Selecciona un estilo'),
})

const questionSchema = z.object({
  pregunta: z.string().min(1, 'La pregunta es requerida'),
  answers: z.array(answerSchema).min(2, 'Debe tener al menos 2 respuestas'),
})

type QuestionFormData = z.infer<typeof questionSchema>

interface QuestionFormProps {
  question?: Question | null
  onSuccess: () => void
  onCancel: () => void
}

export function QuestionForm({ question, onSuccess, onCancel }: QuestionFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { styles, loading } = useSelector((state: RootState) => state.questionnaire)
  const [deletedAnswers, setDeletedAnswers] = useState<Answer[]>([])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      pregunta: question?.pregunta || '',
      answers: question?.answers && question.answers.length > 0 ? question.answers.map(answer => ({
        id: answer.id,
        respuesta: answer.respuesta,
        identificador: answer.identificador,
        id_estilo: answer.id_estilo,
      })) : [
        { respuesta: '', identificador: 'a', id_estilo: 0 },
        { respuesta: '', identificador: 'b', id_estilo: 0 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'answers',
  })

  useEffect(() => {
    // Only fetch styles if not already loaded
    if (styles.length === 0) {
      dispatch(fetchStyles())
    }
  }, [dispatch, styles.length])

  const onSubmit = async (data: QuestionFormData) => {
    try {
      if (question) {
        // Update existing question
        await dispatch(updateQuestion({ 
          id: question.id, 
          questionData: data,
          deletedAnswers 
        })).unwrap()
        toast.success('Pregunta actualizada exitosamente')
      } else {
        // Create new question
        await dispatch(createQuestion(data)).unwrap()
        toast.success('Pregunta creada exitosamente')
      }
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la pregunta')
    }
  }

  const addAnswer = () => {
    const nextLetter = String.fromCharCode(97 + fields.length) // a, b, c, d...
    append({
      respuesta: '',
      identificador: nextLetter,
      id_estilo: 0,
    })
  }

  const removeAnswer = (index: number) => {
    const answer = fields[index]
    if (answer.id && answer.id > 0) {
      // If it's an existing answer, add to deleted list
      const deletedAnswer: Answer = {
        id: answer.id,
        respuesta: answer.respuesta,
        identificador: answer.identificador,
        id_estilo: answer.id_estilo,
        id_pregunta: question?.id || 0
      }
      setDeletedAnswers(prev => [...prev, deletedAnswer])
    }
    remove(index)
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {question ? 'Editar Pregunta' : 'Nueva Pregunta'}
          </h1>
          <p className="text-gray-600 mt-2">
            {question ? 'Modifica la pregunta y sus respuestas' : 'Crea una nueva pregunta para el cuestionario'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Question Input */}
        <Card>
          <CardHeader>
            <CardTitle>Pregunta</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Input
                placeholder="Escribe tu pregunta aquí..."
                {...register('pregunta')}
                className={errors.pregunta ? 'border-red-500' : ''}
              />
              {errors.pregunta && (
                <p className="mt-1 text-sm text-red-600">{errors.pregunta.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Answers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Respuestas ({fields.length})</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAnswer}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Respuesta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      Opción {String.fromCharCode(65 + index)}
                    </Badge>
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAnswer(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Answer Text */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Texto de la respuesta
                      </label>
                      <Input
                        placeholder="Respuesta..."
                        {...register(`answers.${index}.respuesta`)}
                        className={errors.answers?.[index]?.respuesta ? 'border-red-500' : ''}
                      />
                      {errors.answers?.[index]?.respuesta && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.answers[index]?.respuesta?.message}
                        </p>
                      )}
                    </div>

                    {/* Identifier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Identificador
                      </label>
                      <Input
                        placeholder="a"
                        maxLength={1}
                        {...register(`answers.${index}.identificador`)}
                        className={errors.answers?.[index]?.identificador ? 'border-red-500' : ''}
                      />
                      {errors.answers?.[index]?.identificador && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.answers[index]?.identificador?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Style Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estilo asociado
                    </label>
                    <Select
                      value={watch(`answers.${index}.id_estilo`)?.toString() || ''}
                      onValueChange={(value) => setValue(`answers.${index}.id_estilo`, parseInt(value))}
                    >
                      <SelectTrigger className={errors.answers?.[index]?.id_estilo ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecciona un estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map((style) => (
                          <SelectItem key={style.id} value={style.id.toString()}>
                            {style.tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.answers?.[index]?.id_estilo && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.answers[index]?.id_estilo?.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {errors.answers && (
                <p className="text-sm text-red-600">
                  {errors.answers.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Guardando...' : question ? 'Actualizar Pregunta' : 'Crear Pregunta'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}