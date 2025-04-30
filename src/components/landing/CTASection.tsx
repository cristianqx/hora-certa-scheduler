
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const CTASection: React.FC = () => {
  return (
    <section className="bg-primary-600 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Pronto para simplificar seus agendamentos?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Experimente o Hora Certa gratuitamente e descubra como é fácil gerenciar sua agenda profissional.
              Sem compromissos, sem cartão de crédito.
            </p>
            <div className="mt-8 flex space-x-4">
              <Button
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50"
                asChild
              >
                <Link to="/register">Começar Agora</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-primary-700"
                asChild
              >
                <Link to="#contact" onClick={(e) => {
                  e.preventDefault();
                  const contactElement = document.getElementById('contact');
                  if (contactElement) {
                    contactElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}>Fale Conosco</Link>
              </Button>
            </div>
          </div>
          <div className="mt-12 lg:mt-0">
            <div className="rounded-lg overflow-hidden shadow-xl">
              <img
                className="w-full"
                src="/lovable-uploads/2507fcdf-545f-4996-b203-215a28e77fa4.png"
                alt="Interface de agendamento"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
