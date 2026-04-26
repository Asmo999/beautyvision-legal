import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProduct, createProduct, updateProduct } from '@/api/products';
import { listCategories } from '@/api/categories';
import { listBrands } from '@/api/brands';
import type { Brand, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import ImageUpload from '@/components/products/ImageUpload';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface FormState {
  name: string; slug: string; brand: string; category: string;
  price: string; oldPrice: string; description: string; ingredients: string;
  howToUse: string; sizes: string; tag: string; tagLabel: string;
  inStock: boolean; isActive: boolean; icon: string;
  color1: string; color2: string;
}

const emptyForm: FormState = {
  name: '', slug: '', brand: '', category: '',
  price: '', oldPrice: '', description: '', ingredients: '',
  howToUse: '', sizes: '', tag: '', tagLabel: '',
  inStock: true, isActive: true, icon: 'circle',
  color1: '#000000', color2: '#333333',
};

export default function ProductEditPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !isNew,
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: listBrands });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        brand: typeof product.brand === 'string' ? product.brand : (product.brand as Brand)._id,
        category: typeof product.category === 'string' ? product.category : (product.category as Category)._id,
        price: String(product.price),
        oldPrice: product.oldPrice ? String(product.oldPrice) : '',
        description: product.description ?? '',
        ingredients: product.ingredients ?? '',
        howToUse: product.howToUse ?? '',
        sizes: product.sizes.join(', '),
        tag: product.tag ?? '',
        tagLabel: product.tagLabel ?? '',
        inStock: product.inStock,
        isActive: product.isActive,
        icon: product.icon,
        color1: product.colors[0],
        color2: product.colors[1],
      });
      setImages(product.images);
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        slug: form.slug,
        brand: form.brand,
        category: form.category,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        description: form.description || null,
        ingredients: form.ingredients || null,
        howToUse: form.howToUse || null,
        sizes: form.sizes ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        tag: form.tag || null,
        tagLabel: form.tagLabel || null,
        inStock: form.inStock,
        isActive: form.isActive,
        icon: form.icon,
        colors: [form.color1, form.color2],
        images,
      };
      return isNew ? createProduct(payload) : updateProduct(id!, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      setError(msg);
    },
  });

  const set = (key: keyof FormState, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/products')}>
        <ArrowLeft className="mr-1 h-4 w-4" />Back to Products
      </Button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">{isNew ? 'New Product' : 'Edit Product'}</h1>

      {error && <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => { set('name', e.target.value); if (isNew) set('slug', slugify(e.target.value)); }} required />
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
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Price (GEL)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Old Price</Label>
              <Input type="number" step="0.01" value={form.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} placeholder="For sale items" />
            </div>
            <div className="space-y-2">
              <Label>Sizes (comma-separated)</Label>
              <Input value={form.sizes} onChange={(e) => set('sizes', e.target.value)} placeholder="15 ml, 30 ml, 60 ml" />
            </div>
            <div className="flex items-center gap-4 sm:col-span-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.inStock} onChange={(e) => set('inStock', e.target.checked)} className="rounded" />
                In Stock
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="rounded" />
                Active
              </label>
            </div>
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
              <Label>Tag Label</Label>
              <Input value={form.tagLabel} onChange={(e) => set('tagLabel', e.target.value)} placeholder="Best, New, -20%" />
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
            apiBase={API_BASE}
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ingredients</Label>
              <Textarea rows={3} value={form.ingredients} onChange={(e) => set('ingredients', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>How to Use</Label>
              <Textarea rows={3} value={form.howToUse} onChange={(e) => set('howToUse', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/products')}>Cancel</Button>
          <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save Product'}</Button>
        </div>
      </form>
    </div>
  );
}
