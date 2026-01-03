import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
    getOrders, 
    updateOrderStatus
} from '../services/api';
import type { Order } from '../services/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../components/ui/dialog';
import { MoreHorizontal, Image as ImageIcon, Loader2, Eye, Package } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Orders() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        // Optimistic update
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus as any } : o));
        if (selectedOrder && selectedOrder._id === id) {
             setSelectedOrder({ ...selectedOrder, status: newStatus as any });
        }
        
        try {
            await updateOrderStatus(id, newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
            // Revert on failure
            fetchOrders(); 
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'pending': return 'secondary';
            case 'pending_verification': return 'warning'; 
            case 'confirmed': return 'default'; 
            case 'shipped': return 'default'; 
            case 'delivered': return 'outline';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };

    const getStatusColorClass = (status: string) => {
        switch(status) {
            case 'confirmed': return 'bg-emerald-500 hover:bg-emerald-600';
            case 'pending_verification': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
            case 'shipped': return 'bg-blue-500 hover:bg-blue-600';
            default: return '';
        }
    };

    return (
        <div className="p-8 space-y-8">
            <header>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('orders.title')}</h1>
                        <p className="text-slate-500 mt-2">{t('orders.subtitle')}</p>
                    </div>
                    <Button onClick={fetchOrders} variant="outline" size="sm">
                        Refresh
                    </Button>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>{t('orders.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-64">
                             <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                         </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50">
                                        <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('orders.table.id')}</th>
                                        <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('orders.table.date')}</th>
                                        <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('orders.table.customer')}</th>
                                        <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('orders.table.amount')}</th>
                                        <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('orders.table.items')}</th>
                                        <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('orders.table.method')}</th>
                                        <th className="h-12 px-4 align-middle font-medium text-slate-500">{t('orders.table.status')}</th>
                                        <th className="h-12 px-4 align-middle font-medium text-slate-500 text-right">{t('orders.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="border-b transition-colors hover:bg-slate-50/50">
                                            <td className="p-4 align-middle font-medium text-slate-900">
                                                #{order._id.slice(-6).toUpperCase()}
                                            </td>
                                            <td className="p-4 align-middle text-slate-500">
                                                {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">{order.contactId?.name || "Unknown"}</div>
                                                <div className="text-slate-500 text-xs">{order.contactId?.phoneNumber}</div>
                                            </td>
                                            <td className="p-4 align-middle font-medium">
                                                ${order.totalAmount.toLocaleString()} {order.currency}
                                            </td>
                                            <td className="p-4 align-middle text-slate-600 max-w-xs truncate">
                                                {order.items.length > 0 ? (
                                                    <span title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                                        {order.items[0].quantity}x {order.items[0].name}
                                                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
                                                    {order.paymentProofUrl && <ImageIcon className="h-4 w-4 text-emerald-500" />}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge 
                                                    variant={getStatusVariant(order.status) as any}
                                                    className={cn("capitalize", getStatusColorClass(order.status))}
                                                >
                                                    {t(`orders.status.${order.status}`)}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <div onClick={() => { setSelectedOrder(order); setDetailsOpen(true); }} className="inline-block cursor-pointer p-2 hover:bg-slate-100 rounded-md">
                                                     <Eye className="h-4 w-4 text-slate-500" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-4 text-center text-slate-500">
                                                No orders found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center justify-between">
                                    <span>Order #{selectedOrder._id.slice(-6).toUpperCase()}</span>
                                    <Badge 
                                        variant={getStatusVariant(selectedOrder.status) as any}
                                        className={cn("capitalize ml-4", getStatusColorClass(selectedOrder.status))}
                                    >
                                        {t(`orders.status.${selectedOrder.status}`)}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                    Created on {format(new Date(selectedOrder.createdAt), 'PPpp')}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                {/* Customer Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Customer</h3>
                                        <p>{selectedOrder.contactId?.name || "Unknown"}</p>
                                        <p className="text-slate-500">{selectedOrder.contactId?.phoneNumber}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Delivery Address</h3>
                                        <p className="text-slate-500">{selectedOrder.deliveryAddress || "Not specified"}</p>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <Package className="h-4 w-4" /> Items
                                    </h3>
                                    <div className="border rounded-lg divide-y">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="p-3 flex justify-between items-center bg-slate-50/50">
                                                <span className="font-medium text-slate-700">
                                                    {item.quantity}x {item.name}
                                                </span>
                                                <span className="text-slate-600">
                                                    ${(item.price * item.quantity).toLocaleString()} {item.currency}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="p-3 bg-slate-100 flex justify-between font-bold">
                                            <span>Total</span>
                                            <span>${selectedOrder.totalAmount.toLocaleString()} {selectedOrder.currency}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Proof */}
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-2">Payment Method: <span className="font-normal capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</span></h3>
                                    {selectedOrder.paymentProofUrl ? (
                                        <div className="mt-2 border rounded-lg p-2 bg-slate-50 text-center">
                                            <img 
                                                src={selectedOrder.paymentProofUrl} 
                                                alt="Payment Proof" 
                                                className="max-h-64 mx-auto object-contain rounded-md" 
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No payment proof uploaded.</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                     <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                                         Close
                                     </Button>
                                    
                                    {(selectedOrder.status === 'pending' || selectedOrder.status === 'pending_verification') && (
                                         <Button onClick={() => handleStatusUpdate(selectedOrder._id, 'confirmed')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                             {t('orders.actions.confirm')}
                                         </Button>
                                    )}
                                    {selectedOrder.status === 'confirmed' && (
                                         <Button onClick={() => handleStatusUpdate(selectedOrder._id, 'shipped')} className="bg-blue-600 hover:bg-blue-700">
                                             {t('orders.actions.mark_shipped')}
                                         </Button>
                                    )}
                                    {selectedOrder.status === 'shipped' && (
                                         <Button onClick={() => handleStatusUpdate(selectedOrder._id, 'delivered')}>
                                             {t('orders.actions.mark_delivered')}
                                         </Button>
                                    )}
                                    {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                                        <Button 
                                            variant="destructive"
                                            onClick={() => handleStatusUpdate(selectedOrder._id, 'cancelled')}
                                        >
                                            {t('orders.actions.cancel')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
