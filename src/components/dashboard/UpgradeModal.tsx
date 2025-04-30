
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  origin: 'dashboard' | 'landing';
}

// Definição do tipo para waitlist
interface WaitlistEntry {
  name: string;
  email: string;
  origin: 'dashboard' | 'landing';
  user_id: string | null;
}

export function UpgradeModal({ open, onClose, featureName, origin }: UpgradeModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const waitlistEntry: WaitlistEntry = {
        name: name || 'Usuário',
        email: email || (session?.user?.email || ''),
        origin,
        user_id: session?.user?.id || null,
      };
      
      // Usando a query tipada para pro_waitlist
      const { error } = await supabase
        .from('pro_waitlist')
        .insert(waitlistEntry as any);
      
      if (error) throw error;
      
      setSubmitted(true);
      toast({
        title: 'Interesse registrado!',
        description: 'Entraremos em contato em breve com mais informações.',
      });
      
      // Resetar o formulário após 2 segundos
      setTimeout(() => {
        setName('');
        setEmail('');
        setSubmitted(false);
        onClose();
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar interesse',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {submitted ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-2xl mb-2">Interesse registrado!</DialogTitle>
            <DialogDescription>
              Obrigado por seu interesse. Entraremos em contato em breve.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Liberado no plano Pro</DialogTitle>
              <DialogDescription>
                {featureName ? `Essa função permite ${featureName}` : 'Acesse recursos avançados com o plano Pro'}.
                <br />Está quase pronto — ative seu aviso para testar primeiro!
              </DialogDescription>
            </DialogHeader>
            
            {origin === 'landing' && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Fechar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary-500 hover:bg-primary-600">
                {isSubmitting ? 'Enviando...' : 'Quero acesso prioritário'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
