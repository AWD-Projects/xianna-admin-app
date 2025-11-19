'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { getCurrentUser, logoutAdmin } from '@/store/slices/authSlice'
import type { AppDispatch } from '@/store'

export function SessionManager() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          try {
            await dispatch(getCurrentUser()).unwrap()
          } catch (error) {
            console.warn('SessionManager: unable to refresh admin session', error)
          }
          break
        case 'SIGNED_OUT':
          await dispatch(logoutAdmin())
          if (window.location.pathname !== '/login') {
            toast.info('Sesión cerrada')
            router.push('/login')
          }
          break
        default:
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch, router, supabase])

  return null
}
