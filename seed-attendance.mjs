// Seed attendance records based on historical data
// Meeting IDs: 1=03-26, 2=03-27, 3=03-28, 4=04-04, 5=04-11, 6=04-18, 7=04-25, 8=05-02, 9=05-09
// Student IDs: 1=Agatha, 2=Ana Carolina, 3=Ana Gabi, 4=Bernardo Cassim, 5=Camila de Oliveira,
// 6=Camilly, 7=Carlos, 8=Débora Araújo, 9=Emerson Dias, 10=Enzo Oliveira Guarizo,
// 11=Gustavo, 12=Henrique, 13=Isa, 14=Julia Roque, 15=Kauani,
// 16=Kauã, 17=Laura, 18=Leticia Gomes, 19=Lia, 20=Luan,
// 21=Luigi, 22=Manu Cassim, 23=Marina, 24=Matteo, 25=Miguel,
// 26=Pietra, 27=Rayanne Fonseca, 28=Renan, 29=Sofia Francesco, 30=Sofia Guimarães,
// 31=Vitor Borges

const attendanceData = {
  1: [1],  // 2026-03-26: Agatha
  2: [2, 3, 9, 14, 18, 24, 25, 27, 29],  // 2026-03-27
  3: [1, 2, 3, 4, 5, 6, 7],  // 2026-03-28
  4: [9, 10, 11, 13, 15, 16, 20, 27, 29],  // 2026-04-04
  5: [1, 2, 5, 7, 10, 11, 15, 19, 21, 25, 26, 28, 30],  // 2026-04-11
  6: [2, 7, 9, 10, 11, 15, 16, 19, 20, 21, 22, 23, 26, 28, 29, 30, 31],  // 2026-04-18
  7: [1, 2, 5, 7, 9, 10, 15, 17, 19, 21, 25, 27, 28, 29, 30],  // 2026-04-25
  8: [1, 2, 5, 7, 11, 12, 15, 16, 27, 28, 29, 30, 31],  // 2026-05-02
  9: [2, 5, 7, 8, 9, 10, 15, 19, 20, 21, 22, 25, 26, 27, 29],  // 2026-05-09
};

// Generate SQL
const values = [];
for (const [meetingId, studentIds] of Object.entries(attendanceData)) {
  for (const studentId of studentIds) {
    values.push(`(${meetingId}, ${studentId}, true)`);
  }
}

const sql = `INSERT INTO attendance (meetingId, studentId, present) VALUES\n${values.join(',\n')};`;
console.log(sql);
