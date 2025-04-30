
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type SubscriptionStatus = 'free' | 'pro' | 'trialing';

interface SubscriptionContextType {
  isLoading: boolean;
  plan: SubscriptionStatus;
  isSubscribed: boolean;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  checkEligibility: (feature: string) => { allowed: boolean; requiresUpgrade: boolean };
  reloadSubscription: () => Promise<void>;
}

// Definição dos tipos para user_subscriptions
interface UserSubscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<SubscriptionStatus>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<Date | null>(null);

  const isPro = plan === 'pro' || plan === 'trialing';

  const loadSubscription = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setPlan('free');
        setIsLoading(false);
        return;
      }
      
      // Usando type assertion para evitar erros do TypeScript com tabelas personalizadas
      const { data: subscription, error } = await supabase
        .from('user_subscriptions' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 é "no rows returned"
        console.error('Erro ao carregar assinatura:', error);
        toast({
          title: 'Erro ao carregar plano',
          description: 'Não foi possível verificar sua assinatura',
          variant: 'destructive',
        });
      }
      
      if (subscription) {
        // Convertendo para unknown primeiro para evitar erros de tipo
        const userSub = subscription as unknown as UserSubscription;
        setPlan(userSub.status === 'trialing' ? 'trialing' : userSub.plan as SubscriptionStatus);
        
        if (userSub.trial_ends_at) {
          setTrialEndsAt(new Date(userSub.trial_ends_at));
        }
        
        if (userSub.current_period_end) {
          setCurrentPeriodEnd(new Date(userSub.current_period_end));
        }
      } else {
        setPlan('free');
        setTrialEndsAt(null);
        setCurrentPeriodEnd(null);
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
    
    const authListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadSubscription();
      }
    });
    
    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const checkEligibility = (feature: string) => {
    // Lógica para verificar se o recurso está disponível para o plano atual
    switch (feature) {
      case 'multiple_services':
      case 'multiple_links':
      case 'advanced_customization':
      case 'reminders':
      case 'auto_cancellation':
      case 'custom_slug':
        return { 
          allowed: isPro, 
          requiresUpgrade: !isPro 
        };
      default:
        // Recursos disponíveis para todos os planos
        return { allowed: true, requiresUpgrade: false };
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isLoading,
        plan,
        isSubscribed: isPro,
        trialEndsAt,
        currentPeriodEnd,
        checkEligibility,
        reloadSubscription: loadSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
