
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for services
const services = [
  { 
    id: 1,
    name: 'Consulta Inicial',
    description: 'Primeira consulta para avaliação e planejamento.',
    duration: 60,
    price: 'R$ 150',
    active: true
  },
];

const ServicesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços que você oferece para seus clientes.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/services/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Serviço
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <CardHeader className="bg-primary-50 border-b pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{service.name}</CardTitle>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{service.duration} minutos</span>
                  </div>
                </div>
                <div className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                  Ativo
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-500">{service.description}</p>
              <div className="flex justify-between mt-4">
                <span className="font-medium">{service.price}</span>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-gray-50 p-3 flex justify-between">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/dashboard/services/${service.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  <span>Editar</span>
                </Link>
              </Button>
              <Button variant="destructive" size="sm">
                <Trash className="h-4 w-4 mr-1" />
                <span>Excluir</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-4">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium">Nenhum serviço encontrado</h3>
          <p className="text-gray-500 mt-1">
            Você ainda não criou nenhum serviço. Comece criando seu primeiro serviço.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/dashboard/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Criar Serviço
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
