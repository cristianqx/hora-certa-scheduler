
import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CalendarClock, User, Mail, Clock, Calendar as CalendarIcon, DollarSign, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

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

const AppointmentsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([]);
  
  // Fetch appointments
  useEffect(() => {
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
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Falha ao carregar agendamentos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);
  
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
    }
  };
  
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);
        
      if (error) throw error;
      
      // Update local state
      setAppointments(appointments.map(app => 
        app.id === appointmentId ? { ...app, status: newStatus } : app
      ));
      
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
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
                        {format(parseISO(appointment.start_time), 'HH:mm')} - 
                        {format(parseISO(appointment.end_time), 'HH:mm')}
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
                      {format(parseISO(selectedAppointment.start_time), 'HH:mm')} - 
                      {format(parseISO(selectedAppointment.end_time), 'HH:mm')}
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
                        R$ {selectedAppointment.service.price}
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

export default AppointmentsPage;
