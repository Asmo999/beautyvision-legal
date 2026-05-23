import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBanner,
  deleteBannerImage,
  getBanner,
  updateBanner,
  uploadBannerImage,
} from '@/api/banners';
import type { Banner } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mediaUrl } from '@/lib/urls';
import { ArrowLeft, ImageOff, Upload, X } from 'lucide-react';

const DEFAULT_COLORS: [string, string, string] = ['#2e1a0e', '#6b3a1a', '#9a6b4b'];
const EMPTY_TARGET = '__none__';
const CIRCLE_VARIANTS = [
  { label: 'Circle number', value: 'circle' },
  { label: 'Compact text', value: 'compact' },
] as const;
const TARGET_OPTIONS = [
  { label: 'No link', value: EMPTY_TARGET },
  { label: 'Shop all (/shop)', value: '/shop' },
  { label: 'Popular products (/shop?sort=popular)', value: '/shop?sort=popular' },
  { label: 'New arrivals (/shop?sort=newest)', value: '/shop?sort=newest' },
  { label: 'Promotions (/shop?sort=promotions)', value: '/shop?sort=promotions' },
  { label: 'Skincare brands (/brands?category=skincare)', value: '/brands?category=skincare' },
  { label: 'Haircare brands (/brands?category=haircare)', value: '/brands?category=haircare' },
  { label: 'Fragrance (/shop?category=fragrance)', value: '/shop?category=fragrance' },
  { label: 'Makeup (/shop?category=makeup)', value: '/shop?category=makeup' },
  { label: 'Bodycare (/shop?category=bodycare)', value: '/shop?category=bodycare' },
  { label: 'Cart (/cart)', value: '/cart' },
  { label: 'Wallet (/wallet)', value: '/wallet' },
  { label: 'Orders (/orders)', value: '/orders' },
  { label: 'Profile (/profile)', value: '/profile' },
];

interface BannerForm {
  title: string;
  titleKa: string;
  titleAccent: string;
  titleAccentKa: string;
  subtitle: string;
  subtitleKa: string;
  badge: string;
  badgeKa: string;
  textBackgroundColor: string;
  textBackgroundOpacity: number;
  ctaText: string;
  ctaTextKa: string;
  ctaTextBackgroundColor: string;
  ctaTextBackgroundOpacity: number;
  circleText: string;
  circleTextKa: string;
  circleTextVariant: 'circle' | 'compact';
  circleTextBackgroundColor: string;
  circleTextBackgroundOpacity: number;
  targetPath: string;
  showText: boolean;
  isActive: boolean;
  sortOrder: number;
  color1: string;
  color2: string;
  color3: string;
}

const emptyForm: BannerForm = {
  title: '',
  titleKa: '',
  titleAccent: '',
  titleAccentKa: '',
  subtitle: '',
  subtitleKa: '',
  badge: '',
  badgeKa: '',
  textBackgroundColor: '#000000',
  textBackgroundOpacity: 0,
  ctaText: 'Shop now',
  ctaTextKa: '',
  ctaTextBackgroundColor: '#ffffff',
  ctaTextBackgroundOpacity: 15,
  circleText: '',
  circleTextKa: '',
  circleTextVariant: 'circle',
  circleTextBackgroundColor: '#ffffff',
  circleTextBackgroundOpacity: 6,
  targetPath: '/shop',
  showText: true,
  isActive: true,
  sortOrder: 0,
  color1: DEFAULT_COLORS[0],
  color2: DEFAULT_COLORS[1],
  color3: DEFAULT_COLORS[2],
};

function toForm(banner: Banner): BannerForm {
  return {
    title: banner.translations?.en?.title ?? banner.title,
    titleKa: banner.translations?.ka?.title ?? '',
    titleAccent: banner.translations?.en?.titleAccent ?? banner.titleAccent ?? '',
    titleAccentKa: banner.translations?.ka?.titleAccent ?? '',
    subtitle: banner.translations?.en?.subtitle ?? banner.subtitle ?? '',
    subtitleKa: banner.translations?.ka?.subtitle ?? '',
    badge: banner.translations?.en?.badge ?? banner.badge ?? '',
    badgeKa: banner.translations?.ka?.badge ?? '',
    textBackgroundColor: banner.textBackgroundColor ?? '#000000',
    textBackgroundOpacity: banner.textBackgroundOpacity ?? 0,
    ctaText: banner.translations?.en?.ctaText ?? banner.ctaText ?? '',
    ctaTextKa: banner.translations?.ka?.ctaText ?? '',
    ctaTextBackgroundColor: banner.ctaTextBackgroundColor ?? '#ffffff',
    ctaTextBackgroundOpacity: banner.ctaTextBackgroundOpacity ?? 15,
    circleText: banner.translations?.en?.circleText ?? banner.circleText ?? '',
    circleTextKa: banner.translations?.ka?.circleText ?? '',
    circleTextVariant: banner.circleTextVariant ?? 'circle',
    circleTextBackgroundColor: banner.circleTextBackgroundColor ?? '#ffffff',
    circleTextBackgroundOpacity: banner.circleTextBackgroundOpacity ?? 6,
    targetPath: banner.targetPath ?? '',
    showText: banner.showText,
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
    color1: banner.colors[0] ?? DEFAULT_COLORS[0],
    color2: banner.colors[1] ?? DEFAULT_COLORS[1],
    color3: banner.colors[2] ?? DEFAULT_COLORS[2],
  };
}

function optionalText(value: string): string | null {
  const text = value.trim();
  return text ? text : null;
}

function toPayload(form: BannerForm): Partial<Banner> {
  return {
    title: form.title.trim() || form.titleKa.trim(),
    titleAccent: optionalText(form.titleAccent),
    subtitle: optionalText(form.subtitle),
    badge: optionalText(form.badge),
    textBackgroundColor: form.textBackgroundColor || '#000000',
    textBackgroundOpacity: form.textBackgroundOpacity,
    ctaText: optionalText(form.ctaText),
    ctaTextBackgroundColor: form.ctaTextBackgroundColor || '#ffffff',
    ctaTextBackgroundOpacity: form.ctaTextBackgroundOpacity,
    circleText: optionalText(form.circleText),
    circleTextVariant: form.circleTextVariant,
    circleTextBackgroundColor: form.circleTextBackgroundColor || '#ffffff',
    circleTextBackgroundOpacity: form.circleTextBackgroundOpacity,
    translations: {
      en: {
        title: optionalText(form.title),
        titleAccent: optionalText(form.titleAccent),
        subtitle: optionalText(form.subtitle),
        badge: optionalText(form.badge),
        ctaText: optionalText(form.ctaText),
        circleText: optionalText(form.circleText),
      },
      ka: {
        title: optionalText(form.titleKa),
        titleAccent: optionalText(form.titleAccentKa),
        subtitle: optionalText(form.subtitleKa),
        badge: optionalText(form.badgeKa),
        ctaText: optionalText(form.ctaTextKa),
        circleText: optionalText(form.circleTextKa),
      },
    },
    targetPath: optionalText(form.targetPath),
    showText: form.showText,
    isActive: form.isActive,
    sortOrder: form.sortOrder,
    colors: [form.color1, form.color2, form.color3],
  };
}

function getErrorMessage(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
}

export default function BannerEditPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const saveModeRef = useRef<'stay' | 'close'>('stay');

  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [error, setError] = useState('');

  const { data: banner, isLoading } = useQuery({
    queryKey: ['banner', id],
    queryFn: () => getBanner(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm);
      return;
    }

    if (banner) setForm(toForm(banner));
  }, [banner, isNew]);

  const saveMutation = useMutation({
    mutationFn: (mode: 'stay' | 'close') => {
      const payload = toPayload(form);
      return (isNew ? createBanner(payload) : updateBanner(id!, payload)).then((savedBanner) => ({
        banner: savedBanner,
        mode,
      }));
    },
    onSuccess: ({ banner: savedBanner, mode }) => {
      setError('');
      qc.invalidateQueries({ queryKey: ['banners'] });
      qc.setQueryData(['banner', savedBanner._id], savedBanner);
      if (id) qc.setQueryData(['banner', id], savedBanner);

      if (mode === 'close') {
        navigate('/banners');
      } else if (isNew) {
        navigate(`/banners/${savedBanner._id}`, { replace: true });
      }
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadBannerImage(id!, file),
    onSuccess: (savedBanner) => {
      qc.invalidateQueries({ queryKey: ['banners'] });
      qc.setQueryData(['banner', savedBanner._id], savedBanner);
      if (id) qc.setQueryData(['banner', id], savedBanner);
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: () => deleteBannerImage(id!),
    onSuccess: (savedBanner) => {
      qc.invalidateQueries({ queryKey: ['banners'] });
      qc.setQueryData(['banner', savedBanner._id], savedBanner);
      if (id) qc.setQueryData(['banner', id], savedBanner);
    },
  });

  const set = <K extends keyof BannerForm>(key: K, value: BannerForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const targetOptions = form.targetPath && !TARGET_OPTIONS.some((option) => option.value === form.targetPath)
    ? [...TARGET_OPTIONS, { label: `Current (${form.targetPath})`, value: form.targetPath }]
    : TARGET_OPTIONS;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && id) uploadMutation.mutate(file);
    event.target.value = '';
  };

  if (!isNew && isLoading) {
    return <div className="text-sm text-muted-foreground">Loading banner...</div>;
  }

  return (
    <div className="max-w-5xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/banners')}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Banners
      </Button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">{isNew ? 'New Banner' : 'Edit Banner'}</h1>

      {error && <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const mode = saveModeRef.current;
          saveModeRef.current = 'stay';
          setError('');
          saveMutation.mutate(mode);
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader><CardTitle>Content</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title (EN)</Label>
              <Input value={form.title} onChange={(event) => set('title', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Title (KA)</Label>
              <Input value={form.titleKa} onChange={(event) => set('titleKa', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Accent Line (EN)</Label>
              <Input value={form.titleAccent} onChange={(event) => set('titleAccent', event.target.value)} placeholder="30% off" />
            </div>
            <div className="space-y-2">
              <Label>Accent Line (KA)</Label>
              <Input value={form.titleAccentKa} onChange={(event) => set('titleAccentKa', event.target.value)} placeholder="30% off" />
            </div>
            <div className="space-y-2">
              <Label>Badge (EN)</Label>
              <Input value={form.badge} onChange={(event) => set('badge', event.target.value)} placeholder="Seasonal offer" />
            </div>
            <div className="space-y-2">
              <Label>Badge (KA)</Label>
              <Input value={form.badgeKa} onChange={(event) => set('badgeKa', event.target.value)} placeholder="Seasonal offer" />
            </div>
            <div className="space-y-2">
              <Label>Subtitle (EN)</Label>
              <Input value={form.subtitle} onChange={(event) => set('subtitle', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle (KA)</Label>
              <Input value={form.subtitleKa} onChange={(event) => set('subtitleKa', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CTA Text (EN)</Label>
              <Input value={form.ctaText} onChange={(event) => set('ctaText', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CTA Text (KA)</Label>
              <Input value={form.ctaTextKa} onChange={(event) => set('ctaTextKa', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Circle Text (EN)</Label>
              <Input value={form.circleText} onChange={(event) => set('circleText', event.target.value)} placeholder="30%" />
            </div>
            <div className="space-y-2">
              <Label>Circle Text (KA)</Label>
              <Input value={form.circleTextKa} onChange={(event) => set('circleTextKa', event.target.value)} placeholder="30%" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Text Block Background</Label>
              <Input type="color" value={form.textBackgroundColor} onChange={(event) => set('textBackgroundColor', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Text Block Background Opacity (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.textBackgroundOpacity}
                onChange={(event) => set('textBackgroundOpacity', Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA Background</Label>
              <Input type="color" value={form.ctaTextBackgroundColor} onChange={(event) => set('ctaTextBackgroundColor', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CTA Background Opacity (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.ctaTextBackgroundOpacity}
                onChange={(event) => set('ctaTextBackgroundOpacity', Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Circle Text Style</Label>
              <Select value={form.circleTextVariant} onValueChange={(value) => set('circleTextVariant', value === 'compact' ? 'compact' : 'circle')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CIRCLE_VARIANTS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Circle Background</Label>
              <Input type="color" value={form.circleTextBackgroundColor} onChange={(event) => set('circleTextBackgroundColor', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Circle Background Opacity (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.circleTextBackgroundOpacity}
                onChange={(event) => set('circleTextBackgroundOpacity', Number(event.target.value))}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:col-span-2">
              <div className="space-y-2">
                <Label>Color 1</Label>
                <Input type="color" value={form.color1} onChange={(event) => set('color1', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Color 2</Label>
                <Input type="color" value={form.color2} onChange={(event) => set('color2', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Color 3</Label>
                <Input type="color" value={form.color3} onChange={(event) => set('color3', event.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Routing & Visibility</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Path</Label>
              <Select
                value={form.targetPath || EMPTY_TARGET}
                onValueChange={(value) => set('targetPath', value && value !== EMPTY_TARGET ? value : '')}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {targetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', Number(event.target.value))} />
            </div>
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(event) => set('isActive', event.target.checked)} className="rounded" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.showText} onChange={(event) => set('showText', event.target.checked)} className="rounded" />
                Show text
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Image</CardTitle></CardHeader>
          <CardContent>
            {!isNew && banner ? (
              <div className="flex flex-wrap items-center gap-3">
                {banner.imageUrl ? (
                  <img src={mediaUrl(banner.imageUrl)} alt={banner.title} className="h-24 w-48 rounded-lg border object-cover" />
                ) : (
                  <div className="flex h-24 w-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
                    <ImageOff className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" disabled={uploadMutation.isPending} onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  {uploadMutation.isPending ? 'Uploading...' : banner.imageUrl ? 'Replace' : 'Upload'}
                </Button>
                {banner.imageUrl && (
                  <Button type="button" variant="destructive" size="icon-sm" disabled={removeImageMutation.isPending} onClick={() => removeImageMutation.mutate()}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                <input ref={fileRef} type="file" accept="image/png,image/webp" className="hidden" onChange={handleFileChange} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Save the banner first, then you can upload a PNG or WebP image.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/banners')}>Cancel</Button>
          <Button type="submit" disabled={saveMutation.isPending} onClick={() => { saveModeRef.current = 'stay'; }}>
            {saveMutation.isPending ? 'Saving...' : 'Save Banner'}
          </Button>
          <Button type="submit" disabled={saveMutation.isPending} onClick={() => { saveModeRef.current = 'close'; }}>
            {saveMutation.isPending ? 'Saving...' : 'Save & Close'}
          </Button>
        </div>
      </form>
    </div>
  );
}
