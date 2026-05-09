import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calendar, Users, Trash2 } from "lucide-react";
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
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Historico() {
  const { data: meetings, isLoading } = trpc.meetings.listWithAttendance.useQuery();
  const utils = trpc.useUtils();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const deleteMutation = trpc.meetings.delete.useMutation({
    onSuccess: () => {
      toast.success("Encontro removido!");
      utils.meetings.listWithAttendance.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: () => toast.error("Erro ao remover encontro"),
  });

  const toggleItem = (id: number) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Histórico de Encontros</h1>
        <p className="text-muted-foreground">Todos os encontros realizados e seus registros de presença</p>
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
                          <CardTitle className="text-base">
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
                      <div className="flex flex-wrap gap-2 mb-4">
                        {meeting.presentStudents.map((name, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1">
                              <Trash2 className="h-3 w-3" />
                              Excluir encontro
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
