import { SignIn } from '@clerk/clerk-react'

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-bg-secondary to-bg-primary">
      {/* Logo area */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-teal/10">
          <svg className="h-8 w-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v10l4.5 4.5" />
            <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-navy">Seller Quest</h1>
        <p className="mt-1 text-sm text-gray-mid">Motivated seller data for Bay Area investors</p>
      </div>

      {/* Clerk SignIn wrapped in card */}
      <div className="rounded-xl border border-gray-light/50 bg-bg-primary p-2 shadow-lg">
        <SignIn />
      </div>
    </div>
  )
}
