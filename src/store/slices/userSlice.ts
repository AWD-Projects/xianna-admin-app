import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

interface UserState {
  users: User[]
  selectedUser: User | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    totalPages: number
    totalUsers: number
    pageSize: number
  }
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    totalPages: 1,
    totalUsers: 0,
    pageSize: 10
  }
}

// Async thunks
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async ({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }) => {
    const supabase = createClient()
    
    const { data, error, count } = await supabase
      .from('user_details')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    return {
      users: data || [],
      totalUsers: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page
    }
  }
)

export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async () => {
    const supabase = createClient()
    
    const { data, error, count } = await supabase
      .from('user_details')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })

    if (error) throw error

    return {
      users: data || [],
      totalUsers: count || 0,
      totalPages: 1,
      currentPage: 1
    }
  }
)

export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (id: number) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload.users
        state.pagination = {
          ...state.pagination,
          page: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalUsers: action.payload.totalUsers
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar usuarios'
      })
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload.users
        state.pagination = {
          ...state.pagination,
          page: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalUsers: action.payload.totalUsers,
          pageSize: action.payload.totalUsers // Set pageSize to total users to show all
        }
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar usuarios'
      })
      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedUser = action.payload
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Error al cargar usuario'
      })
  },
})

export const { clearError, setSelectedUser, clearSelectedUser, setPagination } = userSlice.actions
export default userSlice.reducer
