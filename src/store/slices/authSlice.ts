import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  isAdmin: boolean
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAdmin: false,
}

// Async thunks
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async ({ email, password }: { email: string; password: string }) => {
    const supabase = createClient()
    
    // Check if email is admin email
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (email !== adminEmail) {
      throw new Error('No tienes permisos de administrador')
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data.user
  }
)

export const logoutAdmin = createAsyncThunk(
  'auth/logoutAdmin',
  async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async () => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    
    // Verify admin status
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const isAdmin = user?.email === adminEmail
    
    return { user, isAdmin }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUser: (state, action) => {
      state.user = action.payload.user
      state.isAdmin = action.payload.isAdmin
    },
  },
  extraReducers: (builder) => {
    builder
      // Login admin
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAdmin = true
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al iniciar sesión'
      })
      // Logout admin
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.user = null
        state.isAdmin = false
        state.loading = false
        state.error = null
      })
      // Get current user
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.isAdmin = action.payload.isAdmin
        state.loading = false
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null
        state.isAdmin = false
        state.loading = false
      })
  },
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer
