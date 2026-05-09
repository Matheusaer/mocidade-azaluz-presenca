import { Express, Request, Response } from "express";
import ExcelJS from "exceljs";
import * as db from "./db";

export function registerExcelExport(app: Express) {
  app.get("/api/export-excel", async (req: Request, res: Response) => {
    try {
      const students = await db.getAllStudents(true);
      const meetings = await db.getMeetingsWithAttendance();
      const report = await db.getStudentReport();

      const wb = new ExcelJS.Workbook();
      wb.creator = "Mocidade Azaluz - Sistema de Presença";

      // ============ ABA 1: REGISTRO DE PRESENÇA ============
      const ws1 = wb.addWorksheet("Registro de Presença");
      
      // Title
      ws1.mergeCells('A1', `${String.fromCharCode(65 + meetings.length)}1`);
      ws1.getCell('A1').value = "CONTROLE DE PRESENÇA - MOCIDADE AZALUZ | GFE JOÃO RAMALHO";
      ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF00B050' } };
      ws1.getCell('A1').alignment = { horizontal: 'center' };

      // Headers
      const headers = ['Aluno', ...meetings.map(m => {
        const d = new Date(m.date + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      })];
      
      const headerRow = ws1.addRow([]);
      ws1.addRow(headers);
      const headerRowNum = 3;
      
      for (let col = 1; col <= headers.length; col++) {
        const cell = ws1.getRow(headerRowNum).getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      }

      // Data rows
      for (const student of students) {
        const row: (string)[] = [student.name];
        for (const meeting of meetings) {
          const present = meeting.presentStudents.includes(student.name);
          row.push(present ? '✓' : '✗');
        }
        const dataRow = ws1.addRow(row);
        
        for (let col = 2; col <= headers.length; col++) {
          const cell = dataRow.getCell(col);
          cell.alignment = { horizontal: 'center' };
          const isPresent = cell.value === '✓';
          cell.fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: isPresent ? 'FFC6EFCE' : 'FFFFC7CE' }
          };
          cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          };
        }
        dataRow.getCell(1).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      }

      ws1.getColumn(1).width = 25;
      for (let col = 2; col <= headers.length; col++) {
        ws1.getColumn(col).width = 8;
      }

      // ============ ABA 2: RESUMO POR ALUNO ============
      const ws2 = wb.addWorksheet("Resumo por Aluno");
      
      ws2.mergeCells('A1:E1');
      ws2.getCell('A1').value = "RESUMO DE PRESENÇAS POR ALUNO";
      ws2.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF00B050' } };
      ws2.getCell('A1').alignment = { horizontal: 'center' };

      ws2.addRow([]);
      const summaryHeaders = ['Aluno', 'Presenças', 'Faltas', 'Total Encontros', '% Presença'];
      const summaryHeaderRow = ws2.addRow(summaryHeaders);
      
      for (let col = 1; col <= 5; col++) {
        const cell = summaryHeaderRow.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      }

      const sortedReport = report.slice().sort((a, b) => b.percentage - a.percentage);
      for (const r of sortedReport) {
        const row = ws2.addRow([r.studentName, r.presences, r.absences, r.totalMeetings, r.percentage]);
        for (let col = 1; col <= 5; col++) {
          row.getCell(col).alignment = { horizontal: col === 1 ? 'left' : 'center' };
          row.getCell(col).border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          };
        }
      }

      ws2.getColumn(1).width = 25;
      ws2.getColumn(2).width = 12;
      ws2.getColumn(3).width = 10;
      ws2.getColumn(4).width = 16;
      ws2.getColumn(5).width = 14;

      // ============ ABA 3: PRESENÇAS POR MÊS ============
      const ws3 = wb.addWorksheet("Presenças por Mês");
      
      ws3.mergeCells('A1:D1');
      ws3.getCell('A1').value = "PRESENÇAS POR MÊS";
      ws3.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF00B050' } };
      ws3.getCell('A1').alignment = { horizontal: 'center' };

      const monthNames: Record<string, string> = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
      };

      const monthlyData: Record<string, { meetings: number; presences: number }> = {};
      for (const meeting of meetings) {
        const dateStr = typeof meeting.date === 'string' ? meeting.date : new Date(meeting.date).toISOString().split('T')[0];
      const month = dateStr.substring(5, 7);
        const monthName = monthNames[month] || month;
        if (!monthlyData[monthName]) {
          monthlyData[monthName] = { meetings: 0, presences: 0 };
        }
        monthlyData[monthName].meetings++;
        monthlyData[monthName].presences += meeting.presentCount;
      }

      ws3.addRow([]);
      const monthHeaders = ['Mês', 'Encontros', 'Total Presenças', 'Média por Encontro'];
      const monthHeaderRow = ws3.addRow(monthHeaders);
      for (let col = 1; col <= 4; col++) {
        const cell = monthHeaderRow.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      }

      for (const [month, data] of Object.entries(monthlyData)) {
        const avg = Math.round((data.presences / data.meetings) * 10) / 10;
        ws3.addRow([month, data.meetings, data.presences, avg]);
      }

      ws3.getColumn(1).width = 15;
      ws3.getColumn(2).width = 12;
      ws3.getColumn(3).width = 16;
      ws3.getColumn(4).width = 20;

      // ============ ABA 4: DESTAQUES ============
      const ws4 = wb.addWorksheet("Destaques");
      
      ws4.getCell('A1').value = "DESTAQUES E INDICADORES";
      ws4.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF00B050' } };

      ws4.addRow([]);
      ws4.addRow(["ALUNO COM MAIS PRESENÇAS"]);
      ws4.getCell('A3').font = { bold: true, size: 12, color: { argb: 'FF00B050' } };
      
      if (sortedReport.length > 0) {
        ws4.addRow([`${sortedReport[0].studentName} - ${sortedReport[0].presences} presenças (${sortedReport[0].percentage}%)`]);
      }

      ws4.addRow([]);
      ws4.addRow(["ALUNOS COM MAIS FALTAS (Top 5)"]);
      ws4.getCell('A6').font = { bold: true, size: 12, color: { argb: 'FFFF0000' } };
      
      const leastPresent = report.slice().sort((a, b) => a.presences - b.presences).slice(0, 5);
      for (const student of leastPresent) {
        ws4.addRow([`${student.studentName} - ${student.absences} faltas (${100 - student.percentage}%)`]);
      }

      ws4.addRow([]);
      ws4.addRow(["ESTATÍSTICAS GERAIS"]);
      ws4.getCell(`A${ws4.rowCount}`).font = { bold: true, size: 12, color: { argb: 'FF00B050' } };
      ws4.addRow([`Total de encontros realizados: ${meetings.length}`]);
      ws4.addRow([`Total de alunos cadastrados: ${students.length}`]);
      
      const avgAttendance = meetings.length > 0 
        ? Math.round(meetings.reduce((sum, m) => sum + m.presentCount, 0) / meetings.length * 10) / 10 
        : 0;
      ws4.addRow([`Média de presença por encontro: ${avgAttendance} alunos`]);

      ws4.getColumn(1).width = 60;

      // ============ ABA 5: POR ENCONTRO ============
      const ws5 = wb.addWorksheet("Por Encontro");
      
      ws5.mergeCells('A1:C1');
      ws5.getCell('A1').value = "PRESENÇA POR ENCONTRO";
      ws5.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF00B050' } };
      ws5.getCell('A1').alignment = { horizontal: 'center' };

      ws5.addRow([]);
      const encounterHeaders = ['Data', 'Presentes', 'Ausentes'];
      const encounterHeaderRow = ws5.addRow(encounterHeaders);
      for (let col = 1; col <= 3; col++) {
        const cell = encounterHeaderRow.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      }

      for (const meeting of meetings) {
        const d = new Date(meeting.date + 'T12:00:00');
        ws5.addRow([
          d.toLocaleDateString('pt-BR'),
          meeting.presentCount,
          students.length - meeting.presentCount
        ]);
      }

      ws5.getColumn(1).width = 15;
      ws5.getColumn(2).width = 12;
      ws5.getColumn(3).width = 12;

      // ============ DADOS PARA GRÁFICOS ============
      
      // Seção de dados para gráficos na aba "Resumo por Aluno"
      const top10 = sortedReport.slice(0, 10);
      if (top10.length > 0) {
        const chartDataStart = ws2.rowCount + 3;
        ws2.getRow(chartDataStart).getCell(1).value = 'TOP 10 ALUNOS MAIS PRESENTES';
        ws2.getRow(chartDataStart).getCell(1).font = { bold: true, size: 12, color: { argb: 'FF00B050' } };
        const topHeaderRow = ws2.addRow(['Aluno', 'Presenças', '% Frequência']);
        for (let col = 1; col <= 3; col++) {
          topHeaderRow.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
          topHeaderRow.getCell(col).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        }
        for (const s of top10) {
          ws2.addRow([s.studentName, s.presences, s.percentage]);
        }
      }

      // Seção de dados para gráficos na aba "Presenças por Mês"
      const monthEntries = Object.entries(monthlyData);
      if (monthEntries.length > 0) {
        const chartDataStart3 = ws3.rowCount + 3;
        ws3.getRow(chartDataStart3).getCell(1).value = 'DADOS PARA GRÁFICO MENSAL';
        ws3.getRow(chartDataStart3).getCell(1).font = { bold: true, size: 12, color: { argb: 'FF00B050' } };
        const monthChartHeader = ws3.addRow(['Mês', 'Total Presenças', 'Média/Encontro']);
        for (let col = 1; col <= 3; col++) {
          monthChartHeader.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
          monthChartHeader.getCell(col).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        }
        for (const [month, data] of monthEntries) {
          const avg = Math.round((data.presences / data.meetings) * 10) / 10;
          ws3.addRow([month, data.presences, avg]);
        }
      }

      // Seção de evolução por encontro na aba "Por Encontro"
      if (meetings.length > 0) {
        const evolStart = ws5.rowCount + 3;
        ws5.getRow(evolStart).getCell(1).value = 'EVOLUÇÃO DE PRESENÇA POR ENCONTRO';
        ws5.getRow(evolStart).getCell(1).font = { bold: true, size: 12, color: { argb: 'FF00B050' } };
        const evolHeader = ws5.addRow(['Encontro', 'Presentes', '% Presença']);
        for (let col = 1; col <= 3; col++) {
          evolHeader.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
          evolHeader.getCell(col).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        }
        for (let i = 0; i < meetings.length; i++) {
          const m = meetings[i];
          const d = new Date(m.date + 'T12:00:00');
          const pct = students.length > 0 ? Math.round((m.presentCount / students.length) * 100) : 0;
          ws5.addRow([d.toLocaleDateString('pt-BR'), m.presentCount, pct]);
        }
      }

      // Generate buffer and send
      const buffer = await wb.xlsx.writeBuffer();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Controle_Presenca_Mocidade_Azaluz.xlsx');
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error generating Excel:", error);
      res.status(500).json({ error: "Failed to generate Excel file" });
    }
  });
}
