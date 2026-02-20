import type { MenuItem } from '../types';

export const DEFAULT_MENU_ITEMS: Partial<MenuItem>[] = [
    // Milk Shake & Ice Cream
    { name: 'Vennila', price: 75, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Strawberry', price: 75, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Chocolate', price: 80, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Butter Scotch', price: 80, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Pista', price: 80, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Spanish Delite', price: 80, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Black Current', price: 80, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Cherry', price: 80, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Cashew', price: 90, category: 'Milk Shake & Ice Cream', isVeg: true },
    { name: 'Fig Fruit', price: 100, category: 'Milk Shake & Ice Cream', isVeg: true },

    // Falooda
    { name: 'Royal Falooda', price: 150, category: 'Falooda', isVeg: true },
    { name: 'MGS Special Falooda', price: 210, category: 'Falooda', isVeg: true },

    // Fresh Limes
    { name: 'Fresh Limes', price: 20, category: 'Fresh Limes', isVeg: true },
    { name: 'Soda Limes', price: 25, category: 'Fresh Limes', isVeg: true },

    // Dinner
    { name: 'Parotta', price: 15, category: 'Dinner', isVeg: true },
    { name: 'Chicken Kaima Parotta', price: 170, category: 'Dinner', isVeg: false },
    { name: 'Mutton Kaima Parotta', price: 180, category: 'Dinner', isVeg: false },
    { name: 'Idiyappam / Paya', price: 80, category: 'Dinner', isVeg: false },

    // Fried Rice
    { name: 'Veg Fried Rice', price: 80, category: 'Fried Rice', isVeg: true },
    { name: 'Chicken Fried Rice', price: 120, category: 'Fried Rice', isVeg: false },
];

export const RESTAURANT_SETTINGS = {
    NAME: "Mom's Kitchen Restaurant",
    LOGO_TEXT: 'MK'
};
