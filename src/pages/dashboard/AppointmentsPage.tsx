import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { CalendarClock, User, Mail, Clock, Calendar as CalendarIcon, DollarSign, ClipboardList, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createNotification } from '@/utils/notificationUtils';

interface Appointment {
  id: string;
  client_name: string;
  client_email: string;
  start_time: string;
  end_time: string;
  service_id: string;
  notes: string | null;
  status: string;
  service?: {
    name: string;
    price: string | null;
  };
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

const AppointmentsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [monthlyAppointments, setMonthlyAppointments] = useState<Record<string, Appointment[]>>({});
  const [userTimezone, setUserTimezone] = useState<string>('America/Sao_Paulo');
  
  // Fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  // Buscar timezone do perfil ao carregar a página
  useEffect(() => {
    const fetchTimezone = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;
      const userId = session.session.user.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single();
      setUserTimezone((profile as any)?.timezone || 'America/Sao_Paulo');
    };
    fetchTimezone();
  }, []);
  
  const fetchAppointments = async () => {
    setIsLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setIsLoading(false);
        return;
      }
      
      const userId = session.session.user.id;
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:service_id (
            name,
            price
          )
        `)
        .eq('provider_id', userId);
      
      if (error) throw error;
      
      setAppointments(data || []);
      
      // Extract dates with appointments for highlighting
      const dates = (data || []).map(app => parseISO(app.start_time));
      setAppointmentDates(dates);
      
      // Group appointments by date for calendar view
      const monthlyData: Record<string, Appointment[]> = {};
      (data || []).forEach(appointment => {
        const dateKey = format(parseISO(appointment.start_time), 'yyyy-MM-dd');
        if (!monthlyData[dateKey]) {
          monthlyData[dateKey] = [];
        }
        monthlyData[dateKey].push(appointment);
      });
      setMonthlyAppointments(monthlyData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Falha ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter appointments for the selected date
  const appointmentsForSelectedDate = appointments.filter(appointment => 
    isSameDay(parseISO(appointment.start_time), selectedDate)
  ).sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      if (activeTab === 'calendar') {
        setCalendarView(date);
      }
    }
  };
  
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      // Reload appointments after status update
      await fetchAppointments();
      
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({
          ...selectedAppointment,
          status: newStatus
        });
      }
      
      // Create notification for status update
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await createNotification({
          userId: session.user.id,
          message: `Status do agendamento atualizado para ${newStatus === 'confirmed' ? 'confirmado' : newStatus === 'canceled' ? 'cancelado' : 'pendente'}`,
          type: 'appointment',
          relatedId: appointmentId
        });
      }
      
      toast.success('Status atualizado com sucesso');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Erro ao atualizar status');
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500">Cancelado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDayAppointments = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return monthlyAppointments[dateKey] || [];
  };
  
  const handlePreviousMonth = () => {
    setCalendarView(prevDate => subMonths(prevDate, 1));
  };
  
  const handleNextMonth = () => {
    setCalendarView(prevDate => addMonths(prevDate, 1));
  };
  
  const currentMonth = format(calendarView, 'MMMM yyyy', { locale: ptBR });
  const startDate = startOfMonth(calendarView);
  const endDate = endOfMonth(calendarView);
  
  // Fixed function to safely get days in month and create weeks
  const getWeeksOfMonth = (start: Date, end: Date) => {
    try {
      // Safely get days in the interval
      const daysInMonth = eachDayOfInterval({ start, end });
      
      if (!daysInMonth || !Array.isArray(daysInMonth) || daysInMonth.length === 0) {
        console.error('Invalid days in month array', { start, end });
        return []; // Return empty array if no valid days
      }
      
      // Calculate how many weeks we need (safely)
      const weeksNeeded = Math.ceil(daysInMonth.length / 7);
      
      // Validate weeks calculation
      if (!Number.isInteger(weeksNeeded) || weeksNeeded <= 0 || weeksNeeded > 6) {
        console.error('Invalid weeks calculation', { daysInMonth: daysInMonth.length, weeksNeeded });
        return [];
      }
      
      // Create array of weeks with valid length
      return Array.from({ length: weeksNeeded }).map((_, weekIdx) => {
        const weekStart = weekIdx * 7;
        const daysInWeek = daysInMonth.slice(weekStart, weekStart + 7);
        
        // Get first day of week (0 = Sunday, 1 = Monday, etc.)
        const firstDayOfWeek = daysInWeek[0]?.getDay() || 0;
        
        // Create array for empty cells before first day of month
        const emptyCellsBefore = Array.from({ length: firstDayOfWeek }).map(() => null);
        
        // Combine empty cells with days
        const filledCells = [...emptyCellsBefore, ...daysInWeek];
        
        // Calculate cells needed after last day to fill week
        const remainingCells = 7 - filledCells.length;
        const emptyCellsAfter = remainingCells > 0 ? 
          Array.from({ length: remainingCells }).map(() => null) : [];
        
        return [...filledCells, ...emptyCellsAfter];
      });
    } catch (error) {
      console.error('Error generating calendar weeks:', error);
      return []; // Return empty array on error
    }
  };
  
  // Safely generate weeks
  const weeksOfMonth = getWeeksOfMonth(startDate, endDate);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus horários e consulte agendamentos.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">Visualização em Lista</TabsTrigger>
          <TabsTrigger value="calendar">Visualização em Calendário</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" /> 
                  Calendário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  className="rounded-md border mx-auto pointer-events-auto"
                  modifiers={{
                    hasAppointment: appointmentDates,
                  }}
                  modifiersStyles={{
                    hasAppointment: { 
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '100%'
                    }
                  }}
                  locale={ptBR}
                />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Horários para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">Carregando...</div>
                  ) : appointmentsForSelectedDate.length > 0 ? (
                    appointmentsForSelectedDate.map((appointment) => (
                      <div 
                        key={appointment.id} 
                        className="flex items-center gap-4 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-700">
                          {appointment.client_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{appointment.client_name}</h3>
                            {getStatusBadge(appointment.status)}
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            {appointment.service?.name || 'Serviço'}
                          </div>
                          
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatHorarioBr(appointment.start_time, userTimezone)} - 
                            {formatHorarioBr(appointment.end_time, userTimezone)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum agendamento para esta data.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="calendar">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Calendário Mensal</CardTitle>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="mx-4 font-medium">
                  {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}
                </span>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {weeksOfMonth.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Domingo</TableHead>
                      <TableHead className="text-center">Segunda</TableHead>
                      <TableHead className="text-center">Terça</TableHead>
                      <TableHead className="text-center">Quarta</TableHead>
                      <TableHead className="text-center">Quinta</TableHead>
                      <TableHead className="text-center">Sexta</TableHead>
                      <TableHead className="text-center">Sábado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeksOfMonth.map((week, weekIdx) => (
                      <TableRow key={`week-${weekIdx}`}>
                        {week.map((day, dayIdx) => {
                          if (!day) {
                            return <TableCell key={`empty-${weekIdx}-${dayIdx}`} className="h-24"></TableCell>;
                          }
                          
                          const isToday = isSameDay(day, new Date());
                          const isSelected = isSameDay(day, selectedDate);
                          const dayAppointments = getDayAppointments(day);
                          const hasAppointments = dayAppointments.length > 0;
                          
                          return (
                            <TableCell 
                              key={`day-${format(day, 'yyyy-MM-dd')}`}
                              className={`h-24 align-top p-1 border ${
                                isToday ? 'bg-primary-50' : ''
                              } ${
                                isSelected ? 'ring-2 ring-primary' : ''
                              } hover:bg-gray-50 cursor-pointer`}
                              onClick={() => handleDateChange(day)}
                            >
                              <div className="flex flex-col h-full">
                                <div className={`p-1 text-right ${
                                  isToday ? 'font-bold' : ''
                                } text-sm`}>
                                  {format(day, 'd')}
                                </div>
                                
                                <div className="flex-1 overflow-y-auto max-h-20 space-y-1">
                                  {hasAppointments ? (
                                    dayAppointments.map(app => (
                                      <div 
                                        key={app.id}
                                        className={`px-2 py-1 text-xs rounded truncate ${
                                          app.status === 'canceled' ? 'bg-red-100 text-red-800' :
                                          app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAppointmentClick(app);
                                        }}
                                      >
                                        {formatHorarioBr(app.start_time, userTimezone)} - {app.client_name.split(' ')[0]}
                                      </div>
                                    ))
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Erro ao gerar o calendário. Por favor, atualize a página.
                </div>
              )}
              
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Confirmado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Cancelado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Detalhes do Agendamento</DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedAppointment.start_time), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">{selectedAppointment.client_name}</span>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Horário:</span> 
                      {formatHorarioBr(selectedAppointment.start_time, userTimezone)} - 
                      {formatHorarioBr(selectedAppointment.end_time, userTimezone)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Email:</span> 
                      {selectedAppointment.client_email}
                    </div>
                    
                    {selectedAppointment.service?.name && (
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Serviço:</span> 
                        {selectedAppointment.service.name}
                      </div>
                    )}
                    
                    {selectedAppointment.service?.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Valor:</span> 
                        {Number(selectedAppointment.service.price).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </div>
                    )}
                  </div>
                  
                  {selectedAppointment.notes && (
                    <>
                      <Separator />
                      <div>
                        <span className="font-medium mb-1 block">Notas:</span>
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                          {selectedAppointment.notes}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <DialogFooter className="flex sm:justify-between">
                <div className="flex gap-2">
                  {selectedAppointment.status !== 'confirmed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusChange(selectedAppointment.id, 'confirmed')}
                    >
                      Confirmar
                    </Button>
                  )}
                  
                  {selectedAppointment.status !== 'canceled' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleStatusChange(selectedAppointment.id, 'canceled')}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
                
                <Button 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Exportar o componente envolto em um ErrorBoundary para prevenir falhas completas da página
const AppointmentsPageWithErrorBoundary = () => (
  <ErrorBoundary fallback={<div className="p-8">Ocorreu um erro ao carregar os agendamentos. Por favor, atualize a página.</div>}>
    <AppointmentsPage />
  </ErrorBoundary>
);

export default AppointmentsPageWithErrorBoundary;
