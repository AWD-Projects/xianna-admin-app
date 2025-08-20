'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { createClient } from '@/lib/supabase/client'
import { logoutAdmin, getCurrentUser } from '@/store/slices/authSlice'
import type { AppDispatch, RootState } from '@/store'
import { toast } from 'sonner'

export function SessionWatcher() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session with more careful handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('SessionWatcher: Session check error:', error)
          return
        }
        
        // Only act if we clearly have a mismatch
        if (!session && user) {
          await dispatch(logoutAdmin())
          toast.warning('Tu sesión ha expirado')
          router.push('/login?error=session_expired')
        }
      } catch (error) {
        console.warn('SessionWatcher: Error checking initial session:', error)
      }
    }

    // Add a small delay to avoid conflicts with initialization
    const timer = setTimeout(getInitialSession, 1000)

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      switch (event) {
        case 'SIGNED_OUT':
          // User signed out - clear Redux state and redirect
          await dispatch(logoutAdmin())
          if (window.location.pathname !== '/login') {
            toast.info('Sesión cerrada')
            router.push('/login')
          }
          break

        case 'SIGNED_IN':
          // User signed in - verify admin status
          if (session?.user) {
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
            if (session.user.email === adminEmail) {
              // Valid admin login
              dispatch(getCurrentUser())
            } else {
              // Not an admin - sign out
              await supabase.auth.signOut()
              toast.error('No tienes permisos de administrador')
              router.push('/login?error=unauthorized')
            }
          }
          break

        case 'TOKEN_REFRESHED':
          // Token refreshed successfully
          break

        case 'USER_UPDATED':
          // User data updated
          if (session?.user) {
            dispatch(getCurrentUser())
          }
          break

        default:
          break
      }
    })

    // Cleanup subscription and timer on unmount
    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [dispatch, router, supabase, user])

  // Periodic session check (every 5 minutes)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('Session check error:', error)
          if (user && window.location.pathname !== '/login') {
            await dispatch(logoutAdmin())
            toast.warning('Tu sesión ha expirado')
            router.push('/login?error=session_expired')
          }
          return
        }

        if (!session && user) {
          // Session expired but user still in Redux
          await dispatch(logoutAdmin())
          if (window.location.pathname !== '/login') {
            toast.warning('Tu sesión ha expirado')
            router.push('/login?error=session_expired')
          }
        }
      } catch (error) {
        console.warn('Error during periodic session check:', error)
      }
    }

    // Check session immediately
    checkSession()

    // Set up periodic checking
    const interval = setInterval(checkSession, 5 * 60 * 1000) // 5 minutes

    return () => {
      clearInterval(interval)
    }
  }, [dispatch, router, supabase, user])

  // This component doesn't render anything
  return null
}