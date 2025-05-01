
import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

interface HeaderProps {
  className?: string;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ className, onMobileMenuToggle, isMobileMenuOpen }) => {
  const { plan } = useSubscription();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar busca quando houver dados para buscar
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm);
    }
  };

  return (
    <header className={cn("bg-white border-b border-gray-200 px-4 py-3 sm:px-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
            onClick={onMobileMenuToggle}
          >
            <span className="sr-only">Abrir menu lateral</span>
            {isMobileMenuOpen ? (
              <X className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
          <form onSubmit={handleSearch} className="max-w-lg w-full lg:max-w-xs ml-4 md:ml-0">
            <label htmlFor="search" className="sr-only">
              Buscar
            </label>
            <div className="relative text-gray-400 focus-within:text-gray-600">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <Input
                id="search"
                placeholder="Buscar"
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
        </div>
        <div className="flex items-center ml-4 space-x-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Button variant="ghost" className="p-1 rounded-full">
                <span className="sr-only">Abrir menu de perfil</span>
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                  JP
                </div>
              </Button>
            </div>
            <div className="hidden md:flex md:flex-col md:items-end md:ml-2">
              <span className="text-sm font-medium text-gray-700">João Pedro</span>
              <span className="text-xs text-gray-500">Plano {plan === 'free' ? 'Free' : 'Pro'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
