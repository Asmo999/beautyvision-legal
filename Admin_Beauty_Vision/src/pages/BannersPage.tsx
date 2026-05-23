import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteBanner, listBanners } from '@/api/banners';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mediaUrl } from '@/lib/urls';
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react';

export default function BannersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: banners = [], isLoading } = useQuery({ queryKey: ['banners'], queryFn: listBanners });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
        <Button onClick={() => navigate('/banners/new')} size="sm">
          <Plus className="mr-1 h-4 w-4" />Add Banner
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No banners</TableCell>
              </TableRow>
            ) : banners.map((banner) => (
              <TableRow key={banner._id}>
                <TableCell>
                  {banner.imageUrl ? (
                    <img src={mediaUrl(banner.imageUrl)} alt={banner.title} className="h-14 w-28 rounded-md object-cover" />
                  ) : (
                    <div
                      className="flex h-14 w-28 items-center justify-center rounded-md text-white"
                      style={{ background: `linear-gradient(135deg, ${banner.colors.join(', ')})` }}
                    >
                      <ImageOff className="h-4 w-4 opacity-70" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell className="text-muted-foreground">{banner.targetPath || '-'}</TableCell>
                <TableCell>{banner.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/banners/${banner._id}`)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { if (confirm('Delete this banner?')) deleteMutation.mutate(banner._id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
