import React from 'react';
import type { OrderItemPayload } from '../../types';
import { Button } from './Button';
import { TableSelector } from './TableSelector';

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
        <div className={`bg-white rounded-3xl shadow-card border border-brand-border/40 overflow-hidden flex flex-col h-fit max-h-[calc(100vh-100px)] ${className}`}>
            <div className="p-4 md:p-5 border-b border-brand-border/20 flex justify-between items-center sticky top-0 z-10 bg-white/95 backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-bold font-serif text-brand-text tracking-tight">My Cart</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                            {items.length} {items.length === 1 ? 'Item' : 'Items'} selected
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 bg-white rounded-full text-brand-muted hover:text-brand-text shadow-sm border border-brand-border hover:bg-gray-50 transition-colors"
                            aria-label="Close cart"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="p-3 md:p-4 flex-1 overflow-y-auto custom-scrollbar">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-brand-muted/40">
                        <div className="w-16 h-16 bg-brand-background rounded-full flex items-center justify-center mb-4 opacity-30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </div>
                        <p className="font-bold text-sm text-brand-text/60">Cart is Empty</p>
                        <p className="text-[11px] mt-1 text-center max-w-[140px]">Browse our menu and add your favorite dishes.</p>
                    </div>
                ) : (
                    <div className="space-y-4 mb-8">
                        {items.map((item, idx) => (
                            <div key={`${item.name}-${idx}`} className="flex items-center gap-4 group">
                                <div className="w-14 h-14 rounded-2xl bg-brand-background flex items-center justify-center text-2xl shrink-0 shadow-sm border border-brand-border/30 group-hover:scale-105 transition-all duration-300 overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-brand-background">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-muted/40">
                                                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                                                <path d="M7 2v20"></path>
                                                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-bold text-brand-text text-[14px] line-clamp-1 leading-snug">{item.name}</p>
                                        <p className="font-serif font-black text-brand-primary text-[14px] whitespace-nowrap ml-3">₹{item.price * item.qty}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-brand-muted/70 uppercase tracking-tight">₹{item.price}</p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center bg-white p-1 rounded-xl border border-brand-border/60 shadow-sm gap-3">
                                            <button
                                                onClick={() => onDecrement(item.name)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-muted hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                            </button>
                                            <span className="text-xs font-bold text-brand-text min-w-[12px] text-center">{item.qty}</span>
                                            <button
                                                onClick={() => onIncrement(item.name)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-all active:scale-90"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Customer Details Section */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-brand-border/40 bg-brand-background/30 p-4 space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-4 bg-brand-primary rounded-full"></div>
                        <h3 className="text-[10px] font-black text-brand-text uppercase tracking-[0.2em]">Order Details</h3>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-brand-muted uppercase mb-2 tracking-wider ml-1">Dining Table</label>
                        <TableSelector selectedTable={table} onSelect={onTableChange} />
                        {!table && (
                            <p className="text-[10px] text-orange-600 mt-2 flex items-center gap-1.5 font-medium italic translate-x-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Selection Required
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-brand-muted uppercase mb-2 tracking-wider ml-1">Customer Name</label>
                            <input
                                type="text"
                                placeholder="Ex. Tharaneesh"
                                value={customerName}
                                onChange={(e) => onNameChange(e.target.value)}
                                className="w-full bg-white border border-brand-border/60 rounded-xl py-2.5 px-4 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-all placeholder:text-gray-300 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-brand-muted uppercase mb-2 tracking-wider ml-1">Mobile Number</label>
                            <input
                                type="tel"
                                placeholder="Ex. 9876543210"
                                value={customerMobile}
                                onChange={(e) => onMobileChange(e.target.value)}
                                className="w-full bg-white border border-brand-border/60 rounded-xl py-2.5 px-4 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-all placeholder:text-gray-300 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-brand-muted uppercase mb-3 tracking-wider">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onPaymentMethodChange('cash')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${paymentMethod === 'cash'
                                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary shadow-sm'
                                : 'bg-white border-brand-border text-brand-muted hover:bg-brand-background hover:border-brand-primary/30'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="6" width="20" height="12" rx="2" />
                                <circle cx="12" cy="12" r="2" />
                                <path d="M6 12h.01M18 12h.01" />
                            </svg>
                            <span className="text-sm font-bold">Cash</span>
                        </button>
                        <button
                            onClick={() => onPaymentMethodChange('upi')}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${paymentMethod === 'upi'
                                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary shadow-sm'
                                : 'bg-white border-brand-border text-brand-muted hover:bg-brand-background hover:border-brand-primary/30'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21L9 3L15 13L3 21Z" />
                                <path d="M9 21L15 3L21 13L9 21Z" />
                            </svg>
                            <span className="text-sm font-bold">UPI</span>
                        </button>
                    </div>
                </div>

                {/* Bill Summary Section - Minimal */}
                <div className="mb-8 p-5 bg-brand-background/30 rounded-2xl border border-brand-border/20 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">Total Amount</span>
                        <span className="text-[10px] font-medium text-brand-muted/70">Inclusive of all taxes</span>
                    </div>
                    <span className="text-3xl font-black text-brand-primary font-mono tracking-tighter">₹{finalTotal}</span>
                </div>

                <Button
                    onClick={onPlaceOrder}
                    disabled={isOrdering || items.length === 0 || !table || !customerName || !customerMobile}
                    className="w-full py-3.5 text-base shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all rounded-xl"
                    size="lg"
                >
                    {isOrdering ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : 'Place Order'}
                </Button>
            </div>
        </div>
    );
};
