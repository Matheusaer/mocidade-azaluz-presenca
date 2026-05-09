import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, Users, Trash2, Edit, Save, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function Historico() {
  const { data: meetings, isLoading } = trpc.meetings.listWithAttendance.useQuery();
  const { data: studentsList } = trpc.students.list.useQuery();
  const utils = trpc.useUtils();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPresentIds, setEditPresentIds] = useState<Set<number>>(new Set());

  // Ordenar alunos em ordem alfabética
  const sortedStudents = useMemo(() => {
    if (!studentsList) return [];
    return [...studentsList].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [studentsList]);

  const deleteMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => {
      toast.success("Encontro removido!");
      utils.meetings.listWithAttendance.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: () => toast.error("Erro ao remover encontro"),
  });

  const saveMutation = trpc.attendance.save.useMutation({
    onSuccess: () => {
      toast.success("Presença atualizada!");
      utils.meetings.listWithAttendance.invalidate();
      utils.dashboard.stats.invalidate();
      setEditingId(null);
    },
    onError: () => toast.error("Erro ao salvar presença"),
  });

  const toggleItem = (id: number) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditing = (meetingId: number, presentStudentNames: string[]) => {
    if (!studentsList) return;
    const presentSet = new Set<number>();
    for (const name of presentStudentNames) {
      const student = studentsList.find(s => s.name === name);
      if (student) presentSet.add(student.id);
    }
    setEditPresentIds(presentSet);
    setEditingId(meetingId);
  };

  const toggleEditStudent = (studentId: number) => {
    setEditPresentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleSaveEdit = () => {
    if (editingId === null) return;
    saveMutation.mutate({
      meetingId: editingId,
      presentStudentIds: Array.from(editPresentIds),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Histórico de Encontros</h1>
        <p className="text-muted-foreground">Selecione um encontro para ver ou editar a presença</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : meetings && meetings.length > 0 ? (
        <div className="space-y-3">
          {meetings.map(meeting => (
            <Collapsible
              key={meeting.id}
              open={openItems.has(meeting.id)}
              onOpenChange={() => toggleItem(meeting.id)}
            >
              <Card className="border-border/50 bg-card/80">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/20">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base capitalize">
                            {new Date(meeting.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                            })}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {meeting.presentCount} presentes
                        </Badge>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openItems.has(meeting.id) ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="border-t border-border/50 pt-4">
                      {editingId === meeting.id ? (
                        // Modo edição
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            Clique no nome para marcar/desmarcar presença ({editPresentIds.size} presentes)
                          </p>
                          <div className="space-y-1 max-h-80 overflow-y-auto">
                            {sortedStudents.map(student => {
                              const isPresent = editPresentIds.has(student.id);
                              return (
                                <button
                                  key={student.id}
                                  onClick={() => toggleEditStudent(student.id)}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left text-sm ${
                                    isPresent
                                      ? "bg-primary/15 border-primary/40"
                                      : "bg-secondary/20 border-border/40 hover:bg-secondary/40"
                                  }`}
                                >
                                  <span className={`font-medium ${isPresent ? 'text-primary' : ''}`}>
                                    {student.name}
                                  </span>
                                  {isPresent ? (
                                    <UserCheck className="h-4 w-4 text-primary" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-muted-foreground/40" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex justify-between pt-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                              Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit} disabled={saveMutation.isPending} className="gap-1">
                              <Save className="h-3 w-3" />
                              {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Modo visualização
                        <>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {meeting.presentStudents.sort((a, b) => a.localeCompare(b, 'pt-BR')).map((name, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {name}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex justify-between">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-1"
                              onClick={() => startEditing(meeting.id, meeting.presentStudents)}
                            >
                              <Edit className="h-3 w-3" />
                              Editar Presença
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1">
                                  <Trash2 className="h-3 w-3" />
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir encontro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Todos os registros de presença deste encontro serão removidos permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate({ id: meeting.id })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum encontro registrado ainda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
