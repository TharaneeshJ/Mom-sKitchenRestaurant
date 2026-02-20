import React, { useState, useEffect } from 'react';
import type { KitchenOrder, OrderStatus } from '../../types/index';
import { getKitchenOrders, parseKitchenItems } from '../services/orderService';


interface StatusColumn {
    status: OrderStatus;
    title: string;
}

const STATUS_COLUMNS: StatusColumn[] = [
    { status: 'PENDING', title: 'Pending' },
    { status: 'COOKING', title: 'Cooking' },
    { status: 'READY', title: 'Ready' },
];

export const OrderTracker: React.FC = () => {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const data = await getKitchenOrders();
            setOrders(data);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch status';
            setError(message);
        }
    };

    useEffect(() => {
        fetchOrders();
        const intervalId = setInterval(fetchOrders, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const getOrdersByStatus = (status: OrderStatus) => orders.filter((o: KitchenOrder) => o.status === status);

    return (
        <div className="max-w-7xl mx-auto md:p-8 p-5 bg-brand-background min-h-screen">
            <header className="mb-10 mt-4 px-1">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-text tracking-tighter">Live Tracker</h2>
                </div>
                <p className="text-brand-muted text-sm font-medium flex items-center gap-2">
                    Real-time updates directly from our kitchen
                </p>
            </header>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {STATUS_COLUMNS.map((col) => {
                    const colOrders = getOrdersByStatus(col.status);
                    return (
                        <div key={col.status} className="flex flex-col h-full min-h-[400px]">
                            <div className="flex justify-between items-center mb-5 px-1">
                                <h3 className="font-serif font-black text-xl text-brand-text tracking-tight uppercase tracking-widest">{col.title}</h3>
                                <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg">{colOrders.length}</span>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar pb-10">
                                {colOrders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 bg-white/40 rounded-3xl border border-dashed border-brand-border/40 text-brand-muted/40 opacity-60">
                                        <div className="text-3xl mb-3 grayscale opacity-30 italic font-serif tracking-tighter">Empty</div>
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black">Waiting for orders</span>
                                    </div>
                                ) : (
                                    colOrders.map((order: KitchenOrder) => (
                                        <div key={order.order_id} className="bg-white border border-brand-border/40 rounded-3xl p-6 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 transform hover:-translate-y-1">
                                            <div className="flex justify-between items-center mb-5">
                                                <span className="text-[11px] font-black text-brand-primary bg-brand-background px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                                    Table {order.table}
                                                </span>
                                                <span className="text-[10px] font-bold text-brand-muted font-mono bg-gray-50 px-2 py-1 rounded-lg">
                                                    #{order.order_id.slice(-4)}
                                                </span>
                                            </div>

                                            <div className="space-y-3 mb-6 bg-brand-background/30 p-4 rounded-2xl">
                                                {parseKitchenItems(order.items).map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span className="font-medium text-brand-text/90 tracking-tight">{item.name}</span>
                                                        <span className="font-mono text-xs text-brand-muted bg-white w-6 h-6 flex items-center justify-center rounded-full shadow-sm border border-brand-border/20">
                                                            {item.qty}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black mb-0.5">Time</span>
                                                    <span className="text-xs font-bold text-brand-text">
                                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-black mb-0.5">Total</span>
                                                    <p className="text-lg font-black text-brand-primary font-serif tracking-tighter leading-none">₹{order.total}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
