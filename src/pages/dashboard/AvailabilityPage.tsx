
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Calendar as CalendarIcon, Clock, Plus, Check, Trash, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const days = [
  { id: 'monday', label: 'Segunda-feira' },
  { id: 'tuesday', label: 'Terça-feira' },
  { id: 'wednesday', label: 'Quarta-feira' },
  { id: 'thursday', label: 'Quinta-feira' },
  { id: 'friday', label: 'Sexta-feira' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
];

const timeSlots = [
  { id: '08:00', label: '08:00' },
  { id: '08:30', label: '08:30' },
  { id: '09:00', label: '09:00' },
  { id: '09:30', label: '09:30' },
  { id: '10:00', label: '10:00' },
  { id: '10:30', label: '10:30' },
  { id: '11:00', label: '11:00' },
  { id: '11:30', label: '11:30' },
  { id: '12:00', label: '12:00' },
  { id: '12:30', label: '12:30' },
  { id: '13:00', label: '13:00' },
  { id: '13:30', label: '13:30' },
  { id: '14:00', label: '14:00' },
  { id: '14:30', label: '14:30' },
  { id: '15:00', label: '15:00' },
  { id: '15:30', label: '15:30' },
  { id: '16:00', label: '16:00' },
  { id: '16:30', label: '16:30' },
  { id: '17:00', label: '17:00' },
  { id: '17:30', label: '17:30' },
  { id: '18:00', label: '18:00' },
];

interface Availability {
  id?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface BlockedTime {
  id?: string;
  date: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  notes: string | null;
  recurring: boolean;
}

const AvailabilityPage: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [blockDialog, setBlockDialog] = useState(false);
  const [blockDate, setBlockDate] = useState<Date | undefined>(undefined);
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndTime, setBlockEndTime] = useState("17:00");
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [blockNotes, setBlockNotes] = useState("");
  const [blockRecurring, setBlockRecurring] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("weekly");
  const [isLoading, setIsLoading] = useState(true);
  const [breakTime, setBreakTime] = useState("0");

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    setIsLoading(true);
    try {
      // Carregar configurações de disponibilidade semanal
      const { data: availData, error: availError } = await supabase
        .from('availability')
        .select('*')
        .order('day_of_week');

      if (availError) throw availError;

      // Converter para o formato usado pelo componente
      const availObj: Record<string, Availability> = {};
      const daysEnabled: Record<string, boolean> = { ...selectedDays };
      
      if (availData && availData.length > 0) {
        availData.forEach((item: Availability) => {
          availObj[item.day_of_week] = item;
          daysEnabled[item.day_of_week] = true;
        });
        setSelectedDays(daysEnabled);
      }
      
      setAvailability(availObj);

      // Carregar horários bloqueados
      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_times')
        .select('*')
        .order('date', { ascending: true });

      if (blockedError) throw blockedError;
      setBlockedTimes(blockedData || []);

    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error);
      toast.error('Não foi possível carregar as configurações de disponibilidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Salvar disponibilidade semanal
      const promises = [];

      // Para cada dia selecionado, criar/atualizar registro
      for (const day of days) {
        if (selectedDays[day.id as keyof typeof selectedDays]) {
          const availData = availability[day.id] || {
            day_of_week: day.id,
            start_time: "09:00",
            end_time: "17:00"
          };
          
          // Se já existe um registro para este dia
          if (availData.id) {
            promises.push(
              supabase
                .from('availability')
                .update({
                  start_time: availData.start_time,
                  end_time: availData.end_time
                })
                .eq('id', availData.id)
            );
          } else {
            // Se é um novo registro
            promises.push(
              supabase
                .from('availability')
                .insert({
                  day_of_week: day.id,
                  start_time: availData.start_time,
                  end_time: availData.end_time
                })
            );
          }
        } else if (availability[day.id]?.id) {
          // Se o dia foi desmarcado, excluir registro
          promises.push(
            supabase
              .from('availability')
              .delete()
              .eq('id', availability[day.id].id)
          );
        }
      }

      await Promise.all(promises);
      
      toast.success('Disponibilidade atualizada com sucesso!');
      
      // Recarregar dados para sincronização
      loadAvailability();
    } catch (error) {
      console.error('Erro ao salvar disponibilidade:', error);
      toast.error('Não foi possível salvar as configurações');
    }
  };
  
  const handleOpenBlockDialog = (block?: BlockedTime) => {
    if (block) {
      setEditingBlockId(block.id || null);
      setBlockDate(block.date ? new Date(block.date) : undefined);
      setBlockStartTime(block.start_time);
      setBlockEndTime(block.end_time);
      setBlockAllDay(block.all_day);
      setBlockNotes(block.notes || '');
      setBlockRecurring(block.recurring);
    } else {
      setEditingBlockId(null);
      setBlockDate(undefined);
      setBlockStartTime("09:00");
      setBlockEndTime("17:00");
      setBlockAllDay(false);
      setBlockNotes('');
      setBlockRecurring(false);
    }
    setBlockDialog(true);
  };

  const handleSaveBlock = async () => {
    if (!blockDate) {
      toast.error("Selecione uma data para bloquear");
      return;
    }

    try {
      const blockData = {
        date: format(blockDate, 'yyyy-MM-dd'),
        start_time: blockStartTime,
        end_time: blockEndTime,
        all_day: blockAllDay,
        notes: blockNotes || null,
        recurring: blockRecurring
      };
      
      if (editingBlockId) {
        await supabase
          .from('blocked_times')
          .update(blockData)
          .eq('id', editingBlockId);
            
        toast.success('Bloqueio atualizado com sucesso');
      } else {
        await supabase
          .from('blocked_times')
          .insert(blockData);
            
        toast.success('Horário bloqueado com sucesso');
      }
      
      // Atualizar lista de horários bloqueados
      await loadAvailability();
      setBlockDialog(false);
    } catch (error) {
      console.error('Erro ao salvar bloqueio:', error);
      toast.error('Não foi possível salvar o bloqueio');
    }
  };
  
  const handleDeleteBlock = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este bloqueio?')) {
      try {
        await supabase
          .from('blocked_times')
          .delete()
          .eq('id', id);
        
        toast.success('Bloqueio removido com sucesso');
        await loadAvailability();
      } catch (error) {
        console.error('Erro ao remover bloqueio:', error);
        toast.error('Não foi possível remover o bloqueio');
      }
    }
  };

  const updateDayAvailability = (day: string, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day] || { day_of_week: day },
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Disponibilidade</h1>
        <p className="text-muted-foreground">
          Defina quando você está disponível para receber agendamentos.
        </p>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="weekly">Disponibilidade Semanal</TabsTrigger>
          <TabsTrigger value="blocked">Bloqueios e Exceções</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dias da semana</CardTitle>
                  <CardDescription>
                    Selecione os dias em que você está disponível para atender.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {days.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.id}
                        checked={selectedDays[day.id as keyof typeof selectedDays]}
                        onCheckedChange={(checked) => {
                          setSelectedDays({ ...selectedDays, [day.id]: !!checked });
                        }}
                      />
                      <Label htmlFor={day.id}>{day.label}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Horários</CardTitle>
                    <CardDescription>
                      Defina o horário de início e término para cada dia.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedDays)
                      .filter(([_, selected]) => selected)
                      .map(([day, _]) => {
                        const dayLabel = days.find((d) => d.id === day)?.label;
                        const availDay = availability[day] || { 
                          day_of_week: day, 
                          start_time: '09:00', 
                          end_time: '17:00' 
                        };
                        
                        return (
                          <div key={day} className="border rounded-md p-4">
                            <h4 className="font-medium mb-3">{dayLabel}</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Início</Label>
                                <Select 
                                  value={availDay.start_time}
                                  onValueChange={value => updateDayAvailability(day, 'start_time', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.filter(slot => slot.id <= availDay.end_time).map((slot) => (
                                      <SelectItem key={`start-${day}-${slot.id}`} value={slot.id}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Término</Label>
                                <Select 
                                  value={availDay.end_time}
                                  onValueChange={value => updateDayAvailability(day, 'end_time', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.filter(slot => slot.id >= availDay.start_time).map((slot) => (
                                      <SelectItem key={`end-${day}-${slot.id}`} value={slot.id}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Intervalos</CardTitle>
                    <CardDescription>
                      Configure o tempo entre agendamentos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tempo de intervalo</Label>
                      <Select value={breakTime} onValueChange={setBreakTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sem intervalo</SelectItem>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="10">10 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tempo adicional entre cada agendamento para preparação.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-6">
              <Button type="submit">Salvar Disponibilidade</Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="blocked">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dias e Horários Bloqueados</CardTitle>
                <CardDescription>
                  Bloqueie datas específicas ou períodos em que você não estará disponível.
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenBlockDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Bloqueio
              </Button>
            </CardHeader>
            <CardContent>
              {blockedTimes.length > 0 ? (
                <div className="space-y-4">
                  {blockedTimes.map((block) => (
                    <div key={block.id} className="flex justify-between items-center border p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                          <CalendarIcon className="h-5 w-5 text-primary-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {block.date ? (
                              format(new Date(block.date), "dd 'de' MMMM", { locale: ptBR })
                            ) : 'Data não especificada'}
                            {block.recurring && ' (Recorrente)'}
                          </h4>
                          
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {block.all_day ? (
                              <span>Dia inteiro</span>
                            ) : (
                              <span>{block.start_time} <ArrowRight className="h-3 w-3 mx-1 inline" /> {block.end_time}</span>
                            )}
                          </div>
                          
                          {block.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {block.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          onClick={() => handleOpenBlockDialog(block)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          onClick={() => block.id && handleDeleteBlock(block.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Você não possui bloqueios de horário. Clique no botão acima para adicionar.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog para adicionar/editar bloqueio */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlockId ? 'Editar Bloqueio' : 'Adicionar Bloqueio'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blockDate">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !blockDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockDate ? format(blockDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={blockDate}
                    onSelect={setBlockDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="allDay" 
                checked={blockAllDay}
                onCheckedChange={(checked) => setBlockAllDay(!!checked)} 
              />
              <Label htmlFor="allDay">Dia inteiro</Label>
            </div>
            
            {!blockAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora de início</Label>
                  <Select value={blockStartTime} onValueChange={setBlockStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.filter(slot => slot.id <= blockEndTime).map((slot) => (
                        <SelectItem key={`block-start-${slot.id}`} value={slot.id}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora de término</Label>
                  <Select value={blockEndTime} onValueChange={setBlockEndTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.filter(slot => slot.id >= blockStartTime).map((slot) => (
                        <SelectItem key={`block-end-${slot.id}`} value={slot.id}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="blockNotes">Observações (opcional)</Label>
              <Textarea
                id="blockNotes"
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                placeholder="Ex: Feriado, férias, etc."
                className="resize-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={blockRecurring}
                onCheckedChange={(checked) => setBlockRecurring(!!checked)}
              />
              <Label htmlFor="recurring">Bloquear este dia todas as semanas</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveBlock} type="submit">
              {editingBlockId ? 'Atualizar' : 'Adicionar'} Bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvailabilityPage;
