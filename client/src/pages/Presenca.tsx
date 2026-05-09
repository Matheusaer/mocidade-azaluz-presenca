import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { CalendarPlus, Save, Users, CheckCircle2, UserCheck, UserX } from "lucide-react";

export default function Presenca() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [presentIds, setPresentIds] = useState<Set<number>>(new Set());
  const [meetingId, setMeetingId] = useState<number | null>(null);
  const [step, setStep] = useState<'date' | 'attendance'>('date');

  const { data: studentsList } = trpc.students.list.useQuery();
  const utils = trpc.useUtils();

  // Ordenar alunos em ordem alfabética
  const sortedStudents = useMemo(() => {
    if (!studentsList) return [];
    return [...studentsList].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [studentsList]);

  const createMeetingMutation = trpc.meetings.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        setMeetingId(data.id);
        setStep('attendance');
        toast.success("Encontro criado! Clique nos alunos presentes.");
      }
    },
    onError: (err) => {
      if (err.message.includes('já existe')) {
        toast.error("Já existe um encontro nesta data. Veja no Histórico.");
      } else {
        toast.error("Erro ao criar encontro");
      }
    },
  });

  const saveMutation = trpc.attendance.save.useMutation({
    onSuccess: () => {
      toast.success("Presença registrada com sucesso!");
      utils.dashboard.stats.invalidate();
      utils.meetings.listWithAttendance.invalidate();
      setStep('date');
      setPresentIds(new Set());
      setMeetingId(null);
    },
    onError: () => {
      toast.error("Erro ao salvar presença");
    },
  });

  const toggleStudent = (studentId: number) => {
    setPresentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleCreateMeeting = () => {
    if (!date) {
      toast.error("Selecione uma data");
      return;
    }
    createMeetingMutation.mutate({ date });
  };

  const handleSave = () => {
    if (!meetingId) return;
    saveMutation.mutate({
      meetingId,
      presentStudentIds: Array.from(presentIds),
    });
  };

  const formattedDate = date 
    ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Registrar Presença</h1>
        <p className="text-muted-foreground">Registre a presença de um novo encontro da Mocidade</p>
      </div>

      {step === 'date' && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <CalendarPlus className="h-6 w-6 text-primary" />
              </div>
              Novo Encontro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Data do encontro
              </label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full md:w-72 text-lg h-12"
              />
              {date && (
                <p className="text-sm text-primary font-medium capitalize">
                  {formattedDate}
                </p>
              )}
            </div>
            <Button 
              onClick={handleCreateMeeting} 
              disabled={createMeetingMutation.isPending || !date}
              size="lg"
              className="w-full md:w-auto text-base px-8 h-12 shadow-lg"
            >
              <CalendarPlus className="h-5 w-5 mr-2" />
              {createMeetingMutation.isPending ? "Criando..." : "Iniciar Chamada"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'attendance' && sortedStudents.length > 0 && (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-card/80">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium capitalize">{formattedDate}</p>
                    <p className="text-sm text-muted-foreground">Clique no nome do aluno para marcar presença</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{presentIds.size}</p>
                  <p className="text-xs text-muted-foreground">de {sortedStudents.length} presentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Lista de Chamada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {sortedStudents.map(student => {
                  const isPresent = presentIds.has(student.id);
                  return (
                    <button
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                        isPresent
                          ? "bg-primary/15 border-primary/40 shadow-sm"
                          : "bg-secondary/20 border-border/40 hover:bg-secondary/40"
                      }`}
                    >
                      <span className={`font-medium ${isPresent ? 'text-primary' : ''}`}>
                        {student.name}
                      </span>
                      {isPresent ? (
                        <UserCheck className="h-5 w-5 text-primary" />
                      ) : (
                        <UserX className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => { setStep('date'); setMeetingId(null); setPresentIds(new Set()); }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  size="lg"
                  className="gap-2 px-8 shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Salvando..." : "Salvar Presença"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
