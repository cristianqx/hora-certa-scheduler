
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, CheckCircle, ChevronLeft, Calendar as CalendarCheck } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Máscara para telefone brasileiro
const applyPhoneMask = (value: string) => {
  if (!value) return '';
  value = value.replace(/\D/g, '');
  if (value.length <= 2) {
    return value;
  }
  if (value.length <= 7) {
    return `(${value.slice(0, 2)}) ${value.slice(2)}`;
  }
  return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
};

const validationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  email: z.string().email('E-mail inválido').max(100, 'E-mail deve ter no máximo 100 caracteres'),
  phone: z.string().min(14, 'Telefone inválido').max(15, 'Telefone inválido'),
  notes: z.string().max(300, 'As observações devem ter no máximo 300 caracteres').optional(),
});

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: string | null;
}

interface BlockedTime {
  id: string;
  date: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  recurring: boolean;
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  service_id: string;
}

const PublicBookingPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [profileName, setProfileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (!username) return;
      
      try {
        // Verificar se já existe sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        
        // Se usuário estiver autenticado, redirecionar para o dashboard
        if (session?.user) {
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
      
      await fetchProfileAndServices();
    };
    
    checkAuthAndFetchData();
  }, [username, navigate]);

  const fetchProfileAndServices = async () => {
    if (!username) return;
    
    setIsLoading(true);
    try {
      // Buscar o perfil com base no username
      // Em uma implementação real, você teria uma tabela para mapear usernames para IDs
      // Aqui estamos simulando com o slug criado a partir do nome
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name');
      
      if (profileError) {
        throw profileError;
      }

      // Encontrar o perfil que corresponde ao username (slug)
      const matchedProfile = profiles?.find(profile => {
        const slug = profile.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/g, '-');
        return slug === username;
      });

      if (matchedProfile) {
        setProfileName(matchedProfile.name);
        setProviderId(matchedProfile.id);
        
        // Buscar serviços deste profissional
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('user_id', matchedProfile.id)
          .eq('active', true);
        
        if (servicesError) {
          throw servicesError;
        }
        
        setServices(servicesData || []);
        if (servicesData && servicesData.length > 0) {
          setSelectedService(servicesData[0]);
        }
        
        // Buscar bloqueios de datas
        const { data: blockedData, error: blockedError } = await supabase
          .from('blocked_times')
          .select('*')
          .eq('user_id', matchedProfile.id);
          
        if (blockedError) {
          throw blockedError;
        }
        
        setBlockedTimes(blockedData || []);
        
        // Criar lista de datas bloqueadas para o calendário
        const blockedDatesArray: Date[] = [];
        blockedData?.forEach(block => {
          if (block.date && block.all_day) {
            blockedDatesArray.push(new Date(block.date));
          }
        });
        setBlockedDates(blockedDatesArray);
        
        // Buscar agendamentos existentes
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, service_id')
          .eq('provider_id', matchedProfile.id);
          
        if (appointmentsError) {
          throw appointmentsError;
        }
        
        setExistingAppointments(appointmentsData || []);
      } else {
        // Usuário não encontrado
        console.error('Profissional não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar informações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar se um horário específico está bloqueado
  const isTimeBlocked = (dateStr: string, timeStr: string) => {
    // Verificar se existe agendamento neste horário
    const timeToCheck = `${dateStr}T${timeStr}:00`;
    
    const hasAppointment = existingAppointments.some(app => {
      const appStart = new Date(app.start_time).getTime();
      const appEnd = new Date(app.end_time).getTime();
      const checkTime = new Date(timeToCheck).getTime();
      
      return checkTime >= appStart && checkTime < appEnd;
    });
    
    if (hasAppointment) return true;
    
    // Verificar se cai em um bloqueio de horário específico
    const dayOfWeek = format(new Date(dateStr), 'EEEE', { locale: ptBR });
    const foundBlock = blockedTimes.some(block => {
      // Se é bloqueio recorrente e o dia da semana corresponde
      if (block.recurring && dayOfWeek.toLowerCase() === block.date) {
        const blockStart = block.start_time;
        const blockEnd = block.end_time;
        return timeStr >= blockStart && timeStr < blockEnd;
      }
      
      // Se é bloqueio para data específica
      if (block.date === dateStr) {
        if (block.all_day) return true;
        
        const blockStart = block.start_time;
        const blockEnd = block.end_time;
        return timeStr >= blockStart && timeStr < blockEnd;
      }
      
      return false;
    });
    
    return foundBlock;
  };

  // Gerar horários disponíveis para o dia selecionado
  useEffect(() => {
    if (date && selectedService) {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Buscar a disponibilidade do profissional para este dia da semana
      const fetchAvailability = async () => {
        try {
          const dayOfWeek = format(date, 'EEEE', { locale: ptBR }).toLowerCase();
          
          if (!providerId) return;
          
          const { data, error } = await supabase
            .from('availability')
            .select('*')
            .eq('user_id', providerId)
            .eq('day_of_week', dayOfWeek);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            const { start_time: startTime, end_time: endTime } = data[0];
            
            // Gerar horários a cada 30 minutos entre início e fim
            const times: string[] = [];
            let timePointer = startTime;
            const serviceDuration = selectedService.duration;
            
            while (timePointer <= endTime) {
              // Verificar se este horário não está bloqueado
              if (!isTimeBlocked(dateStr, timePointer)) {
                times.push(timePointer);
              }
              
              // Avançar para próximo horário considerando duração do serviço
              const [hours, minutes] = timePointer.split(':').map(Number);
              const currentTime = new Date();
              currentTime.setHours(hours, minutes);
              
              // Avançar 30 minutos
              const newTime = addMinutes(currentTime, 30);
              timePointer = format(newTime, 'HH:mm');
            }
            
            setAvailableTimes(times);
          } else {
            setAvailableTimes([]);
          }
        } catch (error) {
          console.error('Erro ao carregar disponibilidade:', error);
          setAvailableTimes([]);
        }
      };
      
      fetchAvailability();
    }
  }, [date, selectedService, providerId, blockedTimes, existingAppointments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      setFormData({
        ...formData,
        [name]: applyPhoneMask(value),
      });
    } else if (name === 'notes') {
      if (value.length <= 300) {
        setFormData({
          ...formData,
          [name]: value,
        });
      }
    } else {
      const maxLength = name === 'name' ? 50 : name === 'email' ? 100 : undefined;
      if (!maxLength || value.length <= maxLength) {
        setFormData({
          ...formData,
          [name]: value,
        });
      }
    }
    
    // Limpar erros ao digitar
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const handleTimeSelection = (time: string) => {
    setSelectedTime(time);
  };

  const handleServiceSelection = (service: Service) => {
    setSelectedService(service);
    setSelectedTime(null); // Resetar horário ao trocar de serviço
  };

  const goToNextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const goToPreviousStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const validateForm = () => {
    try {
      validationSchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !date || !selectedTime || !selectedService || !providerId) {
      toast.error('Por favor, preencha todos os campos corretamente');
      return;
    }
    
    try {
      // Calcular horário de término com base na duração do serviço
      const startTimeStr = `${format(date, 'yyyy-MM-dd')}T${selectedTime}:00`;
      const startTime = new Date(startTimeStr);
      const endTime = addMinutes(startTime, selectedService.duration);
      
      // Inserir agendamento no Supabase
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          provider_id: providerId,
          service_id: selectedService.id,
          client_name: formData.name,
          client_email: formData.email,
          start_time: startTimeStr,
          end_time: endTime.toISOString(),
          notes: formData.notes || null,
          status: 'pending'
        });
      
      if (error) {
        console.error('Erro ao agendar:', error);
        throw new Error(error.message);
      }
      
      // Ir para o passo de confirmação
      setStep(3);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast.error('Não foi possível realizar o agendamento. Tente novamente.');
    }
  };

  const handleReset = () => {
    setDate(undefined);
    setSelectedTime(null);
    setStep(1);
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: '',
    });
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profileName) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Profissional não encontrado</CardTitle>
              <CardDescription className="text-center">
                O link que você acessou não corresponde a nenhum profissional cadastrado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/')}>
                Voltar para a página inicial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Escolha uma data</h2>
            </div>

            {services.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-base font-medium mb-3">Selecione o serviço</h3>
                <div className="space-y-2">
                  {services.map((service) => (
                    <div 
                      key={service.id}
                      onClick={() => handleServiceSelection(service)}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        selectedService?.id === service.id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium">{service.name}</h4>
                        <span className="text-sm text-gray-500">
                          {service.price ? 
                            Number(service.price).toLocaleString('pt-BR', {
                              style: 'currency', 
                              currency: 'BRL'
                            }) : 
                            'Grátis'
                          }
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{service.duration} minutos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-amber-700 bg-amber-50 p-4 rounded-lg">
                Nenhum serviço disponível para agendamento.
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                      disabled={!selectedService}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => 
                        date < new Date() || 
                        date > new Date(new Date().setMonth(new Date().getMonth() + 2)) ||
                        blockedDates.some(blockedDate => 
                          blockedDate.toDateString() === date?.toDateString()
                        )
                      }
                      initialFocus
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {date && availableTimes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Horários disponíveis em {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleTimeSelection(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {date && availableTimes.length === 0 && (
              <div className="mt-6 text-center p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                Não há horários disponíveis para esta data. Por favor, selecione outra data.
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button 
                disabled={!date || !selectedTime || !selectedService} 
                onClick={goToNextStep}
              >
                Continuar
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <Button variant="ghost" onClick={goToPreviousStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <h2 className="text-xl font-semibold ml-2">Seus dados</h2>
            </div>

            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-4 w-4 text-primary-500 mr-2" />
                <span className="font-medium">{selectedService?.name} com {profileName}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-primary-500 mr-2" />
                <span>
                  {date && format(date, "EEEE, d 'de' MMMM", { locale: ptBR })} às {selectedTime}
                </span>
              </div>
              {selectedService?.price && (
                <div className="flex items-center mt-2">
                  <span className="font-medium">
                    {Number(selectedService.price).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Nome completo
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  maxLength={50}
                  className={formErrors.name ? "border-red-500" : ""}
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
                <div className="text-xs text-gray-500 flex justify-end">
                  {formData.name.length}/50
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  maxLength={100}
                  className={formErrors.email ? "border-red-500" : ""}
                  required
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
                <div className="text-xs text-gray-500 flex justify-end">
                  {formData.email.length}/100
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium">
                  Telefone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                  className={formErrors.phone ? "border-red-500" : ""}
                  required
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium">
                  Observações (opcional)
                </label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  maxLength={300}
                  className={cn("resize-none", formErrors.notes ? "border-red-500" : "")}
                />
                {formErrors.notes && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.notes}</p>
                )}
                <div className="text-xs text-gray-500 flex justify-end">
                  {formData.notes?.length || 0}/300
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit">
                  Confirmar Agendamento
                </Button>
              </div>
            </form>
          </div>
        );
      case 3:
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Agendamento confirmado!</h2>
            <p className="text-gray-600 mb-6">
              Enviamos um email com os detalhes do seu agendamento para {formData.email}
            </p>

            <div className="bg-primary-50 rounded-lg p-6 mb-6 max-w-md mx-auto">
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 text-primary-500 mr-2" />
                <span className="font-medium">{selectedService?.name} com {profileName}</span>
              </div>
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-primary-500 mr-2" />
                <span>
                  {date && format(date, "EEEE, d 'de' MMMM", { locale: ptBR })} às {selectedTime}
                </span>
              </div>
              {selectedService?.price && (
                <div className="font-medium">
                  {Number(selectedService.price).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </div>
              )}
            </div>

            <Button onClick={handleReset} variant="outline">
              <CalendarCheck className="h-4 w-4 mr-2" />
              Fazer um novo agendamento
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Card>
          <CardHeader>
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium mb-4">
              {profileName && profileName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <CardTitle className="text-2xl">Agendar com {profileName}</CardTitle>
            <CardDescription>
              {selectedService ? `${selectedService.name} - ${selectedService.duration} minutos` : 'Selecione um serviço para continuar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicBookingPage;
