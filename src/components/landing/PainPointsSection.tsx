
import React from 'react';
import { 
  MessageCircle, 
  Calendar, 
  Clock, 
  AlarmClockOff,  
  FileX
} from 'lucide-react';

const painPoints = [
  {
    name: 'Troca infinita de mensagens para marcar horários',
    icon: MessageCircle,
    description: 'Acabe com o vai e vem de mensagens e tenha tudo automatizado'
  },
  {
    name: 'Clientes marcando em cima da hora',
    icon: Clock,
    description: 'Defina antecedência mínima para agendamentos'
  },
  {
    name: 'Faltas por falta de lembretes automatizados',
    icon: Calendar,
    description: 'Redução de faltas com lembretes automáticos para seus clientes'
  },
  {
    name: 'Falta de previsibilidade e rotina em sua agenda',
    icon: AlarmClockOff,
    description: 'Tenha controle total sobre sua disponibilidade e horários'
  },
  {
    name: 'Depender de papel, planilhas ou ferramentas complicadas',
    icon: FileX,
    description: 'Interface simples e intuitiva que você aprende a usar em minutos'
  }
];

export const PainPointsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-gray-50" id="pain-points">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Principais dores que o Hora Certa App resolve para você
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-3xl mx-auto">
            Veja como sua rotina fica mais leve com um agendador profissional e automatizado:
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {painPoints.map((point, index) => (
              <div 
                key={index} 
                className="flex items-start p-6 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 p-3 bg-primary-50 rounded-md">
                  <point.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900">{point.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
