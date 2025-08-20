import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import ErrorBoundary from '@/components/error/ErrorBoundary'

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ErrorBoundary>
  )
}
