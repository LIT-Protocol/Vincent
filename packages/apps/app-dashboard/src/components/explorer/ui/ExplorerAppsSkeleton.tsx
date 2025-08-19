import { Skeleton } from '@/components/shared/ui/skeleton';
import { Header } from './Header';

export function ExplorerAppsSkeleton() {
  return (
    <div className="fixed inset-0 bg-white overflow-auto">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Header */}
        <Header />

        {/* Hero Section Skeleton */}
        <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <Skeleton className="h-8 w-48 rounded-full" />
            </div>
            <Skeleton className="h-16 w-full max-w-96 mb-6" />
            <Skeleton className="h-4 w-full max-w-80" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </div>

        {/* Apps Grid Skeleton */}
        <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-6">
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3">
              <Skeleton className="col-span-6 h-4" />
              <Skeleton className="col-span-2 h-4" />
              <Skeleton className="col-span-2 h-4" />
              <Skeleton className="col-span-2 h-4" />
            </div>

            {/* Table Rows */}
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-4 px-4 py-4 bg-black/[0.02] border border-black/5 rounded-xl"
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
