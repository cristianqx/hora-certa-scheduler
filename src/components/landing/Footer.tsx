
import React from 'react';
import { Logo } from '@/components/Logo';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo className="mb-4" />
            <p className="text-gray-500 text-sm mt-4">
              Simplifique seus agendamentos e permita que seus clientes reservem horários online
              sem esforço. Ideal para profissionais autônomos de diversas áreas.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              &copy; {new Date().getFullYear()} Hora Certa. Todos os direitos reservados.
            </p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-900">Produto</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/features" className="text-gray-500 hover:text-primary-600">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-500 hover:text-primary-600">
                  Preços
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="text-gray-500 hover:text-primary-600">
                  Depoimentos
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-500 hover:text-primary-600">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-900">Empresa</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className="text-gray-500 hover:text-primary-600">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-500 hover:text-primary-600">
                  Contato
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-500 hover:text-primary-600">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-500 hover:text-primary-600">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-500 hover:text-primary-600">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-900">Suporte</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/help" className="text-gray-500 hover:text-primary-600">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <a href="mailto:suporte@horacerta.app" className="text-gray-500 hover:text-primary-600">
                  suporte@horacerta.app
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
