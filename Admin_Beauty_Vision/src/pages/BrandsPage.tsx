import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listBrands, createBrand, updateBrand, deleteBrand, uploadBrandImage } from '@/api/brands';
import { listCategories, listCategoryBrands, updateCategoryBrandPriorities } from '@/api/categories';
import type { Brand, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, ListOrdered, Plus, Pencil, Trash2, Upload, ImageOff } from 'lucide-react';
import { mediaUrl } from '@/lib/urls';

export default function BrandsPage() {
  const qc = useQueryClient();
  const { data: brands = [], isLoading } = useQuery({ queryKey: ['brands'], queryFn: listBrands });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });
  const displayCategories = categories.filter((category) => category.isActive);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [priorityInputs, setPriorityInputs] = useState<Record<string, string>>({});
  const [priorityError, setPriorityError] = useState('');
  const { data: categoryBrandData, isLoading: categoryBrandsLoading } = useQuery({
    queryKey: ['category-brands', selectedCategory?._id],
    queryFn: () => listCategoryBrands(selectedCategory!._id),
    enabled: !!selectedCategory,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({
    name: '',
    nameKa: '',
    description: '',
    descriptionKa: '',
    slug: '',
    discountPercent: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      nameKa: '',
      description: '',
      descriptionKa: '',
      slug: '',
      discountPercent: '',
    });
    setOpen(true);
  };
  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({
      name: b.translations?.en?.name ?? b.name,
      nameKa: b.translations?.ka?.name ?? '',
      description: b.translations?.en?.description ?? b.description ?? '',
      descriptionKa: b.translations?.ka?.description ?? '',
      slug: b.slug,
      discountPercent: b.discountPercent ? String(b.discountPercent) : '',
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim() || form.nameKa.trim(),
        description: form.description || null,
        translations: {
          en: {
            name: form.name || null,
            description: form.description || null,
          },
          ka: {
            name: form.nameKa || null,
            description: form.descriptionKa || null,
          },
        },
        slug: form.slug,
        discountPercent: form.discountPercent.trim() === '' ? 0 : Number(form.discountPercent),
      };

      return editing ? updateBrand(editing._id, payload) : createBrand(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); if (!editing) setOpen(false); },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadBrandImage(editing!._id, file),
    onSuccess: (brand) => {
      qc.invalidateQueries({ queryKey: ['brands'] });
      setEditing(brand);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands'] }),
  });

  const priorityMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory || !categoryBrandData) return;

      const priorities = categoryBrandData.brands.map((brand, index) => ({
        brand: brand._id,
        priority: Number(priorityInputs[brand._id] ?? index + 1),
      }));
      if (priorities.some((entry) => !Number.isInteger(entry.priority) || entry.priority < 1)) {
        throw new Error('Enter a positive whole-number order for every brand.');
      }
      if (new Set(priorities.map((entry) => entry.priority)).size !== priorities.length) {
        throw new Error('Each brand needs a unique display order.');
      }

      await updateCategoryBrandPriorities(selectedCategory._id, priorities);
    },
    onMutate: () => setPriorityError(''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands'] });
      qc.invalidateQueries({ queryKey: ['category-brands'] });
      setSelectedCategory(null);
    },
    onError: (error) => {
      setPriorityError(error instanceof Error ? error.message : 'Could not save the display order.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
        <Button onClick={openCreate} size="sm"><Plus className="mr-1 h-4 w-4" />Add Brand</Button>
      </div>

      <section className="mb-6 rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ListOrdered className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">Brand Display Order</h2>
            <p className="text-sm text-muted-foreground">
              Choose a category to arrange the brands exactly as they appear in the app.
            </p>
          </div>
        </div>

        {categoriesLoading ? (
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        ) : displayCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active categories found.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayCategories.map((category) => (
              <button
                key={category._id}
                type="button"
                className="group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                onClick={() => {
                  setPriorityInputs({});
                  setPriorityError('');
                  setSelectedCategory(category);
                }}
              >
                {category.imageUrl ? (
                  <img src={mediaUrl(category.imageUrl)} alt="" className="h-11 w-11 rounded-md object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-muted">
                    <ImageOff className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">Set brand priority</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Display Priority</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : brands.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No brands</TableCell></TableRow>
            ) : brands.map((b) => (
              <TableRow key={b._id}>
                <TableCell>
                  {b.logoUrl ? (
                    <img src={mediaUrl(b.logoUrl)} alt={b.name} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell className="text-muted-foreground">{b.slug}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {displayCategories.some((category) =>
                      b.categoryPriorities?.some((entry) => entry.category === category._id),
                    ) ? displayCategories.map((category) => {
                      const priority = b.categoryPriorities?.find((entry) => entry.category === category._id)?.priority;
                      return priority === undefined ? null : (
                        <Badge key={category._id} variant="outline">{category.name}: {priority}</Badge>
                      );
                    }) : <span className="text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell>{b.discountPercent > 0 ? <Badge>-{b.discountPercent}%</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell><Badge variant={b.isActive ? 'default' : 'secondary'}>{b.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this brand?')) deleteMutation.mutate(b._id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Brand' : 'New Brand'}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Name (EN)</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, ...(!editing ? { slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') } : {}) })} />
            </div>
            <div className="space-y-2">
              <Label>Name (KA)</Label>
              <Input value={form.nameKa} onChange={(e) => setForm({ ...form, nameKa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description (EN)</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description (KA)</Label>
              <Input value={form.descriptionKa} onChange={(e) => setForm({ ...form, descriptionKa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Brand Discount (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="0"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Applies to every product of this brand and overrides each product's own discount. Leave 0 for none.
              </p>
            </div>

            {/* Brand image - only for existing brands */}
            {editing && (
              <div className="space-y-2">
                <Label>Brand Image</Label>
                <div className="flex items-center gap-3">
                  {editing.logoUrl ? (
                    <img src={mediaUrl(editing.logoUrl)} alt={editing.name} className="h-16 w-16 rounded-lg object-cover border" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
                      <ImageOff className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadMutation.isPending}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    {uploadMutation.isPending ? 'Uploading...' : editing.logoUrl ? 'Replace' : 'Upload'}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleFileChange} />
                </div>
                {!editing.logoUrl && (
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, AVIF up to 10 MB</p>
                )}
              </div>
            )}

            {!editing && (
              <p className="text-xs text-muted-foreground">Save the brand first, then you can upload an image.</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedCategory}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedCategory(null);
            setPriorityInputs({});
            setPriorityError('');
          }
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCategory?.name} Brand Display Order</DialogTitle>
            <DialogDescription>
              These are the active brands with active products in this category. Order 1 appears first in the app.
            </DialogDescription>
          </DialogHeader>

          {categoryBrandsLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading brands...</p>
          ) : !categoryBrandData || categoryBrandData.brands.length === 0 ? (
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              No brands currently appear in this category.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead className="w-28 text-center">Products</TableHead>
                    <TableHead className="w-28">Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBrandData.brands.map((brand, index) => (
                    <TableRow key={brand._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {brand.logoUrl ? (
                            <img src={mediaUrl(brand.logoUrl)} alt="" className="h-9 w-9 rounded-md object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                              <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{brand.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">{brand.productCount}</TableCell>
                      <TableCell>
                        <Input
                          aria-label={`${brand.name} display order`}
                          type="number"
                          min={1}
                          step={1}
                          value={priorityInputs[brand._id] ?? String(index + 1)}
                          onChange={(event) => setPriorityInputs({
                            ...priorityInputs,
                            [brand._id]: event.target.value,
                          })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {priorityError && <p className="text-sm text-destructive">{priorityError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedCategory(null)}>Cancel</Button>
            <Button
              type="button"
              disabled={
                categoryBrandsLoading
                || !categoryBrandData
                || categoryBrandData.brands.length === 0
                || priorityMutation.isPending
              }
              onClick={() => priorityMutation.mutate()}
            >
              {priorityMutation.isPending ? 'Saving...' : 'Save Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
