
import React from 'react';

const testimonials = [
  {
    content: "O Hora Certa transformou completamente minha rotina de agendamentos. Antes, eu perdia muito tempo trocando mensagens com clientes para encontrar horários disponíveis. Agora é tudo automático!",
    author: "Maria Silva",
    role: "Terapeuta Holística",
  },
  {
    content: "Como coach, preciso de uma ferramenta que seja profissional e fácil de usar. Hora Certa não só atendeu minhas expectativas como também impressionou meus clientes com a simplicidade do processo.",
    author: "Carlos Mendes",
    role: "Coach de Carreira",
  },
  {
    content: "Consegui reduzir em 80% o tempo que gastava gerenciando minha agenda. A interface é intuitiva tanto para mim quanto para meus pacientes. Recomendo para todos os profissionais.",
    author: "Ana Oliveira",
    role: "Nutricionista",
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white" id="testimonials">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            O que nossos clientes dizem
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Centenas de profissionais já estão economizando tempo com o Hora Certa.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-gray-600 italic">{testimonial.content}</p>
              <div className="mt-6">
                <p className="font-medium text-gray-900">{testimonial.author}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
