// /pages/assessment/quiz-utils.js

/** Mengacak urutan array */
export function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mengambil n elemen acak */
export function sample(arr, n) {
  if (!arr || arr.length === 0) return [];
  const shuffled = shuffleArray(arr);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Mencari key jawaban benar A/B/C/D berdasarkan teks correct_answer dari DB
 */
export function determineCorrectKey(q) {
  // Jika DB menyimpan A/B/C/D langsung
  if (["A", "B", "C", "D"].includes(q.correct_answer)) {
    return q.correct_answer;
  }

  // Jika DB menyimpan Teks jawaban benar
  if (q.option_1 === q.correct_answer) return "A";
  if (q.option_2 === q.correct_answer) return "B";
  if (q.option_3 === q.correct_answer) return "C";
  if (q.option_4 === q.correct_answer) return "D";

  return null;
}

/**
 * Hitung total jawaban benar
 */
export function calculateScore(questions, answers) {
  let correct = 0;

  questions.forEach((q) => {
    const correctKey = determineCorrectKey(q);
    const userAnswer = answers[q.question_id];

    if (userAnswer && correctKey && userAnswer === correctKey) {
      correct++;
    }
  });

  return correct;
}


export function calculateSkillScore(questions, answers) {
  const totalPerSkill = {};
  const benarPerSkill = {};

  let totalBenar = 0;
  let totalSoal = questions.length;

  for (const q of questions) {
    const skill = q.skill_tag || "Unknown";
    const user = answers[q.question_id] || null;

    // total soal per skill
    totalPerSkill[skill] = (totalPerSkill[skill] || 0) + 1;

    // tentukan kunci benar
    const correctKey = determineCorrectKey(q);

    // jika user jawab benar
    if (user && user === correctKey) {
      benarPerSkill[skill] = (benarPerSkill[skill] || 0) + 1;
      totalBenar++;
    }
  }

  // Hitung skor per skill
  const skillScores = {};
  for (const skill in totalPerSkill) {
    const benar = benarPerSkill[skill] || 0;
    const total = totalPerSkill[skill];
    skillScores[skill] = Math.round((benar / total) * 1000) / 10; // 1 decimal
  }

  // Hitung skor keseluruhan
  const overall = Math.round((totalBenar / totalSoal) * 1000) / 10;

  return {
    overall_score: overall,
    skill_scores: skillScores
  };
}