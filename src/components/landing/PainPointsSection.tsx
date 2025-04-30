
import React from 'react';
import { 
  MessageCircle, 
  Clock, 
  CalendarX, 
  BellOff, 
  StarOff, 
  ListVideo, 
  EyeOff, 
  RotateCcw,
  ClockOff,
  FileX
} from 'lucide-react';

const painPoints = [
  {
    name: 'Troca infinita de mensagens para marcar horários',
    icon: MessageCircle,
  },
  {
    name: 'Clientes marcando em cima da hora',
    icon: Clock,
  },
  {
    name: 'Esquecer atendimentos ou confundir dias',
    icon: CalendarX,
  },
  {
    name: 'Faltas por falta de lembrete',
    icon: BellOff,
  },
  {
    name: 'Falta de aparência profissional',
    icon: StarOff,
  },
  {
    name: 'Dificuldade em organizar diferentes tipos de serviço',
    icon: ListVideo,
  },
  {
    name: 'Insegurança ao mostrar sua disponibilidade',
    icon: EyeOff,
  },
  {
    name: 'Falta de controle sobre reagendamentos e cancelamentos',
    icon: RotateCcw,
  },
  {
    name: 'Falta de previsibilidade e rotina',
    icon: ClockOff,
  },
  {
    name: 'Depender de papel, planilhas ou ferramentas complicadas',
    icon: FileX,
  }
];

export const PainPointsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-gray-50" id="pain-points">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Problemas que você deixa para trás com o Hora Certa App
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Veja como sua rotina fica mais leve com um agendador profissional e automatizado:
          </p>
        </div>
        
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {painPoints.map((point, index) => (
              <div 
                key={index} 
                className="flex items-start p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 p-2 bg-primary-50 rounded-md">
                  <point.icon className="h-5 w-5 text-primary-500" aria-hidden="true" />
                </div>
                <p className="ml-4 text-base text-gray-700">{point.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
