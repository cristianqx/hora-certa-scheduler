
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

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
  current?: boolean;
}

const PlansPage: React.FC = () => {
  const { toast } = useToast();
  const { plan, isSubscribed, currentPeriodEnd, reloadSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  
  // Definir planos com base no estado atual da assinatura
  const plans: PricingPlan[] = [
    {
      name: 'Plano Gratuito',
      price: 'R$ 0',
      description: 'Ideal para começar a organizar sua agenda.',
      buttonText: plan === 'free' ? 'Seu Plano Atual' : 'Fazer Downgrade',
      buttonVariant: 'outline',
      current: plan === 'free',
      features: [
        { name: '1 link de agendamento ativo', included: true },
        { name: 'Até 1 serviço ativo', included: true },
        { name: 'Agendamento ilimitado', included: true },
        { name: 'Personalização básica', included: true },
        { name: 'Links e serviços ilimitados', included: false },
        { name: 'Personalização avançada', included: false },
        { name: 'Cancelamentos automáticos', included: false },
        { name: 'Lembretes por e-mail', included: false },
        { name: 'Página com slug personalizado', included: false },
      ],
    },
    {
      name: 'Plano Profissional',
      price: 'R$ 29',
      description: 'Todas as ferramentas para profissionais.',
      buttonText: isSubscribed ? 'Gerenciar Assinatura' : 'Fazer Upgrade',
      buttonVariant: 'default',
      popular: true,
      current: isSubscribed,
      features: [
        { name: '1 link de agendamento ativo', included: true },
        { name: 'Até 1 serviço ativo', included: true },
        { name: 'Agendamento ilimitado', included: true },
        { name: 'Personalização básica', included: true },
        { name: 'Links e serviços ilimitados', included: true },
        { name: 'Personalização avançada', included: true },
        { name: 'Cancelamentos automáticos', included: true },
        { name: 'Lembretes por e-mail', included: true },
        { name: 'Página com slug personalizado', included: true },
      ],
    },
  ];
  
  const handleStripeCheckout = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {});
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Erro ao iniciar checkout:', error);
      toast({
        title: 'Erro ao iniciar checkout',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCustomerPortal = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {});
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Erro ao abrir portal do cliente:', error);
      toast({
        title: 'Erro ao abrir portal de assinatura',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePlanAction = (planType: 'free' | 'pro') => {
    if (planType === 'pro') {
      if (isSubscribed) {
        handleCustomerPortal();
      } else {
        handleStripeCheckout();
      }
    } else {
      // Ação para downgrade para o plano gratuito
      if (isSubscribed) {
        handleCustomerPortal();
      }
    }
  };

  useEffect(() => {
    // Verificar se há um checkout_success na URL
    const url = new URL(window.location.href);
    const success = url.searchParams.get('checkout_success');
    
    if (success === 'true') {
      // Limpar a URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Mostrar mensagem de sucesso
      toast({
        title: 'Assinatura ativada com sucesso!',
        description: 'Obrigado por assinar o plano Pro. Aproveite todos os recursos!',
      });
      
      // Recarregar informações da assinatura
      reloadSubscription();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planos e Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie seu plano e acesse mais recursos para seu negócio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "overflow-hidden",
              plan.popular ? "border-2 border-primary-500" : "",
              plan.current ? "ring-2 ring-primary-200" : ""
            )}
          >
            {plan.popular && (
              <div className="bg-primary-500 py-2 text-center">
                <p className="text-sm font-medium text-white">Mais Popular</p>
              </div>
            )}
            {plan.current && (
              <div className="bg-primary-100 py-2 text-center">
                <p className="text-sm font-medium text-primary-700">Plano Atual</p>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                    <p className={cn("ml-3 text-sm", feature.included ? "text-gray-700" : "text-gray-400")}>
                      {feature.name}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant={plan.buttonVariant}
                className={cn(
                  "w-full", 
                  plan.current && "cursor-default",
                  plan.popular && !plan.current && "bg-primary-500 hover:bg-primary-600"
                )}
                disabled={plan.current && !isSubscribed}
                onClick={() => handlePlanAction(plan.name.includes('Gratuito') ? 'free' : 'pro')}
                loading={isLoading}
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Plano Atual</h4>
              <p className="font-medium">
                {isSubscribed ? 'Plano Profissional' : 'Plano Gratuito'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                Ativo
              </span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Data de Início</h4>
              <p>
                {format(new Date(), 'd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
              </p>
            </div>
            {currentPeriodEnd && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Próxima Cobrança</h4>
                <p>
                  {format(new Date(currentPeriodEnd), 'd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Método de Pagamento</h4>
              <p>{isSubscribed ? 'Cartão de Crédito' : '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansPage;
