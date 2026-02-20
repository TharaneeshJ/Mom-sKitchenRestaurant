
import React, { useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Search, Filter, Maximize2, Minimize2 } from 'lucide-react';
import './BillingDashboard.css';

export const BillingDashboard: React.FC = () => {
    const { orders } = useRestaurant();
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

    // Flatten orders for table view or just list them
    // Sorting by latest first


    const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'paid' | 'unpaid'>('all');
    const [showFilterMenu, setShowFilterMenu] = React.useState(false);

    const filteredOrders = useMemo(() => {
        let result = [...orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(order =>
                (order.customerName && order.customerName.toLowerCase().includes(query)) ||
                (order.id && order.id.toLowerCase().includes(query)) ||
                (order.tableId && order.tableId.toString().includes(query))
            );
        }

        if (filterStatus !== 'all') {
            if (filterStatus === 'paid') {
                result = result.filter(order => (order.status || '').toLowerCase() === 'paid');
            } else {
                result = result.filter(order => (order.status || '').toLowerCase() !== 'paid');
            }
        }
        return result;
    }, [orders, searchQuery, filterStatus]);

    return (
        <div className="billing-page" ref={dashboardRef}>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Billing & Transactions</h1>
                    <p className="page-subtitle">Overview of financial performance</p>
                </div>
                <div className="billing-actions">
                    <button className="btn btn-secondary icon-only" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                </div>
            </header>



            <div className="table-controls">
                <div className="search-bar">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search name, order ID, or table..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group" style={{ position: 'relative' }}>
                    <button
                        className={`btn btn-sm btn-outline ${filterStatus !== 'all' ? 'active' : ''}`}
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                    >
                        <Filter size={14} /> Filter {filterStatus !== 'all' && `(${filterStatus})`}
                    </button>
                    {showFilterMenu && (
                        <div className="filter-menu">
                            <div
                                className={`filter-option ${filterStatus === 'all' ? 'active' : ''}`}
                                onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }}
                            >
                                All Orders
                            </div>
                            <div
                                className={`filter-option ${filterStatus === 'paid' ? 'active' : ''}`}
                                onClick={() => { setFilterStatus('paid'); setShowFilterMenu(false); }}
                            >
                                Paid Only
                            </div>
                            <div
                                className={`filter-option ${filterStatus === 'unpaid' ? 'active' : ''}`}
                                onClick={() => { setFilterStatus('unpaid'); setShowFilterMenu(false); }}
                            >
                                Unpaid Only
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="table-container">
                <table className="table-layout">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Time</th>
                            <th>Table</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Amount</th>

                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <tr key={order.id} onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                                    <td className="font-medium">{order.customerName || 'Guest'}</td>
                                    <td>{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>{order.tableId}</td>
                                    <td>
                                        <div className="truncate-items" title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                            {order.items.length} items
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${(order.status || '').toLowerCase() === 'paid' ? 'served' : (order.status || '').toLowerCase()}`}>
                                            {/* If paid, it means it's completed/served. Otherwise show current status */}
                                            {(order.status || '').toLowerCase() === 'paid' ? 'Served' : order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="payment-details">
                                            <span className={`status-badge status-${(order.status || '').toLowerCase() === 'paid' ? 'paid' : 'unpaid'}`}>
                                                {(order.status || '').toLowerCase() === 'paid' ? 'Paid' : 'Pending'}
                                            </span>
                                            {order.paymentMethod ? (
                                                <span className="payment-via">
                                                    {order.paymentMethod}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    -
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="font-semibold font-mono">₹{order.totalAmount.toLocaleString()}</td>

                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted-foreground))' }}>
                                    No orders found matching "{searchQuery}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl font-bold">Order Details</h2>
                                <p className="text-sm text-muted-foreground">Order ID: {selectedOrder.id.slice(0, 8)}</p>
                            </div>
                            <button className="btn-close" onClick={() => setSelectedOrder(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Customer</span>
                                    <span className="value">{selectedOrder.customerName || 'Guest'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Table</span>
                                    <span className="value">Table {selectedOrder.tableId}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Time</span>
                                    <span className="value">{new Date(selectedOrder.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Status</span>
                                    <span className={`status-badge status-${selectedOrder.status}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                            </div>

                            <div className="order-items-list">
                                <h3 className="text-sm font-semibold mb-2">Order Items</h3>
                                {selectedOrder.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                                        <div className="flex gap-2">
                                            <span className="font-bold">{item.quantity}x</span>
                                            <span>{item.name}</span>
                                        </div>
                                        <span className="font-mono">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer">
                                <div className="flex justify-between items-center w-full">
                                    <div className="text-sm">
                                        Payment:
                                        <span className="ml-2 font-semibold">
                                            {selectedOrder.paymentMethod ? selectedOrder.paymentMethod.toUpperCase() : 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="text-xl font-bold">
                                        Total: ₹{selectedOrder.totalAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
