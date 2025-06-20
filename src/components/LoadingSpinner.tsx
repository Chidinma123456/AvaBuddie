export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading VirtualDoc...</p>
      </div>
    </div>
  );
}