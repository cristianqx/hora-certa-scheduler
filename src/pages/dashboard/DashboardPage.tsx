
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Users, ClipboardCheck, ChevronRight, Check, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [copying, setCopying] = useState(false);
  const [serviceCount, setServiceCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    appointmentsWeek: 0,
    totalClients: 0,
    confirmationRate: '0%'
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Buscar perfil do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            // Simplificando o nome para criar um slug básico para o usuário
            const slug = profile.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^\w\s]/gi, '')
              .replace(/\s+/g, '-');
              
            setUsername(slug);
          }

          // Contar serviços ativos
          const { count: servicesCount } = await supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('active', true);
          
          setServiceCount(servicesCount || 0);

          // Buscar agendamentos
          const today = new Date();
          const todayStr = format(today, 'yyyy-MM-dd');
          const nextWeekStr = format(addDays(today, 7), 'yyyy-MM-dd');

          // Agendamentos de hoje
          const { data: todayAppointments } = await supabase
            .from('appointments')
            .select('*')
            .eq('provider_id', session.user.id)
            .gte('start_time', `${todayStr}T00:00:00`)
            .lte('start_time', `${todayStr}T23:59:59`);

          // Agendamentos da semana
          const { data: weekAppointments } = await supabase
            .from('appointments')
            .select('*')
            .eq('provider_id', session.user.id)
            .gte('start_time', `${todayStr}T00:00:00`)
            .lte('start_time', `${nextWeekStr}T23:59:59`);

          // Contagem de clientes únicos
          const { data: allAppointments } = await supabase
            .from('appointments')
            .select('client_email')
            .eq('provider_id', session.user.id);

          // Próximos agendamentos
          const { data: upcoming } = await supabase
            .from('appointments')
            .select('*, service:service_id (name)')
            .eq('provider_id', session.user.id)
            .gte('start_time', `${todayStr}T00:00:00`)
            .order('start_time', { ascending: true })
            .limit(3);

          setUpcomingAppointments(upcoming || []);
          
          // Cálculo de estatísticas
          const uniqueClients = new Set((allAppointments || []).map(app => app.client_email)).size;
          const confirmedCount = (allAppointments || []).filter(app => app.status === 'confirmed').length;
          const confirmationRate = allAppointments && allAppointments.length > 0
            ? Math.round((confirmedCount / allAppointments.length) * 100)
            : 0;

          setStats({
            appointmentsToday: todayAppointments?.length || 0,
            appointmentsWeek: weekAppointments?.length || 0,
            totalClients: uniqueClients,
            confirmationRate: `${confirmationRate}%`
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCopyLink = async () => {
    if (!username) return;
    
    const bookingLink = `${window.location.origin}/booking/${username}`;
    
    try {
      setCopying(true);
      await navigator.clipboard.writeText(bookingLink);
      toast.success('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Falha ao copiar o link:', err);
      toast.error('Não foi possível copiar o link');
    } finally {
      setCopying(false);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está um resumo da sua agenda.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/services/new">Novo Serviço</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos para o dia atual
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointmentsWeek}</div>
            <p className="text-xs text-muted-foreground">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Confirmação</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmationRate}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos confirmados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => {
                  const appointmentDate = new Date(appointment.start_time);
                  const formattedDate = format(appointmentDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
                  const formattedTime = format(appointmentDate, "HH:mm");
                  
                  return (
                    <div key={appointment.id} className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center text-primary-700 font-medium">
                        {appointment.client_name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{appointment.client_name}</h4>
                        <p className="text-sm text-muted-foreground">{appointment.service ? appointment.service.name : 'Serviço'}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {formattedDate} · {formattedTime}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" asChild>
                        <Link to={`/dashboard/appointments`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum agendamento futuro
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <Button variant="link" asChild>
                <Link to="/dashboard/appointments">Ver todos os agendamentos</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Link para Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-primary-50 rounded-lg p-4 text-sm text-primary-700 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-500" />
              <span>Os clientes podem agendar em:</span>
            </div>
            <div className="mt-4 flex">
              <Input 
                readOnly 
                className="bg-gray-50" 
                value={username ? `${window.location.origin}/booking/${username}` : 'Carregando...'}
              />
              <Button 
                variant="outline" 
                className="ml-2" 
                onClick={handleCopyLink}
                disabled={!username || copying}
              >
                {copying ? (
                  <>
                    <Check className="h-4 w-4 mr-1" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">Serviços Ativos</div>
                <div className="text-sm font-medium">{serviceCount} de {serviceCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">Links de Agendamento</div>
                <div className="text-sm font-medium">1 de 1</div>
              </div>
              <div className="px-4 py-3 rounded-lg bg-amber-50 text-amber-700 text-sm mt-4">
                <p>Você está no <strong>Plano Free</strong>. Atualize para o plano Pro para obter mais recursos.</p>
                <Button variant="outline" className="mt-3 text-xs h-8" asChild>
                  <Link to="/dashboard/plans">Explorar Planos</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
