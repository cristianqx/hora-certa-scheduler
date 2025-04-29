
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const serviceSchema = z.object({
  name: z.string().min(1, 'O nome do serviço é obrigatório'),
  description: z.string().optional(),
  duration: z.coerce.number().min(15, 'A duração deve ser de pelo menos 15 minutos'),
  price: z.string().optional(),
  active: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const NewServicePage: React.FC = () => {
  const navigate = useNavigate();

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

  const onSubmit = (values: ServiceFormValues) => {
    // TODO: Implement service creation
    console.log('Form submitted:', values);
    toast.success('Serviço criado com sucesso!');
    navigate('/dashboard/services');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Serviço</h1>
        <p className="text-muted-foreground">
          Crie um novo serviço para que seus clientes possam agendar.
        </p>
      </div>

      <div className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Consulta Inicial" {...field} />
                  </FormControl>
                  <FormDescription>
                    O nome que será exibido para seus clientes.
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o que está incluído neste serviço..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Uma breve descrição para ajudar seus clientes a entender o serviço.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (minutos)</FormLabel>
                    <FormControl>
                      <Input type="number" min={15} step={15} {...field} />
                    </FormControl>
                    <FormDescription>
                      Quanto tempo este serviço leva.
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
                      <Input placeholder="Ex: R$ 100" {...field} />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco se não quiser mostrar o preço.
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
                    <FormLabel className="text-base">Disponível para agendamento</FormLabel>
                    <FormDescription>
                      Ative para permitir que clientes agendem este serviço.
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

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/services')}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Serviço</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default NewServicePage;
