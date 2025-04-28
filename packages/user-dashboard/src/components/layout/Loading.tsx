export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="space-y-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
