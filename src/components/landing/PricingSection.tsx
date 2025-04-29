
import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  buttonText: string;
  buttonVariant: 'default' | 'outline';
  features: PlanFeature[];
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: 'Plano Gratuito',
    price: 'R$ 0',
    description: 'Ideal para começar a organizar sua agenda.',
    buttonText: 'Começar Grátis',
    buttonVariant: 'outline',
    features: [
      { name: '1 link de agendamento ativo', included: true },
      { name: 'Até 1 serviço ativo', included: true },
      { name: 'Agendamento ilimitado', included: true },
      { name: 'Personalização básica', included: true },
      { name: 'Links e serviços ilimitados', included: false },
      { name: 'Personalização avançada', included: false },
      { name: 'Cancelamentos automáticos', included: false },
      { name: 'Lembretes por e-mail', included: false },
    ],
  },
  {
    name: 'Plano Profissional',
    price: 'R$ 29',
    description: 'Todas as ferramentas para profissionais.',
    buttonText: 'Teste Grátis por 30 Dias',
    buttonVariant: 'default',
    popular: true,
    features: [
      { name: '1 link de agendamento ativo', included: true },
      { name: 'Até 1 serviço ativo', included: true },
      { name: 'Agendamento ilimitado', included: true },
      { name: 'Personalização básica', included: true },
      { name: 'Links e serviços ilimitados', included: true },
      { name: 'Personalização avançada', included: true },
      { name: 'Cancelamentos automáticos', included: true },
      { name: 'Lembretes por e-mail', included: true },
    ],
  },
];

export const PricingSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-gray-50" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Planos simples e transparentes</h2>
          <p className="mt-3 text-lg text-gray-500">
            Escolha o plano que melhor se adapta às suas necessidades.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-y-10 gap-x-6 lg:grid-cols-2 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-sm divide-y divide-gray-200 overflow-hidden ${
                plan.popular ? 'border-2 border-primary-500' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="bg-primary-500 py-2 text-center">
                  <p className="text-sm font-medium text-white">Mais Popular</p>
                </div>
              )}
              <div className="bg-white p-6">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-base font-medium text-gray-500">/mês</span>
                </p>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                <Button
                  variant={plan.buttonVariant}
                  className={`mt-6 w-full ${plan.popular ? 'bg-primary-500 hover:bg-primary-600' : ''}`}
                >
                  {plan.buttonText}
                </Button>
              </div>
              <div className="bg-white py-6 px-6 space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Inclui:</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start">
                      <div className="flex-shrink-0">
                        {feature.included ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      <p className={`ml-3 text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.name}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
