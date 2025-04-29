
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O que é o Hora Certa?",
    answer: "Hora Certa é um sistema de agendamento online para profissionais autônomos como terapeutas, consultores, coaches e outros que precisam gerenciar seus horários de atendimento. Com ele, seus clientes podem reservar horários diretamente em sua agenda, sem troca de mensagens ou ligações."
  },
  {
    question: "Posso usar o Hora Certa gratuitamente?",
    answer: "Sim! Oferecemos um plano gratuito com recursos básicos suficientes para começar. Você pode criar um serviço e um link de agendamento, sem limitação na quantidade de agendamentos recebidos."
  },
  {
    question: "Como funciona o agendamento para meus clientes?",
    answer: "Você cria um link personalizado que pode ser compartilhado com seus clientes. Ao acessar esse link, eles veem sua disponibilidade em tempo real e podem selecionar o dia e horário que preferem. Após a confirmação, o horário é bloqueado em sua agenda e ambos recebem uma confirmação."
  },
  {
    question: "Preciso baixar algum aplicativo?",
    answer: "Não, o Hora Certa é totalmente baseado na web. Tanto você quanto seus clientes podem acessar através de qualquer navegador, seja no computador ou no celular, sem necessidade de instalação."
  },
  {
    question: "É possível sincronizar com meu calendário pessoal?",
    answer: "Sim, o Hora Certa permite integração com Google Calendar, Outlook, e outros sistemas de calendário populares, evitando conflitos de agenda."
  },
  {
    question: "Quanto custa o plano Profissional?",
    answer: "O plano Profissional custa R$29 por mês. Oferecemos também um período de teste gratuito de 30 dias para você experimentar todos os recursos premium."
  },
];

export const FAQSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-gray-50" id="faq">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Perguntas Frequentes</h2>
          <p className="mt-3 text-lg text-gray-500">
            Tire suas dúvidas sobre o Hora Certa.
          </p>
        </div>
        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
