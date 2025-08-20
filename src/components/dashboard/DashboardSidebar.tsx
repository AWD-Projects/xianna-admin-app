'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { X, BarChart3, Users, FileText, Shirt, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Insights', href: '/dashboard', icon: BarChart3 },
  { name: 'Usuarios', href: '/dashboard/users', icon: Users },
  { name: 'Blogs', href: '/dashboard/blogs', icon: FileText },
  { name: 'Catálogo', href: '/dashboard/catalog', icon: Shirt },
  { name: 'Formulario', href: '/dashboard/questionnaire', icon: HelpCircle },
]

interface DashboardSidebarProps {
  open: boolean
  onClose: () => void
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center px-6 py-8">
        <img
          src="/images/xianna.png"
          alt="Xianna Logo"
          className="w-32 h-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-colors',
                isActive
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 animate-slide-in">
            <div className="absolute right-4 top-4">
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}
