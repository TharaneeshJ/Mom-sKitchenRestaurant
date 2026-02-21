
export type OrderStatus = 'PENDING' | 'COOKING' | 'READY' | 'SERVED' | 'PAID' | 'pending' | 'cooking' | 'ready' | 'served' | 'paid';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface OrderItem {
    id: string; // menu item id
    name: string;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    tableId: string;
    items: OrderItem[];
    status: OrderStatus;
    totalAmount: number;
    timestamp: Date;
    customerName?: string;
    notes?: string;
    paymentMethod?: string;
    paymentStatus?: PaymentStatus;
}

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    image: string;
    category: string;
    isVeg: boolean;
    isBestseller?: boolean;
}

// Customer Portal Specific Types
export interface CartItem extends MenuItem {
    qty: number;
}

export interface OrderItemPayload {
    name: string;
    price: number;
    qty: number;
    image?: string;
    category?: string;
}

export interface OrderPayload {
    table: string;
    items: OrderItemPayload[];
    payment_method: string;
    customer_name: string;
    customer_mobile: string;
    payment_status?: PaymentStatus;
}

export interface OrderResponse {
    success: boolean;
    order_id: string;
    table: string;
    items: string;
    subtotal: number;
    gst: number;
    total: number;
    payment_method?: string;
    payment_status?: PaymentStatus;
}

export interface KitchenOrder {
    order_id: string;
    table: string;
    items: string;
    total: number;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: string;
    created_at: string;
}
