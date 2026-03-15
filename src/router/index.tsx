import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PrivateRoute, GuestRoute } from './guards'
import { ROUTES } from '../constants/routes'

const AuthCallbackPage = lazy(() => import('../pages/auth/AuthCallbackPage'))
const SplashPage = lazy(() => import('../pages/auth/SplashPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const OTPPage = lazy(() => import('../pages/auth/OTPPage'))
const ProfileSetupPage = lazy(() => import('../pages/auth/ProfileSetupPage'))
const FeedPage = lazy(() => import('../pages/feed/FeedPage'))
const GroupsPage = lazy(() => import('../pages/groups/GroupsPage'))
const GroupDetailPage = lazy(() => import('../pages/groups/GroupDetailPage'))
const NewExpensePage = lazy(() => import('../pages/expenses/NewExpensePage'))
const ScanReceiptPage = lazy(() => import('../pages/expenses/ScanReceiptPage'))
const DebtsPage = lazy(() => import('../pages/debts/DebtsPage'))
const PaySuccessPage = lazy(() => import('../pages/debts/PaySuccessPage'))
const UpgradePage = lazy(() => import('../pages/premium/UpgradePage'))
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'))

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary-2)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/auth/callback',
    element: <Suspense fallback={<Loading />}><AuthCallbackPage /></Suspense>,
  },
  {
    path: ROUTES.SPLASH,
    element: <Suspense fallback={<Loading />}><SplashPage /></Suspense>,
  },
  {
    path: ROUTES.LOGIN,
    element: <GuestRoute><Suspense fallback={<Loading />}><LoginPage /></Suspense></GuestRoute>,
  },
  {
    path: ROUTES.OTP,
    element: <GuestRoute><Suspense fallback={<Loading />}><OTPPage /></Suspense></GuestRoute>,
  },
  {
    path: ROUTES.PROFILE_SETUP,
    element: <PrivateRoute><Suspense fallback={<Loading />}><ProfileSetupPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.FEED,
    element: <PrivateRoute><Suspense fallback={<Loading />}><FeedPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.GROUPS,
    element: <PrivateRoute><Suspense fallback={<Loading />}><GroupsPage /></Suspense></PrivateRoute>,
  },
  {
    path: '/grupos/:id',
    element: <PrivateRoute><Suspense fallback={<Loading />}><GroupDetailPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.NEW_EXPENSE,
    element: <PrivateRoute><Suspense fallback={<Loading />}><NewExpensePage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.SCAN_RECEIPT,
    element: <PrivateRoute><Suspense fallback={<Loading />}><ScanReceiptPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.DEBTS,
    element: <PrivateRoute><Suspense fallback={<Loading />}><DebtsPage /></Suspense></PrivateRoute>,
  },
  {
    path: '/pago-ok/:expenseId',
    element: <PrivateRoute><Suspense fallback={<Loading />}><PaySuccessPage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.UPGRADE,
    element: <PrivateRoute><Suspense fallback={<Loading />}><UpgradePage /></Suspense></PrivateRoute>,
  },
  {
    path: ROUTES.PROFILE,
    element: <PrivateRoute><Suspense fallback={<Loading />}><ProfilePage /></Suspense></PrivateRoute>,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
