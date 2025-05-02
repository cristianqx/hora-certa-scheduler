
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Check, Mail, Phone, User, Globe, Briefcase } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  profession?: string;
  bio?: string;
  website?: string;
}

const SettingsPage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      
      // Get profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Falha ao carregar dados do perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          profession: profile.profession,
          bio: profile.bio,
          website: profile.website
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Falha ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }
  
  if (!profile) {
    return <div className="text-center py-12">Perfil não encontrado</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil e preferências de sistema.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="card-modern">
              <CardHeader className="card-header-modern">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Atualize suas informações de perfil
                </CardDescription>
              </CardHeader>
              
              <CardContent className="card-content-modern">
                <form onSubmit={updateProfile} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="w-24 h-24 border-4 border-background">
                        <AvatarImage src="" alt={profile.name} />
                        <AvatarFallback className="text-xl">
                          {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">Alterar foto</Button>
                    </div>
                    
                    <div className="flex-1 grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="name"
                            name="name"
                            value={profile.name}
                            onChange={handleChange}
                            className="pl-10"
                            placeholder="Seu nome completo"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="email"
                            value={profile.email}
                            className="pl-10"
                            disabled
                            readOnly
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          O email não pode ser alterado
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="profession">Profissão</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="profession"
                          name="profession"
                          value={profile.profession || ''}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Ex: Médico, Dentista, Terapeuta, etc."
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="website">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="website"
                          name="website"
                          value={profile.website || ''}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="https://seusite.com.br"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Biografia</Label>
                      <Textarea 
                        id="bio"
                        name="bio"
                        value={profile.bio || ''}
                        onChange={handleChange}
                        placeholder="Conte um pouco sobre você e seus serviços"
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card className="card-modern">
                <CardHeader className="card-header-modern">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Presença Online
                  </CardTitle>
                  <CardDescription>
                    Configure sua presença digital
                  </CardDescription>
                </CardHeader>
                <CardContent className="card-content-modern space-y-4">
                  <div className="grid grid-cols-[25px_1fr] items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium leading-none">Página de agendamento</p>
                      <p className="text-muted-foreground">
                        Sua página pública de agendamento está ativa
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-[25px_1fr] items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium leading-none">Recebimento de agendamentos</p>
                      <p className="text-muted-foreground">
                        Você está habilitado para receber novos agendamentos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="card-modern">
                <CardHeader className="card-header-modern">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contato
                  </CardTitle>
                  <CardDescription>
                    Configure suas informações de contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="card-content-modern">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="phone"
                          className="pl-10"
                          placeholder="+55 (00) 00000-0000"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Este número será usado para notificações de agendamento
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button>
                        Salvar Contato
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card className="card-modern">
            <CardHeader className="card-header-modern">
              <CardTitle className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                  <path d="M12 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M12 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M19 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M19 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path d="M5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                </svg>
                Aparência e Tema
              </CardTitle>
              <CardDescription>
                Personalize a aparência do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="card-content-modern">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">Tema Escuro</h3>
                    <p className="text-sm text-muted-foreground">
                      Altere entre o tema claro e escuro
                    </p>
                  </div>
                  <ThemeToggle showLabel />
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">Modo de Animação</h3>
                    <p className="text-sm text-muted-foreground">
                      Configurar animações da interface
                    </p>
                  </div>
                  <Select value="reduced">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Completo</SelectItem>
                      <SelectItem value="reduced">Reduzido</SelectItem>
                      <SelectItem value="off">Desativado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium">Densidade</h3>
                    <p className="text-sm text-muted-foreground">
                      Ajuste a densidade dos elementos na tela
                    </p>
                  </div>
                  <Select value="comfortable">
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compacto</SelectItem>
                      <SelectItem value="comfortable">Confortável</SelectItem>
                      <SelectItem value="spacious">Espaçoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
