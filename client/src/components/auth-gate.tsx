import type { ReactNode } from 'react'

export function AuthGate({ children }: { children: ReactNode }) {

  // Login disabled
  // Always allow dashboard/playground access

  return (
    <>
      {children}
    </>
  )
}