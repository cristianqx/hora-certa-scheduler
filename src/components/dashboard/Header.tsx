
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { useTheme } from '@/hooks/use-theme';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  avatar_url?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        if (error) throw error;
        
        setUserProfile({
          name: data?.name || 'Usuário',
          email: session.user.email || '',
          avatar_url: data?.avatar_url
        });
        
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserProfile({
            name: 'Usuário',
            email: session.user.email || '',
          });
        }
      }
    };
    
    fetchUserProfile();
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserProfile();
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className={`sticky top-0 z-10 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} border-b px-4 h-16 flex items-center justify-between`}>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden"
          aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsMenu />
        <UserMenu user={userProfile} />
      </div>
    </header>
  );
};
