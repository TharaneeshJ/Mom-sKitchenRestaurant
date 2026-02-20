import React from 'react';
import type { MenuItem } from '../../types';

interface MenuItemCardProps {
    item: MenuItem;
    quantity: number;
    onIncrement: (item: MenuItem) => void;
    onDecrement: (item: MenuItem) => void;
}

const getCategoryIcon = (category: string) => {
    if (category.includes('Ice Cream') || category.includes('Shake')) return '🥤';
    if (category.includes('Falooda')) return '🍧';
    if (category.includes('Limes')) return '🍋';
    if (category.includes('Mutton')) return '🍖';
    if (category.includes('Fish') || category.includes('Prawns')) return '🐟';
    if (category.includes('Chicken')) return '🍗';
    if (category.includes('Rice')) return '🍚';
    if (category.includes('Noodles')) return '🍝';
    if (category.includes('Chinese')) return '🥢';
    if (category.includes('Dinner')) return '🍽️';
    return '🥘';
};

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
    item,
    quantity,
    onIncrement,
    onDecrement
}) => {
    const icon = getCategoryIcon(item.category);

    return (
        <div className="bg-[#fcfbf9] rounded-xl border border-[#e7e5e4] p-4 flex flex-col h-full hover:border-[#a8a29e] transition-all duration-300 group relative shadow-sm hover:shadow-lg hover:-translate-y-0.5">

            {/* Image/Icon Area - Elegant & Minimal */}
            <div className="h-28 w-full bg-[#f5f5f4] rounded-lg flex items-center justify-center mb-4 transition-colors group-hover:bg-[#e7e5e4] duration-300 overflow-hidden relative">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <span className="text-4xl transform transition-transform duration-500 group-hover:scale-110 drop-shadow-md select-none">{icon}</span>
                )}

                {quantity > 0 && (
                    <div className="absolute top-3 right-3 bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-wide">
                        {quantity} IN CART
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#a8a29e]">{item.category}</p>
                    {item.category.includes('Special') && <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>}
                </div>

                <h3 className="font-serif text-lg font-medium text-[#1c1917] mb-2 leading-tight tracking-tight group-hover:text-brand-primary transition-colors line-clamp-2">{item.name}</h3>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#f5f5f4]">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-[#a8a29e] uppercase font-bold tracking-wider mb-0.5">Price</span>
                        <span className="font-serif font-bold text-[#1c1917] text-lg">₹{item.price}</span>
                    </div>

                    {quantity === 0 ? (
                        <button
                            onClick={() => onIncrement(item)}
                            className="px-4 py-2 bg-white border border-[#e7e5e4] text-[#1c1917] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all active:scale-95 hover:bg-[#1c1917] hover:text-white hover:border-[#1c1917] shadow-sm"
                        >
                            Add
                        </button>
                    ) : (
                        <div className="flex items-center gap-1 bg-white border border-[#e7e5e4] rounded-lg p-0.5 shadow-sm">
                            <button
                                onClick={() => onDecrement(item)}
                                className="w-7 h-7 flex items-center justify-center text-[#1c1917] hover:bg-gray-100 rounded transition-colors"
                            >
                                <span className="text-lg mb-1">−</span>
                            </button>
                            <span className="text-xs font-bold text-[#1c1917] min-w-[20px] text-center tabular-nums">
                                {quantity}
                            </span>
                            <button
                                onClick={() => onIncrement(item)}
                                className="w-7 h-7 flex items-center justify-center text-[#1c1917] hover:bg-gray-100 rounded transition-colors"
                            >
                                <span className="text-lg mb-1">+</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
