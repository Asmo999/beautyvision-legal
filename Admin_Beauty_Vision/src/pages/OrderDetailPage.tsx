import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrder, updateOrderStatus, refundOrder } from '@/api/orders';
import type { OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', confirmed: 'secondary', processing: 'secondary',
  shipped: 'default', delivered: 'default', cancelled: 'destructive', refunded: 'destructive',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });

  const [statusOpen, setStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [note, setNote] = useState('');

  const statusMut = useMutation({
    mutationFn: () => updateOrderStatus(id!, newStatus, note || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['order', id] }); setStatusOpen(false); setNote(''); },
  });

  const refundMut = useMutation({
    mutationFn: () => refundOrder(id!, 'Refunded by admin'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!order) return <div className="text-muted-foreground">Order not found</div>;

  const customer = typeof order.user === 'string' ? null : order.user;

  return (
    <div className="max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/orders')}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Orders
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
          <p className="text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]} className="text-sm">{order.status}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{customer.firstName} {customer.lastName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{customer.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">QR</span><span className="font-mono">{customer.qrCode}</span></div>
              </>
            ) : (
              <p className="text-muted-foreground">Customer data not available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{order.subtotal} GEL</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{order.deliveryFee} GEL</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span>{order.total} GEL</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Points Earned</span><span className="text-green-600">+{order.pointsEarned}</span></div>
            {order.pointsRedeemed > 0 && (
              <div className="flex justify-between"><span className="text-muted-foreground">Points Redeemed</span><span className="text-destructive">-{order.pointsRedeemed}</span></div>
            )}
          </CardContent>
        </Card>
      </div>

      {order.shippingAddress && (
        <Card className="mt-4">
          <CardHeader><CardTitle className="text-base">Shipping Address</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p>{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}{order.shippingAddress.zip ? `, ${order.shippingAddress.zip}` : ''}</p>
            <p>{order.shippingAddress.phone}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.brand}</TableCell>
                  <TableCell>{item.size ?? '-'}</TableCell>
                  <TableCell className="text-right">{item.price} GEL</TableCell>
                  <TableCell className="text-right">{item.qty}</TableCell>
                  <TableCell className="text-right font-medium">{(item.price * item.qty).toFixed(2)} GEL</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="mb-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => { setNewStatus(order.status); setStatusOpen(true); }}>
          Update Status
        </Button>
        {order.status !== 'refunded' && order.status !== 'cancelled' && (
          <Button size="sm" variant="destructive" onClick={() => { if (confirm('Process refund for this order?')) refundMut.mutate(); }}>
            Refund
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Status History</CardTitle></CardHeader>
        <CardContent>
          {order.statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status changes recorded</p>
          ) : (
            <div className="space-y-3">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Badge variant={STATUS_VARIANT[h.status]} className="mt-0.5 shrink-0">{h.status}</Badge>
                  <div>
                    <p className="text-muted-foreground">{new Date(h.changedAt).toLocaleString()}</p>
                    {h.note && <p className="mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Order Status</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); statusMut.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value ?? '')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for status change" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={statusMut.isPending}>{statusMut.isPending ? 'Updating...' : 'Update'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
