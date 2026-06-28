import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Truck, Gift, MessageSquare, Plus, Trash2, RefreshCw, Smartphone } from 'lucide-react';
import { getSettings, updateSettings } from '@/api/settings';
import { getLoyaltyResetStatus, runLoyaltyReset } from '@/api/loyalty';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function normalizeGeorgianPhone(raw: string): string | null {
  const digits = raw.trim().replace(/[\s\-()]/g, '').replace(/^\+/, '');
  const withoutCountryCode = digits.startsWith('995') ? digits.slice(3) : digits;
  if (/^5\d{8}$/.test(withoutCountryCode)) return withoutCountryCode;
  return null;
}

function displayPhone(normalized: string): string {
  // 5XXYYZZZZZ → +995 5XX YY ZZ ZZZ
  if (!/^5\d{8}$/.test(normalized)) return normalized;
  return `+995 ${normalized.slice(0, 3)} ${normalized.slice(3, 5)} ${normalized.slice(5, 7)} ${normalized.slice(7)}`;
}

// Dotted numeric version like "1.0.3" (1–4 segments) — mirrors VERSION_PATTERN on the backend.
const VERSION_PATTERN = /^\d+(\.\d+){0,3}$/;

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const { data: loyaltyStatus } = useQuery({ queryKey: ['loyalty-reset-status'], queryFn: getLoyaltyResetStatus });

  const [deliveryFee, setDeliveryFee] = useState<string>('');
  const [freeDeliveryDays, setFreeDeliveryDays] = useState<string>('');
  const [minIosVersion, setMinIosVersion] = useState<string>('');
  const [minAndroidVersion, setMinAndroidVersion] = useState<string>('');
  const [iosStoreUrl, setIosStoreUrl] = useState<string>('');
  const [androidStoreUrl, setAndroidStoreUrl] = useState<string>('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState<string>('');
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState<{ processed: number } | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setDeliveryFee(String(settings.deliveryFee));
    setFreeDeliveryDays(String(settings.freeDeliveryDays));
    setMinIosVersion(settings.minIosVersion ?? '');
    setMinAndroidVersion(settings.minAndroidVersion ?? '');
    setIosStoreUrl(settings.iosStoreUrl ?? '');
    setAndroidStoreUrl(settings.androidStoreUrl ?? '');
    setRecipients(settings.orderNotificationRecipients ?? []);
  }, [settings]);

  const recipientsDirty = useMemo(() => {
    const a = recipients.join(',');
    const b = (settings?.orderNotificationRecipients ?? []).join(',');
    return a !== b;
  }, [recipients, settings]);

  function handleAddRecipient(): void {
    const normalized = normalizeGeorgianPhone(newRecipient);
    if (!normalized) {
      setRecipientError('Enter a valid Georgian mobile number (e.g. 555 12 34 56 or +995 555 12 34 56)');
      return;
    }
    if (recipients.includes(normalized)) {
      setRecipientError('This number is already in the list.');
      return;
    }
    setRecipientError(null);
    setRecipients((prev) => [...prev, normalized]);
    setNewRecipient('');
  }

  function handleRemoveRecipient(value: string): void {
    setRecipients((prev) => prev.filter((p) => p !== value));
  }

  const mutation = useMutation({
    mutationFn: () => {
      setError(null);
      const fee = Number(deliveryFee);
      const days = Number(freeDeliveryDays);

      if (!Number.isFinite(fee) || fee < 0) {
        throw new Error('Delivery fee must be a non-negative number');
      }
      if (!Number.isInteger(days) || days < 0) {
        throw new Error('Free delivery days must be a non-negative integer');
      }

      const ios = minIosVersion.trim();
      const android = minAndroidVersion.trim();
      if (!VERSION_PATTERN.test(ios)) {
        throw new Error('Minimum iOS version must look like 1.0.3');
      }
      if (!VERSION_PATTERN.test(android)) {
        throw new Error('Minimum Android version must look like 1.0.3');
      }

      return updateSettings({
        deliveryFee: fee,
        freeDeliveryDays: days,
        orderNotificationRecipients: recipients,
        minIosVersion: ios,
        minAndroidVersion: android,
        iosStoreUrl: iosStoreUrl.trim(),
        androidStoreUrl: androidStoreUrl.trim(),
      });
    },
    onSuccess: (next) => {
      qc.setQueryData(['settings'], next);
      setSavedAt(new Date());
    },
    onError: (err: Error) => {
      const message = err instanceof Error ? err.message : 'Could not save settings';
      setError(message);
    },
  });

  const resetMutation = useMutation({
    mutationFn: runLoyaltyReset,
    onSuccess: (res) => {
      setResetError(null);
      setResetDone({ processed: res.processed });
      qc.invalidateQueries({ queryKey: ['loyalty-reset-status'] });
    },
    onError: (err: Error) => {
      setResetError(err instanceof Error ? err.message : 'Could not reset tiers');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure storefront-wide rules. Changes apply to every new order.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Truck className="h-4 w-4" />
            Delivery
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deliveryFee">Delivery fee (GEL)</Label>
              <Input
                id="deliveryFee"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                disabled={isLoading || mutation.isPending}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Charged once the user's free-delivery window ends. Set to 0 to keep delivery free for everyone.
              </p>
            </div>
            <div>
              <Label htmlFor="freeDeliveryDays" className="flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5" /> Free delivery (days from sign-up)
              </Label>
              <Input
                id="freeDeliveryDays"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={freeDeliveryDays}
                onChange={(e) => setFreeDeliveryDays(e.target.value)}
                disabled={isLoading || mutation.isPending}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Every new account gets this many days of free delivery after registering. 90 = roughly 3 months.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : settings ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Current delivery fee</dt>
                <dd className="font-medium">₾ {settings.deliveryFee.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Free delivery window</dt>
                <dd className="font-medium">{settings.freeDeliveryDays} days</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">SMS recipients</dt>
                <dd className="font-medium">{settings.orderNotificationRecipients?.length ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Min version (iOS / Android)</dt>
                <dd className="font-medium">{settings.minIosVersion} / {settings.minAndroidVersion}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Last updated</dt>
                <dd className="font-medium">
                  {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No settings yet.</p>
          )}
        </section>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Smartphone className="h-4 w-4" />
          Force app update
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Any app below the minimum version is blocked on launch and sent to the store. Keep the default
          (1.0.0) to force nothing. Only apps that already contain the update gate are affected — users on
          older builds without it must update through the store as usual.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="minIosVersion">Minimum iOS version</Label>
            <Input
              id="minIosVersion"
              placeholder="1.0.3"
              value={minIosVersion}
              onChange={(e) => setMinIosVersion(e.target.value)}
              disabled={isLoading || mutation.isPending}
            />
          </div>
          <div>
            <Label htmlFor="minAndroidVersion">Minimum Android version</Label>
            <Input
              id="minAndroidVersion"
              placeholder="1.0.3"
              value={minAndroidVersion}
              onChange={(e) => setMinAndroidVersion(e.target.value)}
              disabled={isLoading || mutation.isPending}
            />
          </div>
          <div>
            <Label htmlFor="iosStoreUrl">iOS store URL</Label>
            <Input
              id="iosStoreUrl"
              placeholder="https://apps.apple.com/app/id…"
              value={iosStoreUrl}
              onChange={(e) => setIosStoreUrl(e.target.value)}
              disabled={isLoading || mutation.isPending}
            />
          </div>
          <div>
            <Label htmlFor="androidStoreUrl">Android store URL</Label>
            <Input
              id="androidStoreUrl"
              placeholder="https://play.google.com/store/apps/details?id=…"
              value={androidStoreUrl}
              onChange={(e) => setAndroidStoreUrl(e.target.value)}
              disabled={isLoading || mutation.isPending}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The store URL must be set for that platform, otherwise the update is not forced (fail-open).
        </p>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          Loyalty tiers
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          At the start of each year, recalculate every customer's loyalty tier from last year's spending.
          Active customers update on their own; this rolls over everyone, including people who haven't opened the app.
        </p>
        {loyaltyStatus?.resetPending ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              {loyaltyStatus.bypassGate ? (
                'Reset gate bypassed (test mode) — you can run this any time.'
              ) : (
                <>New year (<span className="font-medium">{loyaltyStatus.currentYear}</span>) — tiers haven't been reset yet.</>
              )}
            </p>
            <Button onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${resetMutation.isPending ? 'animate-spin' : ''}`} />
              {resetMutation.isPending ? 'Resetting…' : `Reset tiers for ${loyaltyStatus.currentYear}`}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tiers are up to date for {loyaltyStatus?.currentYear ?? new Date().getFullYear()}
            {loyaltyStatus?.lastSweepYear ? ` · last reset ${loyaltyStatus.lastSweepYear}` : ''}. No action needed.
          </p>
        )}
        {resetDone && (
          <p className="mt-3 text-xs text-emerald-600">Done — {resetDone.processed} customers recalculated.</p>
        )}
        {resetError && (
          <p className="mt-3 text-xs text-destructive">{resetError}</p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          Order SMS recipients
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Every Georgian mobile number listed here receives an SMS once an order is confirmed
          (payment received). The SMS includes the order number, customer name, customer phone, and total.
        </p>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="+995 555 12 34 56"
              value={newRecipient}
              onChange={(e) => { setNewRecipient(e.target.value); if (recipientError) setRecipientError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRecipient(); } }}
              disabled={isLoading || mutation.isPending}
            />
            <Button type="button" variant="secondary" onClick={handleAddRecipient} disabled={isLoading || mutation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Add number
            </Button>
          </div>
          {recipientError && (
            <p className="text-xs text-destructive">{recipientError}</p>
          )}

          {recipients.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              No SMS recipients yet. Add a number above to start receiving order alerts.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {recipients.map((phone) => (
                <li key={phone} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-medium">{displayPhone(phone)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRecipient(phone)}
                    disabled={mutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {recipientsDirty && (
          <span className="text-xs text-amber-600">Unsaved recipient changes</span>
        )}
        {savedAt && !mutation.isPending && (
          <span className="text-xs text-muted-foreground">
            Saved at {savedAt.toLocaleTimeString()}
          </span>
        )}
        <Button onClick={() => mutation.mutate()} disabled={isLoading || mutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
