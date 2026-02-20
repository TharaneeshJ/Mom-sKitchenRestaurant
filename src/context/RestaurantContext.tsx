import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Order, OrderStatus, MenuItem } from '../types';
import { supabase } from '../api/supabase';
import { DEFAULT_MENU_ITEMS } from '../config/constants';

interface RestaurantContextType {
    orders: Order[];
    menuItems: MenuItem[];
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    addOrder: (order: Order) => void;
    getOrdersByStatus: (status: OrderStatus[]) => Order[];
    addMenuItem: (item: MenuItem) => Promise<void>;
    updateMenuItem: (item: MenuItem) => Promise<void>;
    deleteMenuItem: (id: string) => Promise<void>;
    seedDefaultMenu: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    // Load orders from Supabase
    const loadOrders = async () => {
        try {
            // Fetch orders with their items
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedOrders: Order[] = data.map((o: any) => ({
                    id: o.id,
                    tableId: o.table_id,
                    items: (o.order_items || []).map((item: any) => ({
                        id: (item.id || Math.random()).toString(),
                        name: item.item_name || 'Unknown Item',
                        quantity: item.quantity || 0,
                        price: item.price_at_order || 0
                    })),
                    status: (o.status || 'PENDING').toLowerCase() as OrderStatus,
                    totalAmount: o.total_amount || 0,
                    timestamp: o.created_at ? new Date(o.created_at) : new Date(),
                    customerName: o.customer_name || 'Guest',
                    paymentMethod: o.payment_method || 'CASH'
                }));
                setOrders(mappedOrders);
            }
        } catch (e) {
            console.error("Failed to sync orders from Supabase", e);
        }
    };

    const loadMenu = async () => {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedMenu: MenuItem[] = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    price: parseFloat(item.price),
                    category: item.category,
                    image: item.image,
                    isVeg: item.is_veg
                }));
                setMenuItems(mappedMenu);
            }
        } catch (e) {
            console.error("Failed to load menu from Supabase", e);
        }
    };

    useEffect(() => {
        loadOrders();
        loadMenu();

        // Real-time subscriptions - Fixed with schema property
        // Real-time subscriptions - Fixed with schema property
        const ordersSubscription = supabase
            .channel('orders-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                // Handle different events more granually if needed, but reloading is safest for consistency
                if (payload.eventType === 'UPDATE') {
                    setOrders(prev => prev.map(o =>
                        o.id === payload.new.id ? {
                            ...o,
                            status: payload.new.status.toLowerCase() as OrderStatus,
                            customerName: payload.new.customer_name || 'Guest',
                            paymentMethod: payload.new.payment_method
                        } : o
                    ));
                } else {
                    loadOrders();
                }
            })
            .subscribe();

        const menuSubscription = supabase
            .channel('menu-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => loadMenu())
            .subscribe();

        // Polling fallback to ensure data consistency
        const intervalId = setInterval(() => {
            loadOrders();
        }, 5000); // Poll every 5 seconds

        return () => {
            supabase.removeChannel(ordersSubscription);
            supabase.removeChannel(menuSubscription);
            clearInterval(intervalId);
        };
    }, []);

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            // Optimistic update
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status } : o
            ));

            const { error } = await supabase
                .from('orders')
                .update({ status: status.toUpperCase() })
                .eq('id', orderId);

            if (error) {
                // Revert on error
                console.error("Failed to update status in Supabase", error);
                await loadOrders(); // Re-fetch to true state
                throw error;
            }
        } catch (e) {
            console.error("Failed to update status in Supabase", e);
        }
    };

    const addOrder = (order: Order) => {
        setOrders((prev) => [order, ...prev]);
    };

    const getOrdersByStatus = (statuses: OrderStatus[]) => {
        return orders.filter((order) => statuses.includes(order.status));
    };

    const addMenuItem = async (item: MenuItem) => {
        try {
            const { error } = await supabase
                .from('menu_items')
                .insert([{
                    name: item.name,
                    price: item.price,
                    category: item.category,
                    image: item.image,
                    is_veg: item.isVeg
                }]);

            if (error) throw error;
        } catch (e) {
            console.error("Failed to add menu item to Supabase", e);
            throw e; // Re-throw to be caught by the UI
        }
    };

    const updateMenuItem = async (item: MenuItem) => {
        try {
            const { error } = await supabase
                .from('menu_items')
                .update({
                    name: item.name,
                    price: item.price,
                    category: item.category,
                    image: item.image,
                    is_veg: item.isVeg
                })
                .eq('id', item.id);

            if (error) throw error;
        } catch (e) {
            console.error("Failed to update menu item in Supabase", e);
            throw e; // Re-throw to be caught by the UI
        }
    };

    const deleteMenuItem = async (id: string) => {
        try {
            const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            console.error("Failed to delete menu item from Supabase", e);
        }
    };

    const seedDefaultMenu = async () => {
        try {
            const itemsToInsert = DEFAULT_MENU_ITEMS.map(item => ({
                name: item.name,
                price: item.price,
                category: item.category,
                image: item.image || '',
                is_veg: item.isVeg
            }));

            const { error } = await supabase
                .from('menu_items')
                .insert(itemsToInsert);

            if (error) throw error;
            // Real-time subscription will trigger a reload
        } catch (e) {
            console.error("Failed to seed default menu", e);
            throw e;
        }
    };

    return (
        <RestaurantContext.Provider value={{
            orders,
            menuItems,
            updateOrderStatus,
            addOrder,
            getOrdersByStatus,
            addMenuItem,
            updateMenuItem,
            deleteMenuItem,
            seedDefaultMenu
        }}>
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurant = () => {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
};
