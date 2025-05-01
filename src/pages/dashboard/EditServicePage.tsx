
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  duration: z.coerce.number().min(5, 'Duração mínima de 5 minutos').max(480, 'Duração máxima de 8 horas'),
  price: z.string().optional(),
  active: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const EditServicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      duration: 60,
      price: '',
      active: true,
    },
  });

  useEffect(() => {
    const loadService = async () => {
      if (!id) return;

      try {
        setInitialLoading(true);
        const { data: service, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (service) {
          form.reset({
            name: service.name,
            description: service.description || '',
            duration: service.duration,
            price: service.price || '',
            active: service.active,
          });
        }
      } catch (error: any) {
        console.error('Error loading service:', error);
        toast.error('Erro ao carregar serviço');
      } finally {
        setInitialLoading(false);
      }
    };

    loadService();
  }, [id, form]);

  const onSubmit = async (values: ServiceFormValues) => {
    if (!id) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: values.name,
          description: values.description,
          duration: values.duration,
          price: values.price,
          active: values.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Serviço atualizado com sucesso!');
      navigate('/dashboard/services');
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast.error(error.message || 'Erro ao atualizar serviço');
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/dashboard/services')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Serviço</h1>
          <p className="text-muted-foreground">
            Atualize as informações do seu serviço.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do serviço</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Consulta Inicial" {...field} />
                </FormControl>
                <FormDescription>
                  Nome do serviço que será exibido para seus clientes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva o que está incluído neste serviço..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (minutos)</FormLabel>
                  <FormControl>
                    <Input type="number" min={5} max={480} {...field} />
                  </FormControl>
                  <FormDescription>
                    Quanto tempo dura este serviço?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: R$ 100,00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Deixe em branco se não quiser exibir o preço.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Status do serviço</FormLabel>
                  <FormDescription>
                    Ativar ou desativar este serviço para agendamentos.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard/services')} 
              className="mr-2"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditServicePage;
