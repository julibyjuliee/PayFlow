import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routesConfig } from './routes.config';

/**
 * Router principal de la aplicación
 */
const router = createBrowserRouter(routesConfig, {
    future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
    },
});

export const AppRouter = () => {
    return <RouterProvider router={router} />;
};
