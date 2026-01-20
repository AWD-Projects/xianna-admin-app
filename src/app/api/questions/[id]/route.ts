import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: {
    id: string
  }
}

type AnswerPayload = {
  id?: number
  respuesta: string
  identificador: string
  id_estilo: number
}

type QuestionPayload = {
  pregunta: string
  answers: AnswerPayload[]
}

type UpdatePayload = {
  questionData?: QuestionPayload
  deletedAnswers?: { id: number }[]
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = createClient()
  const id = Number(context.params.id)

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid question id' }, { status: 400 })
  }

  let payload: UpdatePayload | null = null
  try {
    payload = await request.json()
  } catch {
    payload = null
  }

  if (!payload?.questionData) {
    return NextResponse.json({ error: 'Missing question data' }, { status: 400 })
  }

  const { questionData, deletedAnswers = [] } = payload

  const { data: questionResult, error: questionError } = await supabase
    .from('preguntas')
    .update({ pregunta: questionData.pregunta })
    .eq('id', id)
    .select()
    .single()

  if (questionError) {
    return NextResponse.json({ error: questionError.message }, { status: 400 })
  }

  if (deletedAnswers.length > 0) {
    const deleteIds = deletedAnswers
      .map(answer => answer.id)
      .filter((value): value is number => Number.isFinite(value))

    if (deleteIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('respuestas')
        .delete()
        .in('id', deleteIds)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 })
      }
    }
  }

  const answersToUpdate = questionData.answers.filter(answer => answer.id && answer.id > 0)
  const answersToCreate = questionData.answers.filter(answer => !answer.id || answer.id === 0)

  if (answersToUpdate.length > 0) {
    const updateResults = await Promise.all(
      answersToUpdate.map(answer =>
        supabase
          .from('respuestas')
          .update({
            respuesta: answer.respuesta,
            identificador: answer.identificador,
            id_estilo: answer.id_estilo
          })
          .eq('id', answer.id as number)
      )
    )

    const updateError = updateResults.find(result => result.error)?.error
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }
  }

  if (answersToCreate.length > 0) {
    const answersToInsert = answersToCreate.map(answer => ({
      respuesta: answer.respuesta,
      identificador: answer.identificador,
      id_estilo: answer.id_estilo,
      id_pregunta: id
    }))

    const { error: insertError } = await supabase
      .from('respuestas')
      .insert(answersToInsert)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }
  }

  const { data: allAnswers, error: allAnswersError } = await supabase
    .from('respuestas')
    .select('*')
    .eq('id_pregunta', id)
    .order('identificador')

  if (allAnswersError) {
    return NextResponse.json({ error: allAnswersError.message }, { status: 400 })
  }

  return NextResponse.json({
    ...questionResult,
    answers: allAnswers || []
  })
}
