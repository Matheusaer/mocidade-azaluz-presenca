import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { CalendarPlus, Save, Users, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Presenca() {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");
  const [presentIds, setPresentIds] = useState<Set<number>>(new Set());
  const [newDate, setNewDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: meetingsList } = trpc.meetings.list.useQuery();
  const { data: studentsList } = trpc.students.list.useQuery();
  const { data: attendanceData } = trpc.attendance.getByMeeting.useQuery(
    { meetingId: Number(selectedMeetingId) },
    { enabled: !!selectedMeetingId }
  );

  const utils = trpc.useUtils();

  const saveMutation = trpc.attendance.save.useMutation({
    onSuccess: () => {
      toast.success("Presença salva com sucesso!");
      utils.attendance.getByMeeting.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: () => {
      toast.error("Erro ao salvar presença");
    },
  });

  const createMeetingMutation = trpc.meetings.create.useMutation({
    onSuccess: (data) => {
      toast.success("Encontro criado!");
      utils.meetings.list.invalidate();
      setDialogOpen(false);
      if (data) {
        setSelectedMeetingId(String(data.id));
      }
    },
    onError: () => {
      toast.error("Erro ao criar encontro");
    },
  });

  // When attendance data loads, populate the checkboxes
  useMemo(() => {
    if (attendanceData) {
      const ids = new Set(attendanceData.filter(a => a.present).map(a => a.studentId));
      setPresentIds(ids);
    } else {
      setPresentIds(new Set());
    }
  }, [attendanceData]);

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

  const selectAll = () => {
    if (studentsList) {
      setPresentIds(new Set(studentsList.map(s => s.id)));
    }
  };

  const deselectAll = () => {
    setPresentIds(new Set());
  };

  const handleSave = () => {
    if (!selectedMeetingId) {
      toast.error("Selecione um encontro primeiro");
      return;
    }
    saveMutation.mutate({
      meetingId: Number(selectedMeetingId),
      presentStudentIds: Array.from(presentIds),
    });
  };

  const handleCreateMeeting = () => {
    if (!newDate) {
      toast.error("Selecione uma data");
      return;
    }
    createMeetingMutation.mutate({ date: newDate });
  };

  const selectedMeeting = meetingsList?.find(m => String(m.id) === selectedMeetingId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Registrar Presença</h1>
          <p className="text-muted-foreground">Marque os alunos presentes no encontro</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Encontro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Encontro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleCreateMeeting} className="w-full" disabled={createMeetingMutation.isPending}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Criar Encontro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Selecionar Encontro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMeetingId} onValueChange={setSelectedMeetingId}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Escolha a data do encontro..." />
            </SelectTrigger>
            <SelectContent>
              {meetingsList?.map(meeting => (
                <SelectItem key={meeting.id} value={String(meeting.id)}>
                  {new Date(meeting.date + 'T12:00:00').toLocaleDateString('pt-BR', { 
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' 
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMeetingId && studentsList && (
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Lista de Alunos
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({presentIds.size}/{studentsList.length} presentes)
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Nenhum
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {studentsList.map(student => (
                <label
                  key={student.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    presentIds.has(student.id)
                      ? "bg-primary/10 border-primary/40"
                      : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
                  }`}
                >
                  <Checkbox
                    checked={presentIds.has(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <span className="text-sm font-medium">{student.name}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="gap-2"
                size="lg"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Salvando..." : "Salvar Presença"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
