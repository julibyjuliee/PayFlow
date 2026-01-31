import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routesConfig } from './routes.config';

const router = createBrowserRouter(routesConfig, {
    future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
    },
});

export const AppRouter = () => {
    return <RouterProvider router={router} />;
};
