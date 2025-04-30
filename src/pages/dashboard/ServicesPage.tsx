
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/dashboard/UpgradeModal';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: string | null;
  active: boolean;
}

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkEligibility } = useSubscription();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading services:', error);
        toast.error('Erro ao carregar serviços');
      } else {
        setServices(data || []);
      }
      
      setIsLoading(false);
    };
    
    loadServices();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        setServices(services.filter(service => service.id !== id));
        toast.success('Serviço excluído com sucesso');
      } catch (error: any) {
        console.error('Error deleting service:', error);
        toast.error(error.message || 'Erro ao excluir serviço');
      }
    }
  };

  const handleNewService = () => {
    // Verificar se o usuário pode criar mais serviços
    const { allowed, requiresUpgrade } = checkEligibility('multiple_services');
    
    // Se já tem serviços e está no plano gratuito, mostrar modal de upgrade
    if (services.length > 0 && requiresUpgrade) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Caso contrário, redirecionar para a página de criação
    navigate('/dashboard/services/new');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços que você oferece para seus clientes.
          </p>
        </div>
        <Button onClick={handleNewService}>
          <Plus className="mr-2 h-4 w-4" /> Novo Serviço
        </Button>
      </div>

      {services.length > 0 ? (
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
                  <div className={`px-2 py-1 rounded-full ${
                    service.active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  } text-xs`}>
                    {service.active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-500">{service.description || 'Sem descrição'}</p>
                <div className="flex justify-between mt-4">
                  <span className="font-medium">{service.price || 'Grátis'}</span>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50 p-3 flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/services/${service.id}`}>
                    <Edit className="h-4 w-4 mr-1" />
                    <span>Editar</span>
                  </Link>
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  <span>Excluir</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-4">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium">Nenhum serviço encontrado</h3>
          <p className="text-gray-500 mt-1">
            Você ainda não criou nenhum serviço. Comece criando seu primeiro serviço.
          </p>
          <Button className="mt-4" onClick={handleNewService}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Serviço
          </Button>
        </div>
      )}

      <UpgradeModal 
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="criar múltiplos serviços"
        origin="dashboard"
      />
    </div>
  );
};

export default ServicesPage;
