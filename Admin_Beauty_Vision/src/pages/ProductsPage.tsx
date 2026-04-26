import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listProducts, deleteProduct } from '@/api/products';
import { listCategories } from '@/api/categories';
import { listBrands } from '@/api/brands';
import type { Product, Brand, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, ImageOff } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ProductsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search, categoryFilter, brandFilter],
    queryFn: () => listProducts({ page, limit: 20, search: search || undefined, category: categoryFilter || undefined, brand: brandFilter || undefined }),
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: listBrands });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const getBrandName = (p: Product) => typeof p.brand === 'string' ? p.brand : (p.brand as Brand).name;
  const getCatName = (p: Product) => typeof p.category === 'string' ? p.category : (p.category as Category).name;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button onClick={() => navigate('/products/new')} size="sm"><Plus className="mr-1 h-4 w-4" />Add Product</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-8" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === 'all' ? '' : v ?? ''); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v === 'all' ? '' : v ?? ''); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Brand" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
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
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : !data?.products.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No products found</TableCell></TableRow>
            ) : data.products.map((p) => (
              <TableRow key={p._id} className={!p.isActive ? 'opacity-50' : ''}>
                <TableCell>
                  {p.images?.[0] ? (
                    <img src={`${API_BASE}${p.images[0]}`} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{getBrandName(p)}</TableCell>
                <TableCell>{getCatName(p)}</TableCell>
                <TableCell>{p.price} GEL{p.oldPrice ? <span className="ml-1 text-xs text-muted-foreground line-through">{p.oldPrice}</span> : null}</TableCell>
                <TableCell>{p.tag ? <Badge variant="outline">{p.tagLabel || p.tag}</Badge> : '-'}</TableCell>
                <TableCell><Badge variant={p.inStock ? 'default' : 'destructive'}>{p.inStock ? 'In Stock' : 'Out'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/products/${p._id}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Deactivate this product?')) deleteMut.mutate(p._id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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
