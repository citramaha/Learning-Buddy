// progressAPI.js
import { supabase } from "../api/supabaseClient.js";

/**
 * Ambil assessment terbaru user
 */
export async function getLatestAssessment(userId) {
  const { data, error } = await supabase
    .from("user_assessment")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getLatestAssessment error:", error);
    return null;
  }

  return data?.[0] || null;
}

export async function getAssessmentByPath(userId, learningPathId) {
  const { data, error } = await supabase
    .from("user_assessment")
    .select("*")
    .eq("user_id", userId)
    .eq("learning_path_id", learningPathId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getAssessmentByPath error:", error);
    return null;
  }

  return data;
}


/**
 * Ambil semua riwayat assessment user
 */
export async function getAssessmentHistory(userId) {
  const { data, error } = await supabase
    .from("user_assessment")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAssessmentHistory error:", error);
    return [];
  }

  return data || [];
}

/**
 * Hitung peningkatan skill antar dua assessment
 */
export function compareAssessment(prevResult, currentResult) {
  const improvement = {};

  const prevSkills = prevResult.skill_scores;
  const currSkills = currentResult.skill_scores;

  for (const skill in currSkills) {
    const before = prevSkills?.[skill] ?? 0;
    const now = currSkills[skill];

    improvement[skill] = {
      before,
      now,
      diff: now - before,
    };
  }

  return improvement;
}

/**
 * Deteksi skill yang lemah
 */
export function findWeakSkills(skillScores, threshold = 60) {
  return Object.keys(skillScores).filter(
    (skill) => skillScores[skill] < threshold
  );
}

/**
 * Deteksi skill yang mengalami peningkatan paling besar
 */
export function findTopImprovedSkill(improvementData) {
  let topSkill = null;
  let maxValue = -999;

  for (const [skill, data] of Object.entries(improvementData)) {
    if (data.diff > maxValue) {
      maxValue = data.diff;
      topSkill = skill;
    }
  }

  return {
    skill: topSkill,
    diff: maxValue,
  };
}

export async function getUserProgressOverview(userId) {
  const { data, error } = await supabase
    .from("user_skill_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}


