import type { OrderPayload, OrderResponse, KitchenOrder, OrderStatus, PaymentStatus } from '../../types';
import { supabase } from '../../api/supabase';

/**
 * CUSTOMER SIDE: Place Order (Supabase Implementation)
 */
export const submitOrder = async (payload: OrderPayload): Promise<OrderResponse> => {
    console.log('[SupabaseService] Processing order:', payload);

    const subtotal = payload.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const gst = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + gst;

    try {
        // 1. Insert main order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
                table_id: payload.table,
                status: 'PENDING',
                payment_method: payload.payment_method.toUpperCase(),
                payment_status: payload.payment_status || 'PENDING',
                total_amount: total,
                customer_name: payload.customer_name,
                customer_mobile: payload.customer_mobile
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Insert order items
        const orderItems = payload.items.map(item => ({
            order_id: orderData.id,
            item_name: item.name,
            quantity: item.qty,
            price_at_order: item.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return {
            success: true,
            order_id: orderData.id,
            table: payload.table,
            items: payload.items.map(i => `${i.name} x${i.qty}`).join(', '),
            subtotal,
            gst,
            total,
            payment_method: payload.payment_method,
            payment_status: (payload.payment_status || 'PENDING') as PaymentStatus,
        };
    } catch (e) {
        console.error('Supabase order submission failed', e);
        throw e;
    }
};

/**
 * KITCHEN SIDE: Get Orders (Supabase Implementation)
 */
export const getKitchenOrders = async (): Promise<KitchenOrder[]> => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((o: any) => ({
            order_id: o.id,
            table: o.table_id,
            items: o.order_items.map((i: any) => `${i.item_name} x${i.quantity}`).join(', '),
            total: o.total_amount,
            status: o.status as OrderStatus,
            payment_status: o.payment_status || 'PENDING',
            payment_method: o.payment_method || 'CASH',
            created_at: o.created_at
        }));
    } catch (e) {
        console.error('Supabase fetch failed', e);
        return [];
    }
};

/**
 * KITCHEN SIDE: Update Status (Supabase Implementation)
 */
export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus.toUpperCase() })
            .eq('id', orderId);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Supabase update failed', e);
        return false;
    }
};

/**
 * Helper to parse items string back to objects if needed
 */
export const parseKitchenItems = (itemsString: string): { name: string; qty: number }[] => {
    try {
        return itemsString.split(',').map(part => {
            const match = part.trim().match(/^(.+?)\s+x(\d+)$/);
            if (match) {
                return { name: match[1], qty: parseInt(match[2], 10) };
            }
            return { name: part.trim(), qty: 1 };
        });
    } catch {
        return [{ name: itemsString, qty: 1 }];
    }
};
/**
 * Update Payment Status
 */
export const updatePaymentStatus = async (orderId: string, newStatus: PaymentStatus): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ payment_status: newStatus.toUpperCase() })
            .eq('id', orderId);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Supabase update payment failed', e);
        return false;
    }
};

/**
 * Cancel Order (Delete from DB)
 */
export const cancelOrder = async (orderId: string): Promise<boolean> => {
    try {
        // First delete order items
        await supabase
            .from('order_items')
            .delete()
            .eq('order_id', orderId);

        // Then delete the order
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Supabase delete order failed', e);
        return false;
    }
};
