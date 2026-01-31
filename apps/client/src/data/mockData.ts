import type { Product, NavItem } from "../types";

export const mockProducts: Product[] = [
    {
        id: "1",
        name: "Minimalist Ceramic Vase",
        price: 45.0,
        category: "Decor",
        description: "Elegant ceramic vase with a minimalist design. Perfect for modern interiors and fresh flowers. Handcrafted with premium materials.",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuC7b6VEVK61Waw0U5jgbXDOKGZMOKGOTZ8LRfu7VkAKSBy_hz7En3OkNwgI_djvJPT6nKDs4lb_oagbKLKIpVHmUHBtZ6BG0SoNiRVU4PdkYM0UnpCqzcY8zuW9_oAkLeRS3mva9nnDTKCO7goseD5CAal0EAFNSPUuOUZ2vkont-MQ644EJ4ODI7IuzjBR0z9M181fzahZfbgyC4ZMOUSmf5cpuo-LEmlgZELa9MDIM2x1HgRVy6yXJghtxaHUf7JitnRLLM1zmcQ",
        stock: 12,
    },
    {
        id: "2",
        name: "Terracotta Planter",
        price: 32.0,
        category: "Ceramic",
        description: "Classic terracotta planter with natural finish. Excellent drainage for your favorite plants. Timeless design that complements any space.",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuD43RWAPItmnxRvRxr0joW6QXTGMDLd3hZScSEunAj2Fn3nwbgJ_X7rTGR2AkkzmsuetkSnywdq78q1w8nrCbGv3T5RwimVDL30SNnxl3w0q2E0gCpUxa37rnq7TQDeh86S4g0k8Hc8O9wLwZmhAf32CGPGO74bwDl4NHLvjyQ8mXkNdCowg9FBrxJqmTUgHGGoZBtLHYzNbig4YiIrvvxDCJATixs9MIprHdI98DCzeAwEtP6e437SW4kpSOntqm5Dt20QomiB8rE",
        stock: 8,
    },
    {
        id: "3",
        name: "Oak Coffee Table",
        price: 285.0,
        category: "Wood",
        description: "Solid oak coffee table with natural wood grain. Durable construction and elegant finish. A centerpiece for your living room that will last for years.",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBT_tMnnH9GnoNKrSwKnvILRxnk2IGbvP_PN4pRVVxW3b9yYq-OrHs0qUrwfBgVjn5Rq5Gj-TKV__jiFA3mjcjc4lGOoevmDwBy0NBJCFj8fbG0QU89aSOLhJapa5KZCLunlHyvfNGnfTa6LCvLWDJghpFCy2NL0lzODkYP5qtBdhFrArBu5IFTSx2XRFQk4lh3Sz5iXSLRDMR3dfK9GsLkYj1lLKpAx3EQeqHrdB6y6eB8RylSBZB_WLbCZYqnXcyPMooMfNQ7T0E",
        stock: 3,
    },
    {
        id: "4",
        name: "Woven Wall Hanging",
        price: 78.0,
        category: "Textile",
        description: "Handwoven wall hanging made with natural fibers. Bohemian style adds warmth and texture to any room. Each piece is unique and artisan-made.",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDXTbq3nsIYi2W8c71HanuQgn4XYXJ4zk8DLoE5fI6CGX2kkx6oI56LDeDpD9EX8neUSakq118X6BMQQtm4gRBPC8azrne57mPTL7Ix3AdBB2rYYMhEX2ADmtuADC1cusQ5RNotOH94meBnulIS0WI9YeIhfuCu38GBcNayMIq83oUS3XxWxTOZhcwc8pccEQ7vqlrvQH9PQsmeTTsjU83KjWrRD21euo-xi716_QBihHmtQH3Pb56GtaiBrI06D-9gGczDXrgLfV0",
        stock: 15,
    },
    {
        id: "5",
        name: "Modern Table Lamp",
        price: 120.0,
        category: "Light",
        description: "Contemporary table lamp with adjustable brightness. Energy-efficient LED technology. Sleek design perfect for desks and bedside tables.",
        imageUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuC2T7BnulOmEqwWldcgKCUobULCqzWNc8ydjM30cdP_HbvOLg8_dGZWF1PjGUrPXSsXRfmeE96DrS5wNVL1Ois4gHrhQ4wD39AtIKUsxa4SRZYA_gSe9GBdvsZgs3fcDJZmuoM7rJf1kOsyGYR-L4vpGmoNZo4fLUrgFB_njUukeER7hVu0qain8TC1BodRx3MnXErtnaHmJiOHHR-vcF3sArF9KNIF346vWX_BZMToFPBgzexnC5By2JQKMcl8zZY5dDNJcAGb7RA",
        stock: 0,
    },
];

export const mockNavItems: NavItem[] = [
    {
        id: "Tienda",
        label: "Tienda",
        icon: "storefront",
        href: "#",
        active: true,
    },
    {
        id: "Carrito",
        label: "Carrito",
        icon: "shopping_cart",
        href: "#",
        badge: 3,
    },
];
