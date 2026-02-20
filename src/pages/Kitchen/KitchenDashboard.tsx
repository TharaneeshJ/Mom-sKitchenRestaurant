
import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Maximize2, Minimize2 } from 'lucide-react';
import './KitchenDashboard.css';

export const KitchenDashboard: React.FC = () => {
    const { orders, updateOrderStatus: updateStatus } = useRestaurant();
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const dashboardRef = React.useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            dashboardRef.current?.requestFullscreen();
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

    // Wrap updateOrderStatus to prevent double state updates if using optimistic UI
    const updateOrderStatus = async (id: string, status: any) => {
        await updateStatus(id, status);
    };

    // Filter for active orders (pending, cooking, ready, served)
    const activeOrders = orders.filter(
        (order) => ['pending', 'cooking', 'ready', 'served'].includes(order.status)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());



    const columns = [
        { status: 'pending', label: 'Pending', count: activeOrders.filter(o => o.status === 'pending').length },
        { status: 'cooking', label: 'Cooking', count: activeOrders.filter(o => o.status === 'cooking').length },
        { status: 'ready', label: 'Ready', count: activeOrders.filter(o => o.status === 'ready').length },
        { status: 'served', label: 'Served', count: activeOrders.filter(o => o.status === 'served').length },
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
                                .filter((order) => order.status === col.status)
                                .map((order) => (
                                    <div key={order.id} className="order-card">
                                        <div className="order-header">
                                            <div>
                                                <div className="table-number">Table {order.tableId}</div>
                                                <div className="customer-name">{order.customerName || 'Guest'}</div>
                                                <div className="order-time">
                                                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            {/* Status Badge is redundant in columns, but kept for clarity if needed, or removed */}
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
                                            {order.status === 'pending' && (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => updateOrderStatus(order.id, 'cooking')}
                                                >
                                                    Start Cooking
                                                </button>
                                            )}
                                            {order.status === 'cooking' && (
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => updateOrderStatus(order.id, 'ready')}
                                                >
                                                    Mark Ready
                                                </button>
                                            )}
                                            {order.status === 'ready' && (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => updateOrderStatus(order.id, 'served')}
                                                >
                                                    Mark Served
                                                </button>
                                            )}
                                            {order.status === 'served' && (
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => updateOrderStatus(order.id, 'paid')}
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            {activeOrders.filter((order) => order.status === col.status).length === 0 && (
                                <div className="empty-column-state">No orders</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
