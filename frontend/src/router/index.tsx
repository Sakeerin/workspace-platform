import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import WorkspaceList from '../pages/Workspace/WorkspaceList';
import PageEditor from '../pages/Page/PageEditor';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <WorkspaceList />,
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
        path: 'workspaces/:workspaceId/pages/:pageId',
        element: <PageEditor />,
      },
    ],
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}

