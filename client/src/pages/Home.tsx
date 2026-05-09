import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Award, Star, CalendarClock } from "lucide-react";

export default function Home() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da Mocidade Azaluz</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatNextMeeting = (meeting: { date: string | Date } | null | undefined) => {
    if (!meeting) return null;
    const d = typeof meeting.date === 'string' 
      ? new Date(meeting.date + 'T12:00:00') 
      : new Date(meeting.date);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da Mocidade Azaluz - GFE João Ramalho</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Encontros
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">encontros realizados</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Cadastrados
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">jovens ativos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média de Presença
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.avgAttendance || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">alunos por encontro</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aluno Destaque (Geral)
            </CardTitle>
            <Award className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats?.topStudent?.studentName || "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.topStudent ? `${stats.topStudent.count} presenças no total` : "sem dados"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Destaque do Mês
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats?.topStudentMonth?.studentName || "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.topStudentMonth ? `${stats.topStudentMonth.count} presenças este mês` : "nenhum encontro este mês"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximo Encontro
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">
              {formatNextMeeting(stats?.nextMeeting) || "Não agendado"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.nextMeeting ? "encontro programado" : "agende na aba Presença"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Sobre a Mocidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              A Mocidade Azaluz é o grupo de jovens do GFE João Ramalho, 
              dedicado ao estudo e prática dos princípios espíritas com amor, 
              fraternidade e evolução espiritual.
            </p>
            <p>
              Este sistema permite o controle de presença dos encontros semanais, 
              acompanhamento individual dos jovens e geração de relatórios.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/presenca" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="p-2 rounded-md bg-primary/20">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Registrar Presença</p>
                <p className="text-xs text-muted-foreground">Marcar presença do encontro de hoje</p>
              </div>
            </a>
            <a href="/alunos" className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="p-2 rounded-md bg-primary/20">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Gerenciar Alunos</p>
                <p className="text-xs text-muted-foreground">Cadastrar ou editar participantes</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
