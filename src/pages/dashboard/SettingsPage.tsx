
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/use-theme';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [timeFormat, setTimeFormat] = useState('24h');
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy');
  const { theme, setTheme } = useTheme();

  // Buscar configurações do usuário
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) return;

        const { data: settings, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', data.session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar configurações:', error);
          return;
        }

        if (settings) {
          setEmailNotifications(settings.email_notifications);
          setPushNotifications(settings.push_notifications);
          setTimeFormat(settings.time_format || '24h');
          setDateFormat(settings.date_format || 'dd/MM/yyyy');
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveNotificationSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        toast.error('Você precisa estar logado para salvar configurações');
        return;
      }

      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', data.session.user.id)
        .maybeSingle();

      const settings = {
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        user_id: data.session.user.id,
      };

      let error;
      if (existingSettings?.id) {
        // Atualizar configurações existentes
        const result = await supabase
          .from('user_settings')
          .update(settings)
          .eq('id', existingSettings.id);
        error = result.error;
      } else {
        // Criar novas configurações
        const result = await supabase
          .from('user_settings')
          .insert([settings]);
        error = result.error;
      }

      if (error) throw error;
      toast.success('Configurações de notificação salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplaySettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        toast.error('Você precisa estar logado para salvar configurações');
        return;
      }

      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', data.session.user.id)
        .maybeSingle();

      const settings = {
        time_format: timeFormat,
        date_format: dateFormat,
        theme: theme,
        user_id: data.session.user.id,
      };

      let error;
      if (existingSettings?.id) {
        // Atualizar configurações existentes
        const result = await supabase
          .from('user_settings')
          .update(settings)
          .eq('id', existingSettings.id);
        error = result.error;
      } else {
        // Criar novas configurações
        const result = await supabase
          .from('user_settings')
          .insert([settings]);
        error = result.error;
      }

      if (error) throw error;
      toast.success('Configurações de exibição salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do sistema.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="display">Exibição</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>
                Configure como você deseja receber suas notificações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Notificações por E-mail</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receba notificações importantes por e-mail.
                  </span>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                  <span>Notificações Push</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receba notificações em tempo real no sistema.
                  </span>
                </Label>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveNotificationSettings}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Exibição</CardTitle>
              <CardDescription>
                Personalize a aparência e o formato de exibição do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="theme-toggle" className="flex flex-col space-y-1">
                  <span>Modo Escuro</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Alterne entre o tema claro e escuro.
                  </span>
                </Label>
                <Switch
                  id="theme-toggle"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="time-format">Formato de Hora</Label>
                <Select
                  value={timeFormat}
                  onValueChange={setTimeFormat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um formato de hora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                    <SelectItem value="24h">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="date-format">Formato de Data</Label>
                <Select
                  value={dateFormat}
                  onValueChange={setDateFormat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um formato de data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                    <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveDisplaySettings}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
