'use client'

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { SessionWatcher } from '@/components/auth/SessionWatcher'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentUser } from '@/store/slices/authSlice'
import type { RootState, AppDispatch } from '@/store'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { user, loading } = useSelector((state: RootState) => state.auth)

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await dispatch(getCurrentUser()).unwrap()
      } catch (error) {
        console.warn('DashboardLayout: Session initialization failed:', error)
        // Redirect to login if session can't be established
        router.push('/login?error=session_expired')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeSession()
  }, [dispatch, router])

  // Show loading while initializing or during auth operations
  if (loading || isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
            <div className="flex flex-1 flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Skeleton className="h-8 w-32" />
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </nav>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Header Skeleton */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-8 lg:hidden" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <main className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  // If no user after initialization, redirect to login
  if (!user) {
    router.push('/login')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Skeleton className="h-8 w-8 mx-auto mb-4 rounded-full" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Watcher */}
      <SessionWatcher />
      
      {/* Sidebar */}
      <DashboardSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
