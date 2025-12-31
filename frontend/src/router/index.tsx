import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import App from '../App';
import ProtectedRoute from '../components/Common/ProtectedRoute';
import ErrorBoundary from '../components/Common/ErrorBoundary';

// Lazy load pages for code splitting and better performance
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const WorkspaceList = lazy(() => import('../pages/Workspace/WorkspaceList'));
const WorkspaceCreate = lazy(() => import('../pages/Workspace/WorkspaceCreate'));
const WorkspaceSettings = lazy(() => import('../pages/Workspace/WorkspaceSettings'));
const PageEditor = lazy(() => import('../pages/Page/PageEditor'));
const DatabaseEditor = lazy(() => import('../pages/Database/DatabaseEditor'));

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <WorkspaceList />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <Register />
          </Suspense>
        ),
      },
      {
        path: 'workspaces/create',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <WorkspaceCreate />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'workspaces/:workspaceId',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <WorkspaceSettings />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'workspaces/:workspaceId/pages/:pageId',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <PageEditor />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'workspaces/:workspaceId/databases/:pageId',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <DatabaseEditor />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}

