import type { NavItem } from "../../types";

interface NavItemComponentProps {
    item: NavItem;
    onClick?: (itemId: string) => void;
}

const NavItemComponent = ({ item, onClick }: NavItemComponentProps) => {
    return (
        <a
            href={item.href}
            onClick={(e) => {
                e.preventDefault();
                onClick?.(item.id);
            }}
            className={`flex flex-col items-center gap-1 relative ${item.active
                ? "text-sunset-orange"
                : "text-slate-400 dark:text-slate-500"
                }`}
        >
            <span
                className={`material-symbols-outlined text-2xl ${item.active ? "fill-icon" : ""
                    }`}
            >
                {item.icon}
            </span>
            <span className="text-[10px] font-bold">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 size-4 bg-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                    {item.badge}
                </span>
            )}
        </a>
    );
};

interface BottomNavigationProps {
    items: NavItem[];
    onNavItemClick?: (itemId: string) => void;
}

export const BottomNavigation = ({
    items,
    onNavItemClick,
}: BottomNavigationProps) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-orange-100 px-8 pb-6 pt-3 z-50">
            <div className="flex items-center justify-around max-w-md mx-auto">
                {items.map((item) => (
                    <NavItemComponent
                        key={item.id}
                        item={item}
                        onClick={onNavItemClick}
                    />
                ))}
            </div>
            <div className="h-1 w-32 bg-slate-200 dark:bg-slate-700 mx-auto mt-4 rounded-full opacity-20" />
        </nav>
    );
};
