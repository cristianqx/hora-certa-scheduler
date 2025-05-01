
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
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

    fetchProfileAndServices();
  }, [username]);

  // Gerar horários disponíveis para o dia selecionado
  useEffect(() => {
    if (date) {
      // Em uma implementação real, você buscaria os horários disponíveis da API
      // Aqui estamos gerando horários fixos para demonstração
      setAvailableTimes([
        '09:00',
        '10:00',
        '11:00',
        '14:00',
        '15:00',
        '16:00',
      ]);
    }
  }, [date]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Em uma implementação real, você salvaria o agendamento no banco de dados
      // Process the booking
      setStep(3);
      window.scrollTo(0, 0);
    }
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
                        <span className="text-sm text-gray-500">{service.price || 'Grátis'}</span>
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
                      disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 2))}
                      initialFocus
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
            </div>

            <Button onClick={() => navigate('/')} variant="outline">
              Voltar para a página inicial
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
