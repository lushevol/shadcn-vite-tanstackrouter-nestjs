import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const { auth } = useAuthStore.getState()
    if (!auth.isAuthenticated()) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
        replace: true,
      })
    }
  },
  component: AuthenticatedLayout,
})
