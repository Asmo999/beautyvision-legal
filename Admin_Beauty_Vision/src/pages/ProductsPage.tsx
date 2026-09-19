import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { listProducts, updateProduct } from '@/api/products';
import { listCategories } from '@/api/categories';
import { listBrands } from '@/api/brands';
import type { Product, Brand, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Eye, EyeOff, Search, ImageOff } from 'lucide-react';
import { mediaUrl } from '@/lib/urls';

function formatMoney(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

function getDiscountPercent(price: number, oldPrice: number | null): number | null {
  if (!oldPrice || oldPrice <= price || oldPrice <= 0) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function getPriceSummary(product: Product): { price: string; oldPrice: string | null; discount: number | null } {
  const discount = getDiscountPercent(product.price, product.oldPrice);

  return {
    price: `${formatMoney(product.price)} GEL`,
    oldPrice: discount !== null && product.oldPrice ? `${formatMoney(product.oldPrice)} GEL` : null,
    discount,
  };
}

function getPage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const page = getPage(searchParams.get('page'));
  const search = searchParams.get('search') ?? '';
  const categoryFilter = searchParams.get('category') ?? '';
  const brandFilter = searchParams.get('brand') ?? '';
  const visibilityParam = searchParams.get('visibility');
  const visibilityFilter: 'all' | 'visible' | 'hidden' =
    visibilityParam === 'visible' || visibilityParam === 'hidden' ? visibilityParam : 'all';
  const listUrl = `${location.pathname}${location.search}`;

  const setListParam = (key: string, value: string, resetPage = false) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      if (resetPage) next.delete('page');
      return next;
    }, { replace: resetPage });
  };

  const setPage = (nextPage: number | ((current: number) => number)) => {
    const value = typeof nextPage === 'function' ? nextPage(page) : nextPage;
    setListParam('page', value > 1 ? String(value) : '');
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter, brandFilter, visibilityFilter],
    queryFn: () => listProducts({
      page, limit: 20, search: search || undefined,
      category: categoryFilter || undefined, brand: brandFilter || undefined,
      isActive: visibilityFilter === 'all' ? undefined : visibilityFilter === 'visible',
    }),
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: listBrands });

  const visibilityMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateProduct(id, { isActive }),
    onSuccess: (product) => {
      qc.setQueryData(['product', product._id], product);
      if (visibilityFilter !== 'all' && data?.products.length === 1) {
        setPage((current) => Math.max(1, current - 1));
      }
      return qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const getBrandName = (p: Product) => typeof p.brand === 'string' ? p.brand : (p.brand as Brand).name;
  const getCatName = (p: Product) => typeof p.category === 'string' ? p.category : (p.category as Category).name;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button onClick={() => navigate('/products/new', { state: { returnTo: listUrl } })} size="sm"><Plus className="mr-1 h-4 w-4" />Add Product</Button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Hide products temporarily to remove them from the customer catalog. Their details and images are kept so you can show them again.
      </p>

      {visibilityMut.isError && (
        <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Could not change product visibility. Please try again.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-8" value={search} onChange={(e) => setListParam('search', e.target.value, true)} />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setListParam('category', v === 'all' ? '' : v ?? '', true)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={(v) => setListParam('brand', v === 'all' ? '' : v ?? '', true)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={(v) => setListParam('visibility', v === 'visible' || v === 'hidden' ? v : '', true)}>
          <SelectTrigger className="w-40" aria-label="Product visibility">
            <SelectValue>{visibilityFilter === 'all' ? 'All Visibility' : visibilityFilter === 'visible' ? 'Visible' : 'Hidden'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !data?.products.length ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No products found</TableCell></TableRow>
            ) : data.products.map((p) => (
              <TableRow key={p._id} className={!p.isActive ? 'bg-muted/30' : ''}>
                <TableCell>
                  {p.images?.[0] ? (
                    <img src={mediaUrl(p.images[0])} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{getBrandName(p)}</TableCell>
                <TableCell>{getCatName(p)}</TableCell>
                <TableCell>
                  {(() => {
                    const summary = getPriceSummary(p);
                    return (
                      <div>
                        <div>{summary.price}</div>
                        {summary.oldPrice ? <div className="text-xs text-muted-foreground line-through">{summary.oldPrice}</div> : null}
                        {summary.discount !== null ? <div className="text-xs text-destructive">-{summary.discount}%</div> : null}
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell>{p.tag ? <Badge variant="outline">{p.tagLabel || p.tag}</Badge> : '-'}</TableCell>
                <TableCell><Badge variant={p.inStock ? 'default' : 'destructive'}>{p.inStock ? 'In Stock' : 'Out'}</Badge></TableCell>
                <TableCell><Badge variant={p.isActive ? 'outline' : 'secondary'}>{p.isActive ? 'Visible' : 'Hidden'}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => navigate(`/products/${p._id}`, { state: { returnTo: listUrl } })}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={visibilityMut.isPending}
                      aria-label={`${p.isActive ? 'Hide' : 'Show'} ${p.name}`}
                      onClick={() => visibilityMut.mutate({ id: p._id, isActive: !p.isActive })}
                    >
                      {p.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {visibilityMut.isPending && visibilityMut.variables.id === p._id ? 'Saving...' : p.isActive ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
