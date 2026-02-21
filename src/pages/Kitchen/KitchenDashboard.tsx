
import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Maximize2, Minimize2, ChefHat, CheckCircle2, Utensils, CircleDollarSign } from 'lucide-react';
import './KitchenDashboard.css';

export const KitchenDashboard: React.FC = () => {
    const { orders, updateOrderStatus: updateStatus } = useRestaurant();
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [updatingOrder, setUpdatingOrder] = React.useState<string | null>(null);
    const dashboardRef = React.useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!dashboardRef.current) return;
        if (!document.fullscreenElement) {
            dashboardRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Wrap updateOrderStatus with loading state
    const updateOrderStatus = async (id: string, status: any) => {
        setUpdatingOrder(id);
        try {
            await updateStatus(id, status);
        } finally {
            setUpdatingOrder(null);
        }
    };

    // Filter for active orders (pending, cooking, ready, served) - ensure case-insensitive match
    const activeOrders = orders.filter(
        (order) => {
            const status = order.status?.toLowerCase();
            return ['pending', 'cooking', 'ready', 'served'].includes(status);
        }
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const columns = [
        { status: 'pending', label: 'Pending', count: activeOrders.filter(o => o.status?.toLowerCase() === 'pending').length },
        { status: 'cooking', label: 'Cooking', count: activeOrders.filter(o => o.status?.toLowerCase() === 'cooking').length },
        { status: 'ready', label: 'Ready', count: activeOrders.filter(o => o.status?.toLowerCase() === 'ready').length },
        { status: 'served', label: 'Served', count: activeOrders.filter(o => o.status?.toLowerCase() === 'served').length },
    ];

    return (
        <div className="kitchen-page" ref={dashboardRef}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Live Kitchen</h1>
                    <p className="page-subtitle">Manage incoming orders</p>
                </div>
                <button className="btn-icon" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            </header>

            <div className="kanban-board">
                {columns.map((col) => (
                    <div key={col.status} className="kanban-column">
                        <div className="column-header">
                            <h2 className="column-title">
                                {col.label}
                                <span className="column-count">{col.count}</span>
                            </h2>
                        </div>
                        <div className="column-content">
                            {activeOrders
                                .filter((order) => {
                                    const os = order.status?.toLowerCase();
                                    return os === col.status;
                                })
                                .map((order) => (
                                    <div key={order.id} className={`order-card ${updatingOrder === order.id ? 'updating' : ''}`}>
                                        <div className="order-header">
                                            <div className="flex items-center justify-between w-full">
                                                <div>
                                                    <div className="table-number flex items-center gap-2">
                                                        Table {order.tableId}
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {order.paymentStatus || 'PENDING'}
                                                        </span>
                                                    </div>
                                                    <div className="customer-name">{order.customerName || 'Guest'}</div>
                                                    <div className="order-time">
                                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="payment-method text-[10px] font-bold text-gray-400 uppercase">
                                                        {order.paymentMethod}
                                                    </div>
                                                    <div className="text-[9px] font-black px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase">
                                                        {order.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="order-items">
                                            {order.items.map((item, index) => (
                                                <div key={`${order.id}-${index}`} className="order-item">
                                                    <div className="item-qty">{item.quantity}</div>
                                                    <div className="item-name">{item.name}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-actions">
                                            {updatingOrder === order.id ? (
                                                <div className="w-full flex flex-col items-center justify-center py-4 gap-2">
                                                    <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                                                    <span className="text-[9px] font-black uppercase text-gray-400 animate-pulse">Updating...</span>
                                                </div>
                                            ) : (
                                                <div className="w-full space-y-2">
                                                    {order.status?.toLowerCase() === 'pending' && (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => updateOrderStatus(order.id, 'cooking')}
                                                        >
                                                            <ChefHat size={16} />
                                                            Start Cooking
                                                        </button>
                                                    )}
                                                    {order.status?.toLowerCase() === 'cooking' && (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                                        >
                                                            <CheckCircle2 size={16} />
                                                            Mark Ready
                                                        </button>
                                                    )}
                                                    {order.status?.toLowerCase() === 'ready' && (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => updateOrderStatus(order.id, 'served')}
                                                        >
                                                            <Utensils size={16} />
                                                            Mark Served
                                                        </button>
                                                    )}
                                                    {order.status?.toLowerCase() === 'served' && (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => updateOrderStatus(order.id, 'paid')}
                                                        >
                                                            <CircleDollarSign size={16} />
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {activeOrders.filter((order) => order.status?.toLowerCase() === col.status).length === 0 && (
                                <div className="empty-column-state">No orders</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
