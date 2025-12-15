import { supabase } from "../api/supabaseClient.js";

export async function getLearningPaths() {
  const { data, error } = await supabase
    .from("learning_path")
    .select("*")
    .order("learning_path_name", { ascending: true });

  if (error) {
    console.error("getLearningPaths error:", error);
    return [];
  }
  return data;
}

export async function getQuestionsByLearningPath(lpId) {
  const { data: mapping, error: mapErr } = await supabase
    .from("lp_question")
    .select("question_id")
    .eq("learning_path_id", lpId);

  if (mapErr || !mapping || mapping.length === 0) return [];

  const ids = mapping.map(r => r.question_id);

  const { data: allQuestions, error: qErr } = await supabase
    .from("tech_questions")
    .select("*")
    .in("question_id", ids);

  if (qErr || !allQuestions || allQuestions.length === 0) return [];

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const takeRandom = (arr, count) =>
    shuffle(arr).slice(0, Math.min(arr.length, count));

  const groups = {
    beginner: allQuestions.filter(q => q.difficulty === "beginner"),
    intermediate: allQuestions.filter(q => q.difficulty === "intermediate"),
    advanced: allQuestions.filter(q =>
      q.difficulty === "advanced" || q.difficulty === "advance"
    ),
  };

  const MAX = 20;

  const PROPORTION = {
    beginner: 0.45,
    intermediate: 0.35,
    advanced: 0.20,
  };

  const targetCounts = {
    beginner: Math.round(MAX * PROPORTION.beginner),
    intermediate: Math.round(MAX * PROPORTION.intermediate),
    advanced: Math.round(MAX * PROPORTION.advanced),
  };

  const picked = {
    beginner: takeRandom(groups.beginner, targetCounts.beginner),
    intermediate: takeRandom(groups.intermediate, targetCounts.intermediate),
    advanced: takeRandom(groups.advanced, targetCounts.advanced),
  };

  let finalPicked = [
    ...picked.beginner,
    ...picked.intermediate,
    ...picked.advanced,
  ];

  if (finalPicked.length < MAX) {
    const alreadyPickedIds = new Set(finalPicked.map(q => q.question_id));

    const leftover = shuffle(allQuestions).filter(
      q => !alreadyPickedIds.has(q.question_id)
    );

    const need = MAX - finalPicked.length;
    finalPicked = [...finalPicked, ...leftover.slice(0, need)];
  }

  finalPicked = finalPicked.slice(0, MAX);
  return shuffle(finalPicked);
}

function determineTargetLevel(score) {
  if (score < 40) return 1;            
  if (score >= 40 && score < 70) return 2;  
  if (score >= 70 && score < 90) return 3;  
  if (score >= 90) return 4;           
  return null;
}

export async function generateRecommendations(skillScores, learningPathId) {
  const recommendations = [];

  for (const [skill, score] of Object.entries(skillScores)) {
    const targetLevel = determineTargetLevel(score);
    if (!targetLevel) continue;

    const { data: courses, error } = await supabase
      .from("tb_course")
      .select("*")
      .eq("learning_path_id", learningPathId)
      .eq("course_level_id", targetLevel);

    if (error) {
      console.error("Supabase error:", error);
      continue;
    }

    recommendations.push({
      skill,
      score,
      targetLevel,
      courses: courses || [],
    });
  }

  return recommendations;
}

export async function saveAssessmentResult(userId, learningPathId, skillScores, overallScore) {
  const { data, error } = await supabase
    .from("user_assessment")
    .insert([
      {
        user_id: userId,
        learning_path_id: learningPathId,
        skill_scores: skillScores,
        overall_score: overallScore
      }
    ]);

  if (error) {
    console.error("Failed to save assessment:", error);
    return null;
  }

  return data;
}

