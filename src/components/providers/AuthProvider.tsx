'use client'

import { createContext, useContext, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { createClient } from '@/lib/supabase/client'
import { setUser, getCurrentUser } from '@/store/slices/authSlice'
import type { AppDispatch } from '@/store'

const AuthContext = createContext<{}>({})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        const isAdmin = session.user.email === adminEmail
        dispatch(setUser({ user: session.user, isAdmin }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
          const isAdmin = session.user.email === adminEmail
          dispatch(setUser({ user: session.user, isAdmin }))
        } else if (event === 'SIGNED_OUT') {
          dispatch(setUser({ user: null, isAdmin: false }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [dispatch, supabase])

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
