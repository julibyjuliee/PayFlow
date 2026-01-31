import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotFoundPage } from '../NotFoundPage';
import '@testing-library/jest-dom/vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('NotFoundPage', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it('renderiza el mensaje de 404 y botón', () => {
        render(<NotFoundPage />);
        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
        expect(screen.getByText('Volver al inicio')).toBeInTheDocument();
    });

    it('navega al inicio al hacer click en el botón', () => {
        render(<NotFoundPage />);
        const buttons = screen.getAllByText('Volver al inicio');
        fireEvent.click(buttons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
