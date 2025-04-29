
import React from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white z-0"></div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center">
            <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-gray-900 sm:mt-5 sm:text-5xl lg:mt-6">
              <span className="block">Seu tempo na</span>
              <span className="block text-primary-600">hora certa.</span>
            </h1>
            <p className="mt-3 text-lg text-gray-500 sm:mt-5">
              Simplifique seus agendamentos. Permita que seus clientes reservem horários online, sem complicações.
              Perfeito para terapeutas, consultores, coaches e todos os profissionais autônomos.
            </p>
            <div className="mt-8 sm:mt-10">
              <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-4">
                <Button size="lg" className="w-full sm:w-auto">
                  <Link to="/register" className="flex items-center">
                    Comece Grátis
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link to="/login">Entrar</Link>
                </Button>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-500" />
                  <span className="text-sm text-gray-600">Configuração em minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-500" />
                  <span className="text-sm text-gray-600">Plano gratuito disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-500" />
                  <span className="text-sm text-gray-600">Sem cartão de crédito</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6 xl:col-span-7">
            <div className="bg-white sm:mx-0 sm:rounded-2xl sm:overflow-hidden sm:shadow-xl">
              <img
                className="w-full object-cover"
                src="/lovable-uploads/f9b73473-8384-46d8-b02a-58816c8e237c.png"
                alt="Interface do Hora Certa"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
