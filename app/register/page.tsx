import { Suspense } from 'react'
import RegistrationDispatcher from '@/components/registration/RegistrationDispatcher'
import { Trophy } from 'lucide-react'

export default function RegistrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Registration...</h1>
          <p className="text-gray-600">Please wait while we load the registration form.</p>
        </div>
      </div>
    }>
      <RegistrationDispatcher />
    </Suspense>
  )
}
