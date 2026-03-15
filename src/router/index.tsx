import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { PrivateRoute, GuestRoute } from './guards'
import { ROUTES } from '../constants/routes'

// Retry wrapper: on chunk load failure (stale cache after deploy), reload the page once
function lazyRetry(factory: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    factory().catch(() => {
      const key = 'chunk-reload'
      const hasReloaded = sessionStorage.getItem(key)
      if (!hasReloaded) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
        return new Promise(() => {}) // never resolves — page is reloading
      }
      sessionStorage.removeItem(key)
      return factory() // retry once more, let it fail naturally
    })
  )
}

const AuthCallbackPage = lazyRetry(() => import('../pages/auth/AuthCallbackPage'))
const SplashPage = lazyRetry(() => import('../pages/auth/SplashPage'))
const LoginPage = lazyRetry(() => import('../pages/auth/LoginPage'))
const OTPPage = lazyRetry(() => import('../pages/auth/OTPPage'))
const ProfileSetupPage = lazyRetry(() => import('../pages/auth/ProfileSetupPage'))
const FeedPage = lazyRetry(() => import('../pages/feed/FeedPage'))
const GroupsPage = lazyRetry(() => import('../pages/groups/GroupsPage'))
const GroupDetailPage = lazyRetry(() => import('../pages/groups/GroupDetailPage'))
const NewExpensePage = lazyRetry(() => import('../pages/expenses/NewExpensePage'))
const ScanReceiptPage = lazyRetry(() => import('../pages/expenses/ScanReceiptPage'))
const DebtsPage = lazyRetry(() => import('../pages/debts/DebtsPage'))
const PaySuccessPage = lazyRetry(() => import('../pages/debts/PaySuccessPage'))
const UpgradePage = lazyRetry(() => import('../pages/premium/UpgradePage'))
const ProfilePage = lazyRetry(() => import('../pages/profile/ProfilePage'))

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary-2)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    </div>
  )
}

function RouteErrorBoundary() {
  const error = useRouteError()
  const isChunkError = !isRouteErrorResponse(error) && error instanceof Error &&
    error.message.includes('dynamically imported module')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', padding: 24, textAlign: 'center' }}>
      <p style={{ color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', fontSize: 16, marginBottom: 8 }}>
        {isChunkError ? 'Hay una nueva version disponible' : 'Algo salio mal'}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '10px 24px', borderRadius: 12, background: 'var(--primary-2)', color: 'white', border: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}
      >
        Recargar
      </button>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/auth/callback',
    errorElement: <RouteErrorBoundary />,
    element: <Suspense fallback={<Loading />}><AuthCallbackPage /></Suspense>,
  },
  {
    path: ROUTES.SPLASH,
    errorElement: <RouteErrorBoundary />,
    element: <Suspense fallback={<Loading />}><SplashPage /></Suspense>,
  },
  {
    path: ROUTES.LOGIN,
    errorElement: <RouteErrorBoundary />,
    element: <GuestRoute><Suspense fallback={<Loading />}><LoginPage /></Suspense></GuestRoute>,
  },
  {
    path: ROUTES.OTP,
    errorElement: <RouteErrorBoundary />,
    element: <GuestRoute><Suspense fallback={<Loading />}><OTPPage /></Suspense></GuestRoute>,
  },
  {
    path: ROUTES.PROFILE_SETUP,
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><ProfileSetupPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.FEED,
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><FeedPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.GROUPS,
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><GroupsPage /></Suspense></PrivateRoute>,
  },
  {
    path: '/grupos/:id',
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><GroupDetailPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.NEW_EXPENSE,
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><NewExpensePage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.SCAN_RECEIPT,
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><ScanReceiptPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.DEBTS,
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><DebtsPage /></Suspense></PrivateRoute>,
  },
  {
    path: '/pago-ok/:expenseId',
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><PaySuccessPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.UPGRADE,
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><UpgradePage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.PROFILE,
    errorElement: <RouteErrorBoundary />,
    element: <PrivateRoute><Suspense fallback={<Loading />}><ProfilePage /></Suspense></PrivateRoute>,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
