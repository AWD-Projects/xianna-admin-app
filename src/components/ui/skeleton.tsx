import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

// Card skeleton for dashboard cards
function CardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-6 border rounded-lg bg-white", className)} {...props}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

// Stats cards skeleton
function StatCardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-6 border rounded-lg bg-white", className)} {...props}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// Table/List item skeleton
function ListItemSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4 border rounded-lg bg-white", className)} {...props}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}

// Chart skeleton
function ChartSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-6 border rounded-lg bg-white", className)} {...props}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

// Blog card skeleton
function BlogCardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("border rounded-lg bg-white overflow-hidden", className)} {...props}>
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

// User card skeleton
function UserCardSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4 border rounded-lg bg-white", className)} {...props}>
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

// Form skeleton
function FormSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  CardSkeleton, 
  StatCardSkeleton, 
  ListItemSkeleton, 
  ChartSkeleton, 
  BlogCardSkeleton, 
  UserCardSkeleton,
  FormSkeleton 
}