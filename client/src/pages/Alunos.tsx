import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { UserPlus, Pencil, Trash2, Users, Check, X } from "lucide-react";
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

export default function Alunos() {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: studentsList, isLoading } = trpc.students.list.useQuery({ activeOnly: false });
  const utils = trpc.useUtils();

  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => {
      toast.success("Aluno cadastrado!");
      setNewName("");
      utils.students.list.invalidate();
    },
    onError: () => toast.error("Erro ao cadastrar aluno"),
  });

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success("Aluno atualizado!");
      setEditingId(null);
      utils.students.list.invalidate();
    },
    onError: () => toast.error("Erro ao atualizar aluno"),
  });

  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => {
      toast.success("Aluno removido!");
      utils.students.list.invalidate();
    },
    onError: () => toast.error("Erro ao remover aluno"),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim() });
  };

  const handleUpdate = (id: number) => {
    if (!editName.trim()) return;
    updateMutation.mutate({ id, name: editName.trim() });
  };

  const startEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const activeStudents = studentsList?.filter(s => s.active) || [];
  const inactiveStudents = studentsList?.filter(s => !s.active) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Gerenciar Alunos</h1>
        <p className="text-muted-foreground">Cadastre, edite ou remova participantes da Mocidade</p>
      </div>

      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastrar Novo Aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              placeholder="Nome completo do aluno..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={createMutation.isPending || !newName.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Alunos Ativos ({activeStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {activeStudents.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  {editingId === student.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter") handleUpdate(student.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button size="icon" variant="ghost" onClick={() => handleUpdate(student.id)}>
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{student.name}</span>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(student.id, student.name)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover aluno?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O aluno "{student.name}" será desativado e não aparecerá mais na lista de presença.
                                Os registros históricos serão mantidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: student.id })}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactiveStudents.length > 0 && (
        <Card className="border-border/50 bg-card/80 opacity-70">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              Alunos Inativos ({inactiveStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveStudents.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <span className="text-muted-foreground">{student.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ id: student.id, active: true })}
                  >
                    Reativar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
