
import React from 'react';
import { Calendar, Clock, Link, Users, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';

const features = [
  {
    name: 'Agendamento simples',
    description: 'Seus clientes podem agendar horários em apenas alguns cliques, sem complicações.',
    icon: Calendar,
  },
  {
    name: 'Links personalizados',
    description: 'Crie links de agendamento personalizados para cada tipo de serviço que você oferece.',
    icon: Link,
  },
  {
    name: 'Gerenciamento de disponibilidade',
    description: 'Defina facilmente quando você está disponível para atender seus clientes.',
    icon: Clock,
  },
  {
    name: 'Experiência do cliente otimizada',
    description: 'Uma interface amigável e intuitiva que seus clientes vão adorar usar.',
    icon: Users,
  },
  {
    name: 'Sincronização de calendários',
    description: 'Conecte com o Google Calendar, Outlook e outros para evitar conflitos de agenda.',
    icon: CalendarIcon,
  },
  {
    name: 'Confirmações automáticas',
    description: 'Envio automático de confirmações e lembretes para reduzir ausências.',
    icon: CheckCircle,
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Tudo que você precisa para gerenciar seus agendamentos
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Funcionalidades poderosas e intuitivas para simplificar sua agenda.
          </p>
        </div>
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
                <div className="rounded-md bg-primary-50 p-2 w-fit">
                  <feature.icon className="h-6 w-6 text-primary-500" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-base text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
