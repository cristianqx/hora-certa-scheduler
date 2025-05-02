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
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

interface Appointment {
  id: string;
  client_email: string;
  client_name: string;
  start_time: string;
  status?: string;
  service?: {
    name: string;
  };
}

interface AppointmentData {
  client_email: string;
  status: string;
}

// Função utilitária para exibir horário no fuso do usuário
function formatHorarioBr(isoString: string, timeZone: string = 'America/Sao_Paulo') {
  const date = new Date(isoString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone
  });
}

const DashboardPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [copying, setCopying] = useState(false);
  const [serviceCount, setServiceCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    appointmentsWeek: 0,
    totalClients: 0,
    confirmationRate: '0%'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDragging, setIsDragging] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userTimezone, setUserTimezone] = useState<string>('America/Sao_Paulo');
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        setSession(currentSession);
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, timezone')
          .eq('id', currentSession.user.id)
          .single();
        
        // @ts-expect-error
        if (profile != null && typeof profile === 'object' && 'name' in profile) {
          const safeProfile = profile as { name: string; timezone?: string };
          setUsername(
            safeProfile.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/\[\u0300-\u036f]/g, '')
              .replace(/[^\w\s]/gi, '')
              .replace(/\s+/g, '-')
          );
          setUserTimezone(safeProfile.timezone || 'America/Sao_Paulo');
        }

        // Contar serviços ativos
        const { count: servicesCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentSession.user.id)
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
          .eq('provider_id', currentSession.user.id)
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${todayStr}T23:59:59`);

        // Agendamentos da semana
        const { data: weekAppointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('provider_id', currentSession.user.id)
          .gte('start_time', `${todayStr}T00:00:00`)
          .lte('start_time', `${nextWeekStr}T23:59:59`);

        // Contagem de clientes únicos
        const { data: allAppointmentsData } = await supabase
          .from('appointments')
          .select('client_email, status')
          .eq('provider_id', currentSession.user.id);
        
        // Ensure allAppointmentsData is properly typed
        const allAppointments = allAppointmentsData as AppointmentData[] || [];

        // Próximos agendamentos
        const { data: upcoming } = await supabase
          .from('appointments')
          .select('*, service:service_id (name)')
          .eq('provider_id', currentSession.user.id)
          .gte('start_time', `${todayStr}T00:00:00`)
          .order('start_time', { ascending: true })
          .limit(3);

        setUpcomingAppointments(upcoming || []);
        
        // Cálculo de estatísticas
        const uniqueClients = new Set(allAppointments.map(app => app.client_email)).size;
        const confirmedCount = allAppointments.filter(app => app.status === 'confirmed').length;
        const confirmationRate = allAppointments && allAppointments.length > 0
          ? Math.round((confirmedCount / allAppointments.length) * 100)
          : 0;

        setStats({
          appointmentsToday: todayAppointments?.length || 0,
          appointmentsWeek: weekAppointments?.length || 0,
          totalClients: uniqueClients,
          confirmationRate: `${confirmationRate}%`
        });

        // Buscar agendamentos para o calendário
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*, service:service_id (name)')
          .eq('provider_id', currentSession.user.id)
          .order('start_time', { ascending: true });

        if (appointments) {
          const events = appointments.map(app => ({
            id: app.id,
            title: `${app.client_name} - ${app.service?.name}`,
            start: formatHorarioBr(app.start_time, userTimezone),
            end: formatHorarioBr(app.end_time, userTimezone),
            backgroundColor: app.status === 'confirmed' ? '#22c55e' : '#f59e0b',
            borderColor: app.status === 'confirmed' ? '#16a34a' : '#d97706',
            textColor: '#ffffff',
            extendedProps: {
              status: app.status,
              clientEmail: app.client_email,
              notes: app.notes
            }
          }));
          setCalendarEvents(events);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleEventDrop = async (info: any) => {
    const { event, oldEvent } = info;
    const newStart = event.start;
    const newEnd = event.end;
    const appointmentId = event.id;

    try {
      // Verificar disponibilidade no novo horário
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', session?.user?.id)
        .neq('id', appointmentId)
        .or(`start_time.lte.${newEnd.toISOString()},end_time.gte.${newStart.toISOString()}`);

      if (conflicts && conflicts.length > 0) {
        // Reverter o evento para a posição original
        info.revert();
        toast.error('Horário não disponível. Já existe outro agendamento neste período.');
        return;
      }

      // Atualizar o agendamento no banco de dados
      const { error } = await supabase
        .from('appointments')
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success('Agendamento atualizado com sucesso!');
      
      // Recarregar os eventos do calendário
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      info.revert();
      toast.error('Não foi possível atualizar o agendamento');
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

      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] md:h-[700px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={isMobile ? "timeGridDay" : "dayGridMonth"}
              headerToolbar={{
                left: isMobile ? 'prev,next' : 'prev,next today',
                center: 'title',
                right: isMobile ? 'timeGridDay,timeGridWeek' : 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locale={ptBrLocale}
              events={calendarEvents}
              editable={true}
              droppable={true}
              eventDrop={handleEventDrop}
              eventDragStart={() => setIsDragging(true)}
              eventDragStop={() => setIsDragging(false)}
              eventClick={(info) => {
                if (isDragging) return;
                const event = info.event;
                toast.info(
                  <div className="space-y-2">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm">Status: {event.extendedProps.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</p>
                    <p className="text-sm">Email: {event.extendedProps.clientEmail}</p>
                    {event.extendedProps.notes && (
                      <p className="text-sm">Observações: {event.extendedProps.notes}</p>
                    )}
                  </div>
                );
              }}
              height="100%"
              selectable={true}
              selectMirror={true}
              dayMaxEvents={!isMobile}
              weekends={true}
              nowIndicator={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              views={{
                timeGridDay: {
                  titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                  slotMinTime: '08:00:00',
                  slotMaxTime: '20:00:00',
                },
                timeGridWeek: {
                  titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                  slotMinTime: '08:00:00',
                  slotMaxTime: '20:00:00',
                },
                dayGridMonth: {
                  titleFormat: { year: 'numeric', month: 'long' },
                  dayMaxEvents: true,
                }
              }}
              eventDisplay={isMobile ? 'list-item' : 'auto'}
              eventMinHeight={isMobile ? 30 : 20}
              slotMinWidth={isMobile ? 50 : 100}
              allDaySlot={!isMobile}
              slotDuration="00:30:00"
              slotLabelInterval="01:00"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              eventConstraint={{
                startTime: '08:00',
                endTime: '20:00',
                dows: [1, 2, 3, 4, 5, 6] // Segunda a Sábado
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
