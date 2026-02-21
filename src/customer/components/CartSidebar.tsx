import React from 'react';
import type { OrderItemPayload } from '../../types';
import { TableSelector } from './TableSelector';
import { motion, AnimatePresence } from 'framer-motion';

interface CartSidebarProps {
    items: OrderItemPayload[];
    totalPrice: number;
    table: string;
    onPlaceOrder: () => void;
    isOrdering: boolean;
    paymentMethod: string;
    onPaymentMethodChange: (method: string) => void;
    onTableChange: (table: string) => void;
    onIncrement: (itemName: string) => void;
    onDecrement: (itemName: string) => void;
    customerName: string;
    customerMobile: string;
    onNameChange: (name: string) => void;
    onMobileChange: (mobile: string) => void;
    onClose?: () => void;
    className?: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
    items,
    totalPrice,
    table,
    onPlaceOrder,
    isOrdering,
    paymentMethod,
    onPaymentMethodChange,
    onTableChange,
    onIncrement,
    onDecrement,
    customerName,
    customerMobile,
    onNameChange,
    onMobileChange,
    onClose,
    className = ''
}) => {
    const finalTotal = totalPrice; // Assuming price includes GST for display simplicity

    return (
        <div className={`bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col h-fit ${className}`}>
            {/* Header */}
            <div className="p-5 md:p-6 border-b border-gray-50 flex justify-between items-center bg-white">
                <div>
                    <h2 className="text-2xl font-serif font-black text-gray-900 tracking-tight">My Cart</h2>
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mt-1">
                        {items.length} {items.length === 1 ? 'Item' : 'Items'} Selected
                    </p>
                </div>
                {onClose && (
                    <motion.button
                        whileHover={{ rotate: 90, scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.button>
                )}
            </div>

            <div className="p-5 md:p-6 flex-1 space-y-8">
                {/* Cart Items */}
                <div>
                    {items.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                            </div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Cart is Empty</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {items.map((item, idx) => (
                                    <motion.div
                                        key={`${item.name}-${idx}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex items-center gap-5 group py-2"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                                                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                                                    <path d="M7 2v20"></path>
                                                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-black text-gray-900 text-sm tracking-tight line-clamp-1">{item.name}</h4>
                                                <span className="font-black text-brand-primary text-[15px] font-serif tracking-tight ml-4">₹{item.price * item.qty}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] font-serif">₹{item.price}</span>
                                                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 gap-3">
                                                    <button onClick={() => onDecrement(item.name)} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 transition-colors"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
                                                    <span className="text-[10px] font-black text-gray-900 min-w-[12px] text-center">{item.qty}</span>
                                                    <button onClick={() => onIncrement(item.name)} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-brand-primary transition-colors"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Details Sections */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Dining Info</p>
                        <div className="bg-gray-50/50 p-5 rounded-[1.5rem] border border-gray-100 space-y-5">
                            <div>
                                <label className="block text-[9px] font-black text-gray-300 uppercase tracking-widest mb-3">Dining Table</label>
                                <TableSelector selectedTable={table} onSelect={onTableChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={customerName}
                                        onChange={(e) => onNameChange(e.target.value)}
                                        className="w-full bg-white border border-gray-100 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-900 outline-none focus:border-brand-primary transition-all placeholder:text-gray-200 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2">Mobile</label>
                                    <input
                                        type="tel"
                                        placeholder="Number"
                                        value={customerMobile}
                                        onChange={(e) => onMobileChange(e.target.value)}
                                        className="w-full bg-white border border-gray-100 rounded-xl py-2.5 px-4 text-xs font-bold text-gray-900 outline-none focus:border-brand-primary transition-all placeholder:text-gray-200 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Payment Mode</p>
                        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                            <button
                                onClick={() => onPaymentMethodChange('cash')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300 ${paymentMethod === 'cash'
                                    ? 'bg-white text-gray-900 shadow-md shadow-black/5 ring-1 ring-black/5'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <span className="text-[11px] font-black uppercase tracking-widest">Cash</span>
                            </button>
                            <button
                                onClick={() => onPaymentMethodChange('upi')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300 ${paymentMethod === 'upi'
                                    ? 'bg-white text-brand-primary shadow-md shadow-brand-primary/10 ring-1 ring-brand-primary/5'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <span className="text-[11px] font-black uppercase tracking-widest">UPI Pay</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grand Total */}
                <div className="pt-5 border-t border-gray-50">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Grand Total</p>
                            <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1">Inclusive of GST</p>
                        </div>
                        <span className="text-[42px] font-black text-brand-primary font-serif tracking-tighter leading-none">₹{finalTotal}</span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={onPlaceOrder}
                        disabled={isOrdering || items.length === 0 || !table || !customerName || !customerMobile}
                        className="w-full bg-black text-white font-black py-4 rounded-[1.25rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] hover:bg-brand-primary transition-all uppercase tracking-[0.25em] text-[10px] disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 group"
                    >
                        {isOrdering ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        )}
                        {isOrdering ? 'Placing Order...' : 'Confirm Order'}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
