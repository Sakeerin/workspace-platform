import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import WorkspaceList from '../pages/Workspace/WorkspaceList';
import WorkspaceCreate from '../pages/Workspace/WorkspaceCreate';
import WorkspaceSettings from '../pages/Workspace/WorkspaceSettings';
import PageEditor from '../pages/Page/PageEditor';
import ProtectedRoute from '../components/Common/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <WorkspaceList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'workspaces/create',
        element: (
          <ProtectedRoute>
            <WorkspaceCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: 'workspaces/:workspaceId',
        element: (
          <ProtectedRoute>
            <WorkspaceSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: 'workspaces/:workspaceId/pages/:pageId',
        element: (
          <ProtectedRoute>
            <PageEditor />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}

