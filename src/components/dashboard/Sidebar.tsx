import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Clock, 
  User, 
  CreditCard, 
  Settings, 
  PanelLeft,
  CalendarDays
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = [
    {
      icon: LayoutDashboard,
      href: '/dashboard',
      label: 'Dashboard',
      active: pathname === '/dashboard',
    },
    {
      icon: CalendarDays,
      href: '/dashboard/appointments',
      label: 'Agendamentos',
      active: pathname === '/dashboard/appointments',
    },
    {
      icon: CalendarClock,
      href: '/dashboard/services',
      label: 'Serviços',
      active: pathname.includes('/dashboard/services'),
    },
    {
      icon: Clock,
      href: '/dashboard/availability',
      label: 'Disponibilidade',
      active: pathname === '/dashboard/availability',
    },
    {
      icon: User,
      href: '/dashboard/profile',
      label: 'Perfil',
      active: pathname === '/dashboard/profile',
    },
    {
      icon: CreditCard,
      href: '/dashboard/plans',
      label: 'Planos',
      active: pathname === '/dashboard/plans',
    }
  ];
  
  return (
    <div className={cn("flex flex-col space-y-4 py-4", className)}>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Dashboard
        </h2>
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'w-full font-normal justify-start',
                item.active && 'bg-secondary hover:bg-secondary',
                'px-4 py-2',
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
