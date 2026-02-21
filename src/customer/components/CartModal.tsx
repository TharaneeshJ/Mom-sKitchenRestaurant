import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartSidebar } from './CartSidebar';
import type { OrderItemPayload } from '../../types';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
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
}

export const CartModal: React.FC<CartModalProps> = ({
    isOpen,
    onClose,
    ...props
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-lg z-10"
                    >
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden shadow-black/20">
                            <CartSidebar
                                {...props}
                                onClose={onClose}
                                className="border-none shadow-none rounded-none"
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
