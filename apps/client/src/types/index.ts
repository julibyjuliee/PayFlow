export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl: string;
    stock: number;
    description?: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
}

export interface NavItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    badge?: number;
    active?: boolean;
}
