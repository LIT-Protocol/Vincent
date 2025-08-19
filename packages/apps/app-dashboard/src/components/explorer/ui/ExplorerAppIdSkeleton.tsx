import { Skeleton } from '@/components/shared/ui/skeleton';
import { Header } from './Header';

export function ExplorerAppIdSkeleton() {
  return (
    <div className="fixed inset-0 bg-white overflow-auto">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Header with Back Button */}
        <Header showBackButton={true} />

        {/* App Header Skeleton */}
        <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Logo */}
            <Skeleton className="w-20 h-20 rounded-xl" />

            {/* App Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                <Skeleton className="h-10 w-full max-w-48" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-96 mb-6" />

              {/* Quick Stats */}
              <div className="flex items-center gap-8">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>

            {/* Action Button */}
            <Skeleton className="h-12 w-28 rounded-full" />
          </div>
        </div>

        {/* Basic Information Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {/* App ID */}
                <div className="bg-black/[0.02] border border-black/5 rounded-xl p-4">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>

                {/* Active Version */}
                <div className="bg-black/[0.02] border border-black/5 rounded-xl p-4">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-8" />
                </div>

                {/* Created/Updated */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/[0.02] border border-black/5 rounded-xl p-4">
                    <Skeleton className="h-3 w-12 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="bg-black/[0.02] border border-black/5 rounded-xl p-4">
                    <Skeleton className="h-3 w-12 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Management Skeleton */}
          <div className="space-y-6">
            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                {/* Contact Email */}
                <div className="bg-black/[0.02] border border-black/5 rounded-xl p-4">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-full max-w-48" />
                </div>

                {/* App URL */}
                <div className="bg-black/[0.02] border border-black/5 rounded-xl p-4">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-full max-w-56" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version Information Skeleton */}
        <div className="bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-6">
          <Skeleton className="h-6 w-40 mb-6" />

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-full" />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-full max-w-48" />
            </div>

            {/* Ability Cards */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-black/[0.02] border border-black/5 rounded-xl p-5">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
