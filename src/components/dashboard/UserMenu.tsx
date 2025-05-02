
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserMenuProps {
  user: {
    name?: string;
    email: string;
  } | null;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Você saiu com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Obter iniciais do nome do usuário
  const getInitials = () => {
    if (!user?.name) return user?.email?.substring(0, 2).toUpperCase() || 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8 border">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleNavigate('/dashboard/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigate('/dashboard/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
