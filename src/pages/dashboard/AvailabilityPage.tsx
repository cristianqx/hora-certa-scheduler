
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

const AvailabilityPage: React.FC = () => {
  const [selectedDays, setSelectedDays] = React.useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Disponibilidade atualizada com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Disponibilidade</h1>
        <p className="text-muted-foreground">
          Defina quando você está disponível para receber agendamentos.
        </p>
      </div>

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
                    return (
                      <div key={day} className="border rounded-md p-4">
                        <h4 className="font-medium mb-3">{dayLabel}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Início</Label>
                            <Select defaultValue="09:00">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.filter(slot => slot.id <= "14:00").map((slot) => (
                                  <SelectItem key={`start-${day}-${slot.id}`} value={slot.id}>
                                    {slot.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Término</Label>
                            <Select defaultValue="17:00">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.filter(slot => slot.id >= "10:00").map((slot) => (
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
                  <Select defaultValue="0">
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
    </div>
  );
};

export default AvailabilityPage;
