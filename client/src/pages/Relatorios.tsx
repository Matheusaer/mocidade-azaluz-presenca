import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function Relatorios() {
  const { data: report, isLoading } = trpc.reports.studentReport.useQuery();

  const handleDownloadExcel = async () => {
    try {
      const response = await fetch('/api/export-excel', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Erro ao gerar Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Controle_Presenca_Mocidade_Azaluz.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Planilha baixada com sucesso!");
    } catch {
      toast.error("Erro ao baixar planilha. Tente novamente.");
    }
  };

  const sortedReport = report?.slice().sort((a, b) => b.percentage - a.percentage) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Relatórios</h1>
          <p className="text-muted-foreground">Frequência individual de cada jovem da Mocidade</p>
        </div>
        <Button onClick={handleDownloadExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Baixar Excel
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Frequência por Aluno
              {report && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({report[0]?.totalMeetings || 0} encontros realizados)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedReport.map((student, idx) => (
                <div
                  key={student.studentId}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="w-8 text-center">
                    <span className="text-sm font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">{student.studentName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={student.percentage >= 70 ? "default" : student.percentage >= 50 ? "secondary" : "destructive"} className="text-xs">
                          {student.percentage}%
                        </Badge>
                        {student.percentage >= 70 ? (
                          <TrendingUp className="h-3 w-3 text-primary" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </div>
                    <Progress value={student.percentage} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {student.presences} presenças
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {student.absences} faltas
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
