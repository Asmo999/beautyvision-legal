import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProduct, createProduct, updateProduct } from '@/api/products';
import { listCategories } from '@/api/categories';
import { listBrands } from '@/api/brands';
import type { Brand, Category, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import ImageUpload from '@/components/products/ImageUpload';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

type BalanceNomenclatureForm = {
  size: string | null;
  nomenclatureId: string;
};

interface FormState {
  name: string; nameKa: string; slug: string; brand: string; category: string;
  price: string; oldPrice: string;
  description: string; descriptionKa: string;
  ingredients: string; ingredientsKa: string;
  howToUse: string; howToUseKa: string;
  variants: VariantForm[]; tag: string; tagLabel: string; tagLabelKa: string;
  inStock: boolean; isActive: boolean; isPopular: boolean; isNewArrival: boolean; icon: string;
  color1: string; color2: string;
  balanceNomenclatures: BalanceNomenclatureForm[];
}

interface VariantForm {
  size: string;
  price: string;
  oldPrice: string;
  isDefault: boolean;
}

const emptyForm: FormState = {
  name: '', nameKa: '', slug: '', brand: '', category: '',
  price: '', oldPrice: '',
  description: '', descriptionKa: '',
  ingredients: '', ingredientsKa: '',
  howToUse: '', howToUseKa: '',
  variants: [], tag: '', tagLabel: '', tagLabelKa: '',
  inStock: true, isActive: true, isPopular: false, isNewArrival: false, icon: 'circle',
  color1: '#000000', color2: '#333333',
  balanceNomenclatures: [],
};

function formatMoney(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

function getDiscountPercent(price: number, oldPrice: number | null): number | null {
  if (!oldPrice || oldPrice <= price || oldPrice <= 0) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function parseVariants(variants: VariantForm[]) {
  return variants
    .map((variant) => ({
      size: variant.size.trim(),
      price: Number(variant.price),
      oldPrice: variant.oldPrice ? Number(variant.oldPrice) : null,
      isDefault: variant.isDefault,
    }))
    .filter((variant) => variant.size && Number.isFinite(variant.price) && variant.price > 0)
    .map((variant, index, variants) => {
      const defaultIndex = variants.findIndex((entry) => entry.isDefault);
      return {
        ...variant,
        isDefault: index === (defaultIndex >= 0 ? defaultIndex : 0),
      };
    });
}

function normalizeSize(size: string | null | undefined): string | null {
  return size?.trim() || null;
}

function getBalanceRows(form: FormState): BalanceNomenclatureForm[] {
  const sizes = parseVariants(form.variants).map((variant) => variant.size);
  const lookup = new Map(
    form.balanceNomenclatures.map((entry) => [normalizeSize(entry.size), entry.nomenclatureId]),
  );

  if (sizes.length === 0) {
    return [{ size: null, nomenclatureId: lookup.get(null) ?? '' }];
  }

  return sizes.map((size) => ({
    size,
    nomenclatureId: lookup.get(size) ?? '',
  }));
}

export default function ProductEditPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const saveModeRef = useRef<'stay' | 'close'>('stay');

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !isNew,
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: listBrands });

  useEffect(() => {
    if (product) {
      const defaultVariantIndex = product.variants?.findIndex((variant) => variant.isDefault === true) ?? -1;
      const variants = product.variants?.length
        ? product.variants.map((variant, index) => ({
            size: variant.size,
            price: formatMoney(variant.price),
            oldPrice: variant.oldPrice ? formatMoney(variant.oldPrice) : '',
            isDefault: index === (defaultVariantIndex >= 0 ? defaultVariantIndex : 0),
          }))
        : product.sizes.map((size, index) => ({
            size,
            price: formatMoney(product.price),
            oldPrice: product.oldPrice ? formatMoney(product.oldPrice) : '',
            isDefault: index === 0,
          }));

      setForm({
        name: product.translations?.en?.name ?? product.name,
        nameKa: product.translations?.ka?.name ?? '',
        slug: product.slug,
        brand: typeof product.brand === 'string' ? product.brand : (product.brand as Brand)._id,
        category: typeof product.category === 'string' ? product.category : (product.category as Category)._id,
        price: String(product.price),
        oldPrice: product.oldPrice ? String(product.oldPrice) : '',
        description: product.translations?.en?.description ?? product.description ?? '',
        descriptionKa: product.translations?.ka?.description ?? '',
        ingredients: product.translations?.en?.ingredients ?? product.ingredients ?? '',
        ingredientsKa: product.translations?.ka?.ingredients ?? '',
        howToUse: product.translations?.en?.howToUse ?? product.howToUse ?? '',
        howToUseKa: product.translations?.ka?.howToUse ?? '',
        variants,
        tag: product.tag ?? '',
        tagLabel: product.translations?.en?.tagLabel ?? product.tagLabel ?? '',
        tagLabelKa: product.translations?.ka?.tagLabel ?? '',
        inStock: product.inStock,
        isActive: product.isActive,
        isPopular: product.isPopular ?? false,
        isNewArrival: product.isNewArrival ?? false,
        icon: product.icon,
        color1: product.colors[0],
        color2: product.colors[1],
        balanceNomenclatures: product.balanceNomenclatures ?? [],
      });
      setImages(product.images);
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: (mode: 'stay' | 'close') => {
      const variants = parseVariants(form.variants);
      const canonicalName = form.name.trim() || form.nameKa.trim();
      const payload = {
        name: canonicalName,
        slug: form.slug,
        brand: form.brand,
        category: form.category,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        description: form.description || null,
        ingredients: form.ingredients || null,
        howToUse: form.howToUse || null,
        translations: {
          en: {
            name: form.name || null,
            description: form.description || null,
            ingredients: form.ingredients || null,
            howToUse: form.howToUse || null,
            tagLabel: form.tagLabel || null,
          },
          ka: {
            name: form.nameKa || null,
            description: form.descriptionKa || null,
            ingredients: form.ingredientsKa || null,
            howToUse: form.howToUseKa || null,
            tagLabel: form.tagLabelKa || null,
          },
        },
        sizes: variants.map((variant) => variant.size),
        variants,
        balanceNomenclatures: getBalanceRows(form)
          .map((entry) => ({
            size: entry.size,
            nomenclatureId: entry.nomenclatureId.trim(),
          }))
          .filter((entry) => entry.nomenclatureId),
        tag: form.tag || null,
        tagLabel: form.tagLabel || null,
        inStock: form.inStock,
        isActive: form.isActive,
        isPopular: form.isPopular,
        isNewArrival: form.isNewArrival,
        icon: form.icon,
        colors: [form.color1, form.color2],
        images,
      };
      return (isNew ? createProduct(payload) : updateProduct(id!, payload)).then((product) => ({ product, mode }));
    },
    onSuccess: ({ product, mode }: { product: Product; mode: 'stay' | 'close' }) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.setQueryData(['product', product._id], product);
      if (id) qc.setQueryData(['product', id], product);

      if (mode === 'close') {
        navigate('/products');
      } else if (isNew) {
        navigate(`/products/${product._id}`, { replace: true });
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      setError(msg);
    },
  });

  const set = (key: keyof FormState, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  const setVariant = (index: number, key: keyof VariantForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) => i === index ? { ...variant, [key]: value } : variant),
    }));
  };
  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { size: '', price: prev.price, oldPrice: prev.oldPrice, isDefault: prev.variants.length === 0 },
      ],
    }));
  };
  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };
  const setDefaultVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) => ({ ...variant, isDefault: i === index })),
    }));
  };
  const basePrice = Number(form.price);
  const baseOldPrice = form.oldPrice ? Number(form.oldPrice) : null;
  const baseDiscount = Number.isFinite(basePrice) ? getDiscountPercent(basePrice, baseOldPrice) : null;
  const setBalanceNomenclature = (size: string | null, nomenclatureId: string) => {
    const normalizedSize = normalizeSize(size);
    setForm((prev) => ({
      ...prev,
      balanceNomenclatures: [
        ...prev.balanceNomenclatures.filter((entry) => normalizeSize(entry.size) !== normalizedSize),
        { size: normalizedSize, nomenclatureId },
      ],
    }));
  };
  const balanceRows = getBalanceRows(form);

  return (
    <div className="max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/products')}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Products
      </Button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">{isNew ? 'New Product' : 'Edit Product'}</h1>

      {error && <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const mode = saveModeRef.current;
          saveModeRef.current = 'stay';
          saveMutation.mutate(mode);
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name (EN)</Label>
              <Input value={form.name} onChange={(e) => { set('name', e.target.value); if (isNew) set('slug', slugify(e.target.value)); }} />
            </div>
            <div className="space-y-2">
              <Label>Name (KA)</Label>
              <Input value={form.nameKa} onChange={(e) => set('nameKa', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={form.brand} onValueChange={(v) => set('brand', v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>{brands.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pricing & Stock</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Base Current Price (GEL)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Base Old Price (higher)</Label>
              <Input type="number" step="0.01" value={form.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} placeholder="Before-sale price" />
            </div>
            {form.oldPrice ? (
              <div className={`text-xs sm:col-span-2 ${baseOldPrice && baseOldPrice <= basePrice ? 'text-destructive' : 'text-muted-foreground'}`}>
                {baseDiscount !== null ? `Base discount: -${baseDiscount}%` : 'Base old price must be higher than current price to show a discount.'}
              </div>
            ) : null}
            <div className="space-y-3 sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Size Prices</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="mr-1 h-3.5 w-3.5" />Add Size
                </Button>
              </div>
              {form.variants.length > 0 ? (
                <div className="space-y-2">
                  {form.variants.map((variant, index) => {
                    const price = Number(variant.price);
                    const oldPrice = variant.oldPrice ? Number(variant.oldPrice) : null;
                    const discount = Number.isFinite(price) ? getDiscountPercent(price, oldPrice) : null;

                    return (
                      <div key={index} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[90px_1fr_120px_120px_110px_32px]">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="radio"
                            name="defaultVariant"
                            checked={variant.isDefault}
                            onChange={() => setDefaultVariant(index)}
                          />
                          Default
                        </label>
                        <Input value={variant.size} onChange={(e) => setVariant(index, 'size', e.target.value)} placeholder="15 ml" />
                        <Input type="number" step="0.01" value={variant.price} onChange={(e) => setVariant(index, 'price', e.target.value)} placeholder="Current" />
                        <Input type="number" step="0.01" value={variant.oldPrice} onChange={(e) => setVariant(index, 'oldPrice', e.target.value)} placeholder="Old higher" />
                        <div className={`flex items-center text-xs ${oldPrice && oldPrice <= price ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {discount !== null ? `-${discount}%` : oldPrice && oldPrice <= price ? 'Old must be higher' : '-'}
                        </div>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeVariant(index)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.inStock} onChange={(e) => set('inStock', e.target.checked)} className="rounded" />
                In Stock
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPopular} onChange={(e) => set('isPopular', e.target.checked)} className="rounded" />
                Popular
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isNewArrival} onChange={(e) => set('isNewArrival', e.target.checked)} className="rounded" />
                New Arrival
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">1C / Balance Nomenclature</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {balanceRows.map((row) => (
              <div key={row.size ?? 'default'} className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
                <Label>{row.size ?? 'Default item'}</Label>
                <Input
                  value={row.nomenclatureId}
                  onChange={(e) => setBalanceNomenclature(row.size, e.target.value)}
                  placeholder="Balance nomenclature UUID"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tag & Appearance</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tag</Label>
              <Select value={form.tag || 'none'} onValueChange={(v) => set('tag', v === 'none' ? '' : v ?? '')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="best">Best</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tag Label (EN)</Label>
              <Input value={form.tagLabel} onChange={(e) => set('tagLabel', e.target.value)} placeholder="Best, New, -20%" />
            </div>
            <div className="space-y-2">
              <Label>Tag Label (KA)</Label>
              <Input value={form.tagLabelKa} onChange={(e) => set('tagLabelKa', e.target.value)} placeholder="ბესტსელერი, ახალი, -20%" />
            </div>
            <div className="space-y-2">
              <Label>Icon (Feather name)</Label>
              <Input value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="circle" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Color 1</Label>
                <Input type="color" value={form.color1} onChange={(e) => set('color1', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Color 2</Label>
                <Input type="color" value={form.color2} onChange={(e) => set('color2', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {!isNew && id && (
          <ImageUpload
            productId={id}
            images={images}
            onImagesChange={setImages}
          />
        )}

        {isNew && (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Save the product first, then you can upload images.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Description (EN)</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description (KA)</Label>
              <Textarea rows={3} value={form.descriptionKa} onChange={(e) => set('descriptionKa', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ingredients (EN)</Label>
              <Textarea rows={3} value={form.ingredients} onChange={(e) => set('ingredients', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ingredients (KA)</Label>
              <Textarea rows={3} value={form.ingredientsKa} onChange={(e) => set('ingredientsKa', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>How to Use (EN)</Label>
              <Textarea rows={3} value={form.howToUse} onChange={(e) => set('howToUse', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>How to Use (KA)</Label>
              <Textarea rows={3} value={form.howToUseKa} onChange={(e) => set('howToUseKa', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>Cancel</Button>
          <Button type="submit" disabled={saveMutation.isPending} onClick={() => { saveModeRef.current = 'stay'; }}>
            {saveMutation.isPending ? 'Saving...' : 'Save Product'}
          </Button>
          <Button type="submit" disabled={saveMutation.isPending} onClick={() => { saveModeRef.current = 'close'; }}>
            {saveMutation.isPending ? 'Saving...' : 'Save & Close'}
          </Button>
        </div>
      </form>
    </div>
  );
}
