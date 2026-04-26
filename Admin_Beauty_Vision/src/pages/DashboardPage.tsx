import { useQuery } from '@tanstack/react-query';
import { getStats } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getStats });

  const cards = [
    { label: 'Total Users', value: data?.totalUsers ?? 0, icon: Users },
    { label: 'Active Products', value: data?.totalProducts ?? 0, icon: Package },
    { label: 'Total Orders', value: data?.totalOrders ?? 0, icon: ShoppingCart },
    { label: 'Revenue', value: `${(data?.totalRevenue ?? 0).toLocaleString()} GEL`, icon: DollarSign },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
