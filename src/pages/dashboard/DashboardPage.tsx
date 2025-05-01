
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Users, ClipboardCheck, ChevronRight, Check, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const DashboardPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [copying, setCopying] = useState(false);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
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
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);

  const stats = [
    { 
      name: 'Agendamentos Hoje', 
      value: '3', 
      icon: Calendar, 
      change: '+20%',
      changeType: 'increase' 
    },
    { 
      name: 'Agendamentos esta Semana', 
      value: '12', 
      icon: Calendar, 
      change: '+5%',
      changeType: 'increase' 
    },
    { 
      name: 'Total de Clientes', 
      value: '24', 
      icon: Users, 
      change: '+12%',
      changeType: 'increase' 
    },
    { 
      name: 'Taxa de Confirmação', 
      value: '94%', 
      icon: ClipboardCheck, 
      change: '+2%',
      changeType: 'increase' 
    },
  ];

  const upcomingAppointments = [
    { id: 1, client: 'Ana Silva', service: 'Consulta Inicial', date: '2025-04-30T14:30:00', status: 'confirmed' },
    { id: 2, client: 'Carlos Oliveira', service: 'Sessão de Acompanhamento', date: '2025-04-30T16:00:00', status: 'confirmed' },
    { id: 3, client: 'Marina Costa', service: 'Consulta Inicial', date: '2025-05-01T10:00:00', status: 'confirmed' },
  ];

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
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change} em relação ao período anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => {
                const appointmentDate = new Date(appointment.date);
                const formattedDate = appointmentDate.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
                const formattedTime = appointmentDate.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                
                return (
                  <div key={appointment.id} className="flex items-center gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center text-primary-700 font-medium">
                      {appointment.client.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{appointment.client}</h4>
                      <p className="text-sm text-muted-foreground">{appointment.service}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {formattedDate} · {formattedTime}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
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
                <div className="text-sm font-medium">1 de 1</div>
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
