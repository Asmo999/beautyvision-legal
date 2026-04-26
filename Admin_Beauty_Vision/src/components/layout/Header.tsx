import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
      <span className="text-sm font-medium text-muted-foreground md:hidden">BV Admin</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {user?.firstName} {user?.lastName}
        </span>
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
