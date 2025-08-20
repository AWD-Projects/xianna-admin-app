import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  const url = request.nextUrl.clone()

  // Define public routes that don't require authentication
  const publicRoutes = ['/login']
  
  // Define static/public paths that should be excluded
  const staticPaths = ['/api', '/_next', '/favicon.ico', '/images']
  
  // Skip API routes, static files, and public assets
  if (staticPaths.some(path => pathname.startsWith(path))) {
    return supabaseResponse
  }

  let user = null
  let sessionError = false

  try {
    // Get user with proper error handling
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('Session error in middleware:', error.message)
      sessionError = true
    } else {
      user = data.user
    }
  } catch (error) {
    console.warn('Unexpected error getting user in middleware:', error)
    sessionError = true
  }

  // If there's a session error or user is null, treat as unauthenticated
  if (sessionError || !user) {
    // Clear any stale auth cookies
    if (sessionError) {
      supabaseResponse.cookies.delete('sb-access-token')
      supabaseResponse.cookies.delete('sb-refresh-token')
      
      // Clear all Supabase auth cookies (they usually start with 'sb-')
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
          supabaseResponse.cookies.delete(cookie.name)
        }
      })
    }
    
    // Allow access to public routes
    if (publicRoutes.includes(pathname)) {
      return supabaseResponse
    }
    
    // For protected routes, redirect to login with session expired message
    url.pathname = '/login'
    if (sessionError && !publicRoutes.includes(request.nextUrl.pathname)) {
      url.searchParams.set('error', 'session_expired')
    }
    return NextResponse.redirect(url)
  }

  // User is authenticated - check if they are admin
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  
  if (!adminEmail) {
    console.error('NEXT_PUBLIC_ADMIN_EMAIL environment variable is not set')
    url.pathname = '/login'
    url.searchParams.set('error', 'configuration_error')
    return NextResponse.redirect(url)
  }
  
  if (user.email !== adminEmail) {
    // Not an admin, sign them out and redirect to login
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Error signing out unauthorized user:', error)
    }
    
    url.pathname = '/login'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }
  
  // Admin user is authenticated
  
  // If admin tries to access login page while logged in, redirect to dashboard
  if (pathname === '/login') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // If admin accesses root, redirect to dashboard
  if (pathname === '/') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // Allow access to all other routes when authenticated as admin
  return supabaseResponse
}
