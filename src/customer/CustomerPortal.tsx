import React, { useState, useMemo, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';

import type { MenuItem, OrderPayload, OrderResponse, PaymentStatus } from '../types';
import { submitOrder, updatePaymentStatus, cancelOrder } from './services/orderService';
import { supabase } from '../api/supabase';
import { MenuItemCard } from './components/MenuItemCard';
import { CartModal } from './components/CartModal';
import { CategoryFilter } from './components/CategoryFilter';
import { OrderTracker } from './components/OrderTracker';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

// Success/Payment Modal
const SuccessModal: React.FC<{
    response: OrderResponse;
    onClose: () => void;
    onPaymentSuccess: (status: PaymentStatus) => void;
    onCancel: () => void;
}> = ({ response, onClose, onPaymentSuccess, onCancel }) => {
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [isCancelling, setIsCancelling] = React.useState(false);
    const isUPI = response.payment_method?.toLowerCase() === 'upi';
    const isPaid = response.payment_status === 'PAID';

    const upiId = "momskitchen@okaxis";
    const upiLink = `upi://pay?pa=${upiId}&pn=MomsKitchen&am=${response.total}&cu=INR`;

    useEffect(() => {
        // Trigger confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#FFC107', '#FF9800', '#FF5722', '#4CAF50', '#2196F3']
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#FFC107', '#FF9800', '#FF5722', '#4CAF50', '#2196F3']
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const handleConfirmPayment = async () => {
        setIsUpdating(true);
        const success = await updatePaymentStatus(response.order_id, 'PAID');
        if (success) {
            onPaymentSuccess('PAID');
        }
        setIsUpdating(false);
    };

    const handleCancelOrder = async () => {
        setIsCancelling(true);
        const success = await cancelOrder(response.order_id);
        if (success) {
            onCancel();
        } else {
            // Even if DB delete fails (already deleted or network issue), 
            // we should let user go back if they want.
            onCancel();
        }
        setIsCancelling(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] max-w-sm w-full text-center relative border border-gray-100"
                >
                    {(!isUPI || isPaid) ? (
                        <>
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <motion.svg
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                </motion.svg>
                            </div>
                            <h2 className="text-3xl font-serif font-black text-gray-900 mb-3 tracking-tight">Order Placed</h2>
                            <p className="text-gray-400 text-sm font-medium leading-relaxed mb-10">
                                Your delicious meal is being prepared. <br />
                                <span className="text-[10px] uppercase tracking-widest text-gray-300 block mt-4">Order ID: {response.order_id}</span>
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mb-10">
                                <h1 className="text-2xl font-serif font-black text-gray-900 mb-1">Make Payment</h1>
                                <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.4em]">Scan QR Code to Pay</p>
                            </div>

                            <div className="mb-10 relative inline-block p-4 rounded-[2rem] bg-gray-50/50 border border-gray-100">
                                <QRCodeSVG value={upiLink} size={180} />
                            </div>

                            <div className="md:hidden mb-8">
                                <a
                                    href={upiLink}
                                    className="inline-flex items-center gap-2 text-[11px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/5 px-6 py-3 rounded-full hover:bg-brand-primary/10 transition-all active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    Open UPI App
                                </a>
                            </div>
                        </>
                    )}

                    <div className="space-y-4 mb-10 pb-6 border-b border-gray-50">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Table Number</span>
                            <span className="text-sm font-black text-gray-900 font-serif">#{response.table}</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
                            <span className="text-xl font-black text-brand-primary font-serif tracking-tighter">₹{response.total}</span>
                        </div>
                    </div>

                    {isUPI && !isPaid ? (
                        <div className="flex flex-col gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConfirmPayment}
                                disabled={isUpdating}
                                className="w-full bg-brand-primary text-white font-black py-5 rounded-[1.5rem] shadow-[0_20px_40px_-12px_rgba(var(--brand-primary-rgb),0.3)] hover:bg-black transition-all uppercase tracking-[0.25em] text-[11px] disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {isUpdating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {isUpdating ? 'Verifying...' : 'Paid - Confirm Now'}
                            </motion.button>

                            <motion.button
                                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCancelOrder}
                                disabled={isCancelling || isUpdating}
                                className="w-full bg-gray-50 text-gray-400 font-black py-4 rounded-[1.25rem] border border-gray-100/50 hover:text-red-500 hover:border-red-100 transition-all uppercase tracking-[0.2em] text-[9px] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCancelling ? (
                                    <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                {isCancelling ? 'Cancelling...' : 'Cancel & Pay later via Cash'}
                            </motion.button>
                        </div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="w-full bg-black text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-black/10 hover:bg-brand-primary transition-all uppercase tracking-[0.25em] text-[11px]"
                        >
                            Track Order Tracking
                        </motion.button>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const CustomerPortal: React.FC = () => {
    const [showTracker, setShowTracker] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [cart, setCart] = useState<Record<string, number>>({});
    const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
    const [orderResult, setOrderResult] = useState<OrderResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

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
                    items.push({ name: item.name, price: item.price, qty, image: item.image, category: item.category });
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
            setIsCartOpen(false);
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
            setIsCartOpen(false); // Close cart on success
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
        setIsCartOpen(false);
        setShowTracker(true); // Auto open tracker after order
    };

    const handlePaymentUpdate = (status: PaymentStatus) => {
        if (orderResult) {
            setOrderResult({ ...orderResult, payment_status: status });
        }
    };

    const handleOrderCancel = () => {
        setOrderResult(null);
        setError(null);
        setIsCartOpen(true); // Re-open cart so they can edit or try again
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

                    <div className="flex items-center gap-2">
                        {/* Cart Button */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative bg-brand-background border border-brand-border/60 p-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl text-brand-text hover:bg-white hover:border-black/20 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            <span className="hidden md:inline font-bold text-sm">Cart</span>
                            {totalItems > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-300">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        {/* Track Orders Button */}
                        <button
                            onClick={() => setShowTracker(true)}
                            className="bg-black text-white p-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-brand-primary/90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-black/5 shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                                <line x1="6" y1="17" x2="18" y2="17" />
                            </svg>
                            <span className="hidden md:inline">Track</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className={`max-w-7xl mx-auto p-4 md:p-8 ${totalItems > 0 && !isCartOpen ? 'pb-20 lg:pb-8' : ''}`}>
                <div className="w-full">
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
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
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
            </main>

            {/* Cart Modal - Popup Card */}
            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
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

            {/* Success Modal */}
            {orderResult && (
                <SuccessModal
                    response={orderResult}
                    onClose={handleOrderSuccessClose}
                    onPaymentSuccess={handlePaymentUpdate}
                    onCancel={handleOrderCancel}
                />
            )}
        </div>
    );
};
