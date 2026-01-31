import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Interface para guards de rutas - Principio de Interface Segregation (SOLID)
 */
export interface IRouteGuard {
    canActivate: () => boolean;
    redirectTo?: string;
}

interface RouteGuardProps {
    children: ReactNode;
    guard: IRouteGuard;
}

/**
 * Componente genérico para protección de rutas
 * Sigue el principio Open/Closed - Abierto para extensión, cerrado para modificación
 */
export const RouteGuard = ({ children, guard }: RouteGuardProps) => {
    const canAccess = guard.canActivate();

    if (!canAccess) {
        return <Navigate to={guard.redirectTo || '/'} replace />;
    }

    return <>{children}</>;
};
