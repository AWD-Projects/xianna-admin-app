import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { Question, Answer, QuestionFormData, Estilo } from '@/types'

interface QuestionnaireState {
  questions: Question[]
  styles: Estilo[]
  currentQuestion: Question | null
  loading: boolean
  error: string | null
}

const initialState: QuestionnaireState = {
  questions: [],
  styles: [],
  currentQuestion: null,
  loading: false,
  error: null,
}

// Async thunks
export const fetchQuestions = createAsyncThunk(
  'questionnaire/fetchQuestions',
  async () => {
    const supabase = createClient()
    
    const { data: questionsData, error } = await supabase
      .from('preguntas')
      .select('*')
      .order('id')

    if (error) throw error

    // Get answers for each question
    const questionsWithAnswers = await Promise.all(
      (questionsData || []).map(async (question: any) => {
        const { data: answersData } = await supabase
          .from('respuestas')
          .select('*')
          .eq('id_pregunta', question.id)
          .order('identificador')

        return {
          ...question,
          answers: answersData || []
        }
      })
    )

    return questionsWithAnswers
  }
)

export const fetchStyles = createAsyncThunk(
  'questionnaire/fetchStyles',
  async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('estilos')
      .select('*')
      .eq('status', 'activo')
      .order('tipo')

    if (error) throw error
    return data
  }
)

export const createQuestion = createAsyncThunk(
  'questionnaire/createQuestion',
  async (questionData: QuestionFormData) => {
    const supabase = createClient()
    
    // Create question
    const { data: questionResult, error: questionError } = await supabase
      .from('preguntas')
      .insert({ pregunta: questionData.pregunta })
      .select()
      .single()

    if (questionError) throw questionError

    // Create answers
    const answersToInsert = questionData.answers.map(answer => ({
      respuesta: answer.respuesta,
      identificador: answer.identificador,
      id_estilo: answer.id_estilo,
      id_pregunta: questionResult.id
    }))

    const { data: answersResult, error: answersError } = await supabase
      .from('respuestas')
      .insert(answersToInsert)
      .select()

    if (answersError) throw answersError

    return {
      ...questionResult,
      answers: answersResult
    }
  }
)

export const updateQuestion = createAsyncThunk(
  'questionnaire/updateQuestion',
  async ({ id, questionData, deletedAnswers = [] }: { 
    id: number; 
    questionData: QuestionFormData;
    deletedAnswers?: Answer[]
  }) => {
    const supabase = createClient()
    
    // Update question
    const { data: questionResult, error: questionError } = await supabase
      .from('preguntas')
      .update({ pregunta: questionData.pregunta })
      .eq('id', id)
      .select()
      .single()

    if (questionError) throw questionError

    // Delete removed answers
    if (deletedAnswers.length > 0) {
      const deleteIds = deletedAnswers.map(answer => answer.id)
      await supabase
        .from('respuestas')
        .delete()
        .in('id', deleteIds)
    }

    // Update/create answers
    const answersToUpdate = questionData.answers.filter(answer => answer.id && answer.id > 0)
    const answersToCreate = questionData.answers.filter(answer => !answer.id || answer.id === 0)

    // Update existing answers
    if (answersToUpdate.length > 0) {
      await Promise.all(
        answersToUpdate.map(answer =>
          supabase
            .from('respuestas')
            .update({
              respuesta: answer.respuesta,
              identificador: answer.identificador,
              id_estilo: answer.id_estilo
            })
            .eq('id', answer.id)
        )
      )
    }

    // Create new answers
    let newAnswers: any[] = []
    if (answersToCreate.length > 0) {
      const answersToInsert = answersToCreate.map(answer => ({
        respuesta: answer.respuesta,
        identificador: answer.identificador,
        id_estilo: answer.id_estilo,
        id_pregunta: id
      }))

      const { data: newAnswersResult } = await supabase
        .from('respuestas')
        .insert(answersToInsert)
        .select()

      newAnswers = newAnswersResult || []
    }

    // Get all current answers
    const { data: allAnswers } = await supabase
      .from('respuestas')
      .select('*')
      .eq('id_pregunta', id)
      .order('identificador')

    return {
      ...questionResult,
      answers: allAnswers || []
    }
  }
)

export const deleteQuestion = createAsyncThunk(
  'questionnaire/deleteQuestion',
  async (id: number) => {
    const supabase = createClient()
    
    // Delete answers first
    await supabase
      .from('respuestas')
      .delete()
      .eq('id_pregunta', id)
    
    // Delete question
    const { error } = await supabase
      .from('preguntas')
      .delete()
      .eq('id', id)

    if (error) throw error
    return id
  }
)

const questionnaireSlice = createSlice({
  name: 'questionnaire',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questions
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false
        state.questions = action.payload
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar preguntas'
      })
      // Fetch styles
      .addCase(fetchStyles.fulfilled, (state, action) => {
        state.styles = action.payload
      })
      // Create question
      .addCase(createQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading = false
        state.questions.push(action.payload)
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al crear pregunta'
      })
      // Update question
      .addCase(updateQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.loading = false
        const index = state.questions.findIndex(q => q.id === action.payload.id)
        if (index !== -1) {
          state.questions[index] = action.payload
        }
        if (state.currentQuestion?.id === action.payload.id) {
          state.currentQuestion = action.payload
        }
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al actualizar pregunta'
      })
      // Delete question
      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false
        state.questions = state.questions.filter(q => q.id !== action.payload)
        if (state.currentQuestion?.id === action.payload) {
          state.currentQuestion = null
        }
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al eliminar pregunta'
      })
  },
})

export const { clearError, clearCurrentQuestion, setCurrentQuestion } = questionnaireSlice.actions
export default questionnaireSlice.reducer
