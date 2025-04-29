
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  profession: z.string().optional(),
  bio: z.string().max(500, 'A bio deve ter no máximo 500 caracteres').optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      profession: '',
      bio: '',
      website: '',
    },
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Erro ao carregar perfil');
        setIsLoading(false);
        return;
      }

      if (profile) {
        form.reset({
          name: profile.name || '',
          email: profile.email || '',
          profession: profile.profession || '',
          bio: profile.bio || '',
          website: profile.website || '',
        });

        setUser(session.user);
      }
      
      setIsLoading(false);
    };

    checkUser();
  }, [navigate, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsLoading(true);

      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          profession: values.profession,
          bio: values.bio,
          website: values.website,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error('Erro ao sair');
      return;
    }
    
    toast.success('Sessão encerrada');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    // Implementação futura - exigiria função no backend para segurança
    toast.error('Esta funcionalidade requer configuração adicional de segurança.');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e como você aparece para seus clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados pessoais e profissionais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormDescription>
                        O email não pode ser alterado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Sua profissão será exibida em seu perfil público.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Uma breve descrição sobre você e seus serviços.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Seu site pessoal ou profissional.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sua Foto</CardTitle>
            <CardDescription>
              Adicione uma foto para personalizar seu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mb-6 text-4xl font-medium">
              {form.watch('name').substring(0, 2).toUpperCase()}
            </div>
            <div className="space-y-2 w-full">
              <Button variant="outline" className="w-full">
                Alterar Foto
              </Button>
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                Remover Foto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-1">Alterar Senha</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Altere sua senha para manter sua conta segura.
            </p>
            <Button variant="outline">Alterar Senha</Button>
          </div>
          <div className="border-b pb-4">
            <h3 className="font-medium mb-1">Sair da conta</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Encerre sua sessão atual.
            </p>
            <Button variant="outline" onClick={handleLogout}>Sair</Button>
          </div>
          <div>
            <h3 className="font-medium text-destructive mb-1">Excluir Conta</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Todos os seus dados serão permanentemente excluídos. Esta ação não pode ser desfeita.
            </p>
            <Button variant="destructive" onClick={handleDeleteAccount}>Excluir Conta</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
