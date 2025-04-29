
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Clock, User, Settings, BarChart3, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Serviços', href: '/dashboard/services', icon: Calendar },
  { name: 'Disponibilidade', href: '/dashboard/availability', icon: Clock },
  { name: 'Perfil', href: '/dashboard/profile', icon: User },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  return (
    <div className={cn("flex flex-col h-full bg-white shadow-sm border-r", className)}>
      <div className="px-4 py-6">
        <Logo />
      </div>
      <div className="px-2 space-y-1 flex-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md',
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </div>
      <div className="px-2 pb-6">
        <NavLink
          to="/logout"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </NavLink>
      </div>
    </div>
  );
};
