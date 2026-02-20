import React, { useState, useMemo, useCallback, useEffect } from 'react';

import type { MenuItem, OrderPayload, OrderResponse } from '../types';
import { submitOrder } from './services/orderService';
import { supabase } from '../api/supabase';
import { MenuItemCard } from './components/MenuItemCard';
import { CartSidebar } from './components/CartSidebar';
import { CategoryFilter } from './components/CategoryFilter';
import { OrderTracker } from './components/OrderTracker';

// Success Modal
const SuccessModal: React.FC<{ response: OrderResponse; onClose: () => void }> = ({ response, onClose }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-primary"></div>

            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>

            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2 tracking-tight">Order Placed Successfully!</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
                Your food is being prepared with love. <br />
                Order ID: <span className="font-mono font-bold text-brand-primary bg-brand-background px-2 py-0.5 rounded-md">{response.order_id}</span>
            </p>

            <div className="bg-brand-background/50 rounded-2xl p-5 mb-8 text-left text-sm border border-brand-border/30">
                <div className="flex justify-between mb-3 items-center">
                    <span className="text-brand-muted font-medium">Table Number</span>
                    <span className="font-bold text-brand-text bg-white px-3 py-1 rounded-lg border border-brand-border/50 shadow-sm">{response.table}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-brand-border/30">
                    <span className="text-brand-muted font-medium">Total Amount</span>
                    <span className="font-black text-brand-primary text-2xl font-mono tracking-tighter">₹{response.total}</span>
                </div>
            </div>

            <button
                onClick={onClose}
                className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-brand-primary/90 transition-all active:scale-[0.98] shadow-xl shadow-black/10 uppercase tracking-widest text-xs"
            >
                Track Your Order
            </button>
        </div>
    </div>
);

export const CustomerPortal: React.FC = () => {
    const [showTracker, setShowTracker] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [cart, setCart] = useState<Record<string, number>>({});
    const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
    const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showMobileCart, setShowMobileCart] = useState<boolean>(false);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');

    // Menu State
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Customer State
    const [customerName, setCustomerName] = useState<string>('');
    const [customerMobile, setCustomerMobile] = useState<string>('');

    // Initialize Menu from Supabase
    useEffect(() => {
        const loadMenu = async () => {
            try {
                const { data, error } = await supabase
                    .from('menu_items')
                    .select('*')
                    .order('name');

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
            } catch (err) {
                console.error('Failed to load menu from Supabase', err);
            }
        };

        loadMenu();

        // Real-time menu updates
        const subscription = supabase
            .channel('public:menu_items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
                loadMenu();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    // Derived State
    const { totalItems, totalPrice, orderItems } = useMemo(() => {
        let count = 0;
        let price = 0;
        const items = [];

        for (const [id, qtyValue] of Object.entries(cart)) {
            const qty = qtyValue as number;
            if (qty > 0) {
                const item = menuItems.find((i) => i.id === id);
                if (item) {
                    count += qty;
                    price += item.price * qty;
                    items.push({ name: item.name, price: item.price, qty });
                }
            }
        }
        return { totalItems: count, totalPrice: price, orderItems: items };
    }, [cart, menuItems]);

    // Handlers
    const handleIncrement = useCallback((item: MenuItem) => {
        setCart((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    }, []);

    const handleDecrement = useCallback((item: MenuItem) => {
        setCart((prev) => {
            const currentQty = prev[item.id] || 0;
            if (currentQty <= 0) return prev;
            const newCart = { ...prev, [item.id]: currentQty - 1 };
            if (newCart[item.id] === 0) delete newCart[item.id];
            return newCart;
        });
    }, []);

    const handlePlaceOrder = async () => {
        if (!selectedTable) {
            setError('Please select a table number first.');
            setShowMobileCart(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (totalItems === 0) {
            setError('Your cart is empty.');
            return;
        }

        setIsPlacingOrder(true);
        setError(null);

        const payload: OrderPayload = {
            table: selectedTable,
            items: orderItems,
            payment_method: paymentMethod,
            customer_name: customerName,
            customer_mobile: customerMobile
        };

        try {
            const response = await submitOrder(payload);
            setOrderResult(response);
            setShowMobileCart(false); // Close mobile cart on success
        } catch (err) {
            setError('Failed to place order. Try again.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleOrderSuccessClose = () => {
        setCart({});
        setCustomerName('');
        setCustomerMobile('');
        setOrderResult(null);
        setError(null);
        setShowMobileCart(false);
        setShowTracker(true); // Auto open tracker after order
    };

    const handleIncrementByName = (itemName: string) => {
        const item = menuItems.find(i => i.name === itemName);
        if (item) handleIncrement(item);
    };

    const handleDecrementByName = (itemName: string) => {
        const item = menuItems.find(i => i.name === itemName);
        if (item) handleDecrement(item);
    };

    // Filter Items
    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchTerm, menuItems]);

    // If Tracker Mode is active
    if (showTracker) {
        return (
            <div className="min-h-screen bg-brand-background">
                <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-border/50 shadow-sm p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-xl font-serif font-bold text-white">MK</span>
                        </div>
                        <span className="font-serif font-bold text-lg text-brand-text">Mom's Kitchen Restaurant</span>
                    </div>
                    <button
                        onClick={() => setShowTracker(false)}
                        className="text-sm font-bold text-brand-primary border border-brand-primary px-4 py-2 rounded-lg hover:bg-brand-primary/5 transition-colors"
                    >
                        Back to Menu
                    </button>
                </nav>
                <OrderTracker />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-background text-brand-text font-sans selection:bg-brand-primary selection:text-white relative transition-colors duration-300">
            {/* Background Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
            </div>

            {/* Top Navbar */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-border/50 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-row items-center justify-between gap-3 md:gap-6">

                    {/* Logo */}
                    <div className="flex items-center gap-2 group cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-primary rounded-lg flex items-center justify-center shadow-sm transform group-hover:rotate-6 transition-transform duration-300">
                            <span className="text-xl md:text-2xl font-serif font-bold text-white">MK</span>
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <h1 className="text-base md:text-xl font-serif font-bold text-brand-text leading-none tracking-tight">Mom's Kitchen</h1>
                            <span className="text-[10px] text-brand-secondary font-medium tracking-wide uppercase">Authentic Taste</span>
                        </div>
                    </div>

                    {/* Search Bar - Center */}
                    <div className="flex-1 max-w-xl group relative">
                        <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none text-brand-muted group-focus-within:text-black transition-colors">
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-brand-background/40 border border-brand-border/60 rounded-xl md:rounded-2xl py-2 md:py-3 pl-9 md:pl-12 pr-4 text-xs md:text-sm text-brand-text focus:ring-1 focus:ring-black focus:border-black focus:bg-white shadow-sm transition-all duration-200 outline-none placeholder:text-brand-muted/60"
                        />
                    </div>

                    {/* Track Orders Button */}
                    <button
                        onClick={() => setShowTracker(true)}
                        className="bg-black text-white p-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-brand-primary/90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-black/5 shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                            <line x1="6" y1="17" x2="18" y2="17" />
                        </svg>
                        <span className="hidden md:inline">Track Orders</span>
                    </button>
                </div>
            </nav>

            <main className={`max-w-7xl mx-auto p-4 md:p-8 ${totalItems > 0 && !showMobileCart ? 'pb-20 lg:pb-8' : ''}`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Main Content (Menu) */}
                    <div className="lg:col-span-7 xl:col-span-8 min-w-0">

                        {/* Hero Banner - Minimal */}
                        <div className="relative rounded-2xl overflow-hidden mb-10 group bg-brand-primary">
                            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 0h2v2H5V1zm4 0h2v2H9V1z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

                            <div className="relative z-10 px-6 py-10 md:py-16 md:px-12 flex flex-col items-start gap-4">
                                <span className="inline-block border border-white/20 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-sm backdrop-blur-sm">
                                    Authentic South Indian
                                </span>
                                <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black text-white leading-[1.1] max-w-2xl">
                                    Experience the <br /> <span className="opacity-80 italic font-medium">Taste of Tradition.</span>
                                </h2>
                                <p className="text-white/70 mb-6 text-xs md:text-base font-light max-w-md leading-relaxed">
                                    Handcrafted parottas, spicy curries, and aromatic biryanis prepared with love and authentic spices.
                                </p>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('menu-section');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="bg-white text-brand-primary px-8 md:px-10 py-3.5 md:py-4 rounded-2xl text-[10px] md:text-[11px] font-black hover:bg-brand-background transition-all shadow-xl shadow-black/10 active:scale-95 uppercase tracking-[0.2em]"
                                >
                                    View Menu
                                </button>
                            </div>

                            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border border-white/5 pointer-events-none"></div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-pulse">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Category Filter */}
                        <div id="menu-section" className="scroll-mt-28">
                            <CategoryFilter
                                categories={Array.from(new Set(menuItems.map(i => i.category)))}
                                activeCategory={activeCategory}
                                onSelectCategory={setActiveCategory}
                            />
                        </div>

                        {/* Products Grid */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                                    {activeCategory === 'All' ? 'Popular Dishes' : activeCategory}
                                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{filteredItems.length}</span>
                                </h3>
                            </div>

                            {filteredItems.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-lg">No items found matching your search.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                    {filteredItems.map(item => (
                                        <MenuItemCard
                                            key={item.id}
                                            item={item}
                                            quantity={cart[item.id] || 0}
                                            onIncrement={handleIncrement}
                                            onDecrement={handleDecrement}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Sidebar (Cart) */}
                    <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-24">
                        <CartSidebar
                            items={orderItems}
                            totalPrice={totalPrice}
                            table={selectedTable}
                            onPlaceOrder={handlePlaceOrder}
                            isOrdering={isPlacingOrder}
                            paymentMethod={paymentMethod}
                            onPaymentMethodChange={setPaymentMethod}
                            onTableChange={(t) => { setSelectedTable(t); setError(null); }}
                            onIncrement={handleIncrementByName}
                            onDecrement={handleDecrementByName}
                            customerName={customerName}
                            customerMobile={customerMobile}
                            onNameChange={setCustomerName}
                            onMobileChange={setCustomerMobile}
                        />
                    </aside>

                </div>
            </main>

            {/* Mobile Sticky Cart Summary */}
            {totalItems > 0 && !showMobileCart && (
                <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
                    <div
                        className="bg-white text-brand-text rounded-2xl shadow-float p-4 flex items-center justify-between border border-brand-border/50 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500"
                        onClick={() => setShowMobileCart(true)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center font-bold">
                                {totalItems}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Total</span>
                                <span className="font-bold text-lg leading-none">₹{totalPrice}</span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMobileCart(true); }}
                            className="bg-brand-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-black active:scale-95 transition-all text-sm uppercase tracking-wide"
                        >
                            View Cart
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Cart Modal/Sheet */}
            {showMobileCart && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowMobileCart(false)}
                    ></div>

                    <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col h-full border-t border-brand-border/20">
                            <CartSidebar
                                items={orderItems}
                                totalPrice={totalPrice}
                                table={selectedTable}
                                onPlaceOrder={handlePlaceOrder}
                                isOrdering={isPlacingOrder}
                                paymentMethod={paymentMethod}
                                onPaymentMethodChange={setPaymentMethod}
                                onTableChange={(t) => { setSelectedTable(t); setError(null); }}
                                onIncrement={handleIncrementByName}
                                onDecrement={handleDecrementByName}
                                customerName={customerName}
                                customerMobile={customerMobile}
                                onNameChange={setCustomerName}
                                onMobileChange={setCustomerMobile}
                                onClose={() => setShowMobileCart(false)}
                                className="border-none shadow-none rounded-none h-full bg-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {orderResult && (
                <SuccessModal response={orderResult} onClose={handleOrderSuccessClose} />
            )}
        </div>
    );
};
