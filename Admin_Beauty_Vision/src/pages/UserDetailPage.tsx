import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, adjustBonus, toggleVerification, changeRole } from '@/api/users';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calculator, Plus } from 'lucide-react';

const POINT_VALUE_GEL = 0.01;

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user: adminUser } = useAuth();
  const isSuperAdmin = adminUser?.role === 'superadmin';

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(id!),
    enabled: !!id,
  });

  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusPoints, setBonusPoints] = useState('');
  const [bonusGel, setBonusGel] = useState('');
  const [bonusDesc, setBonusDesc] = useState('');
  const [discountOpen, setDiscountOpen] = useState(false);
  const [purchaseGel, setPurchaseGel] = useState('');
  const [redemptionPoints, setRedemptionPoints] = useState('');

  const bonusMut = useMutation({
    mutationFn: () => adjustBonus(id!, Number(bonusPoints), bonusDesc),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['user', id] }); setBonusOpen(false); setBonusPoints(''); setBonusGel(''); setBonusDesc(''); },
  });

  const verifyMut = useMutation({
    mutationFn: () => toggleVerification(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', id] }),
  });

  const roleMut = useMutation({
    mutationFn: (role: string) => changeRole(id!, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', id] }),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!data) return <div className="text-muted-foreground">User not found</div>;

  const { user, transactions } = data;

  const updateBonusPoints = (value: string) => {
    setBonusPoints(value);
    const points = Number(value);
    setBonusGel(value.trim() !== '' && Number.isFinite(points) ? (points * POINT_VALUE_GEL).toFixed(2) : '');
  };

  const updateBonusGel = (value: string) => {
    setBonusGel(value);
    const gel = Number(value);
    setBonusPoints(value.trim() !== '' && Number.isFinite(gel) ? String(Math.round(gel / POINT_VALUE_GEL)) : '');
  };

  const parsedPurchaseGel = Number(purchaseGel);
  const hasValidPurchase = purchaseGel.trim() !== '' && Number.isFinite(parsedPurchaseGel) && parsedPurchaseGel > 0;
  const parsedRedemptionPoints = Number(redemptionPoints);
  const requestedRedemptionPoints = redemptionPoints.trim() !== '' && Number.isFinite(parsedRedemptionPoints)
    ? Math.max(0, Math.floor(parsedRedemptionPoints))
    : 0;
  const maxPointsForPurchase = hasValidPurchase ? Math.round(parsedPurchaseGel / POINT_VALUE_GEL) : 0;
  const usablePoints = Math.min(requestedRedemptionPoints, user.bonusPoints, maxPointsForPurchase);
  const discountGel = usablePoints * POINT_VALUE_GEL;
  const discountPercent = hasValidPurchase ? (discountGel / parsedPurchaseGel) * 100 : 0;
  const amountToPay = hasValidPurchase ? Math.max(0, parsedPurchaseGel - discountGel) : 0;

  const useAvailablePoints = () => {
    if (!hasValidPurchase) return;
    setRedemptionPoints(String(Math.min(user.bonusPoints, maxPointsForPurchase)));
  };

  return (
    <div className="max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/users')}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Users
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.firstName} {user.lastName}</h1>
          <p className="text-muted-foreground">{user.email ?? 'No email'}</p>
        </div>
        <Badge variant={user.isVerified ? 'default' : 'destructive'}>{user.isVerified ? 'Verified' : 'Unverified'}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">QR Code</span><span className="font-mono">{user.qrCode}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{user.phone ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Birthday</span><span>{user.birthday ?? '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge variant="outline">{user.role}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{new Date(user.createdAt).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Loyalty</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Bonus Points</span><span className="text-lg font-bold">{user.bonusPoints}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GEL Value</span><span>{(user.bonusPoints * POINT_VALUE_GEL).toFixed(2)} GEL</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cashback Rate</span><span>{user.cashbackRate}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Spend</span><span>{user.physicalSpendTotal} GEL</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Orders</span><span>{user.orderCount}</span></div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setBonusOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />Adjust Points
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDiscountOpen(true)}>
          <Calculator className="mr-1 h-3.5 w-3.5" />Discount Calculator
        </Button>
        <Button size="sm" variant="outline" onClick={() => verifyMut.mutate()}>
          {user.isVerified ? 'Unverify' : 'Verify'} Account
        </Button>
        {isSuperAdmin && (
          <Select value={user.role} onValueChange={(v) => { if (v && confirm(`Change role to ${v}?`)) roleMut.mutate(v); }}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superadmin">Superadmin</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Bonus History</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                    <TableCell className="text-sm">{t.description}</TableCell>
                    <TableCell className={`text-right font-medium ${t.points >= 0 ? 'text-green-600' : 'text-destructive'}`}>{t.points > 0 ? '+' : ''}{t.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Bonus Points</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); bonusMut.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Points (positive to add, negative to deduct)</Label>
              <Input type="number" value={bonusPoints} onChange={(e) => updateBonusPoints(e.target.value)} required placeholder="e.g., 100 or -50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus-gel">Lari equivalent (GEL)</Label>
              <Input
                id="bonus-gel"
                type="number"
                step="0.01"
                value={bonusGel}
                onChange={(e) => updateBonusGel(e.target.value)}
                placeholder="e.g., 1.00 or -0.50"
              />
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Enter either value — 1 GEL equals 100 bonus points.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={bonusDesc} onChange={(e) => setBonusDesc(e.target.value)} required placeholder="Reason for adjustment" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setBonusOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={bonusMut.isPending}>{bonusMut.isPending ? 'Saving...' : 'Apply'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bonus Points Discount Calculator</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-gel">Purchase total (GEL)</Label>
              <Input
                id="purchase-gel"
                type="number"
                min="0.01"
                step="0.01"
                value={purchaseGel}
                onChange={(e) => setPurchaseGel(e.target.value)}
                placeholder="e.g., 80.00"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="redemption-points">Points to use</Label>
                <Button type="button" variant="outline" size="sm" onClick={useAvailablePoints} disabled={!hasValidPurchase || user.bonusPoints <= 0}>
                  Use available points
                </Button>
              </div>
              <Input
                id="redemption-points"
                type="number"
                min="0"
                step="1"
                value={redemptionPoints}
                onChange={(e) => setRedemptionPoints(e.target.value)}
                placeholder="e.g., 100"
              />
              <p className="text-xs text-muted-foreground">
                {usablePoints.toLocaleString()} / {user.bonusPoints.toLocaleString()} available points will be used.
              </p>
            </div>

            {hasValidPurchase && redemptionPoints.trim() !== '' && (
              <div className="space-y-2 rounded-lg bg-muted p-4 text-sm" aria-live="polite">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Points used</span><span className="font-medium">{usablePoints.toLocaleString()}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Discount</span><span className="font-medium">{discountGel.toFixed(2)} GEL</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Discount percentage</span><span className="font-medium">{discountPercent.toFixed(2)}%</span></div>
                <div className="flex justify-between gap-4 border-t pt-2"><span className="text-muted-foreground">Customer pays</span><span className="font-semibold">{amountToPay.toFixed(2)} GEL</span></div>
                {requestedRedemptionPoints > usablePoints && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    Points are limited by the user's available balance and cannot exceed the purchase total.
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">Preview only — this does not deduct points.</p>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setDiscountOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
