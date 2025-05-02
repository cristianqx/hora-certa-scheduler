
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogOut, User, Settings, UserCircle } from 'lucide-react';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

export const UserMenu = ({ user }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full pl-2 pr-1 py-1 hover:bg-muted transition-colors">
          <span className="text-sm mr-1 hidden sm:inline-block">
            {user.name.split(' ')[0]}
          </span>
          <Avatar className="h-8 w-8">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.name} />
            ) : null}
            <AvatarFallback>
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/profile" className="flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/settings" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/booking/self" className="flex items-center cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Ver minha página</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
