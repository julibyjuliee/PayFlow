import type { CardType } from '../../utils/creditCardValidation';

interface CardLogoProps {
    cardType: CardType;
    className?: string;
}

export const CardLogo = ({ cardType, className = '' }: CardLogoProps) => {
    if (cardType === 'unknown') {
        return null;
    }

    const logos: Record<Exclude<CardType, 'unknown'>, JSX.Element> = {
        visa: (
            <svg
                className={className}
                viewBox="0 0 48 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="48" height="32" rx="4" fill="#1A1F71" />
                <path
                    d="M19.5 10L16.8 22H14.2L12.9 14.8C12.8 14.3 12.7 14.1 12.3 13.9C11.7 13.5 10.7 13.1 9.8 12.9L9.9 12.6H14.5C15.2 12.6 15.8 13.1 15.9 13.8L16.9 19.7L19.2 12.6H21.8L19.5 10ZM24.5 10L22.5 22H20L22 10H24.5ZM28.5 13.5C28.5 12.9 29 12.5 29.7 12.5C30.8 12.4 32.1 12.7 33.1 13.3L33.5 10.9C32.5 10.5 31.4 10.3 30.3 10.3C27.8 10.3 25.9 11.6 25.9 13.6C25.9 15.1 27.2 15.9 28.2 16.4C29.3 16.9 29.6 17.2 29.6 17.7C29.6 18.4 28.8 18.7 28 18.7C26.8 18.7 25.5 18.3 24.5 17.7L24.1 20.1C25.2 20.6 26.4 20.9 27.6 20.9C30.3 20.9 32.2 19.6 32.2 17.5C32.2 14.9 28.5 14.8 28.5 13.5ZM41 22H38.8L37.2 10H35C34.4 10 33.9 10.4 33.7 10.9L29.8 22H32.4L32.9 20.6H36L36.3 22H41ZM33.6 18.5L35.1 13.8L35.7 18.5H33.6Z"
                    fill="white"
                />
            </svg>
        ),
        mastercard: (
            <svg
                className={className}
                viewBox="0 0 48 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="48" height="32" rx="4" fill="#EB001B" />
                <rect x="28" width="20" height="32" rx="4" fill="#F79E1B" />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M24 8C19.8 8 16.1 10.3 14 13.5C15.6 15.4 16.5 17.9 16.5 20.5C16.5 23.1 15.6 25.6 14 27.5C16.1 30.7 19.8 33 24 33C28.2 33 31.9 30.7 34 27.5C32.4 25.6 31.5 23.1 31.5 20.5C31.5 17.9 32.4 15.4 34 13.5C31.9 10.3 28.2 8 24 8Z"
                    fill="#FF5F00"
                />
            </svg>
        ),
        amex: (
            <svg
                className={className}
                viewBox="0 0 48 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect width="48" height="32" rx="4" fill="#006FCF" />
                <path
                    d="M8 12H12L13.5 15L15 12H19V20H16V14.5L14.2 18H12.8L11 14.5V20H8V12ZM20 12H28V14H23V15H28V17H23V18H28V20H20V12ZM29 12H33L34.5 15L36 12H40V20H37V14.5L35.2 18H33.8L32 14.5V20H29V12Z"
                    fill="white"
                />
            </svg>
        ),
    };

    return logos[cardType as Exclude<CardType, 'unknown'>] || null;
};
