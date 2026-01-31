import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

export interface IRouteGuard {
    canActivate: () => boolean;
    redirectTo?: string;
}

interface RouteGuardProps {
    children: ReactNode;
    guard: IRouteGuard;
}

export const RouteGuard = ({ children, guard }: RouteGuardProps) => {
    const canAccess = guard.canActivate();

    if (!canAccess) {
        return <Navigate to={guard.redirectTo || '/'} replace />;
    }

    return <>{children}</>;
};
