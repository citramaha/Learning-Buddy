import { supabase } from "./supabaseClient.js";

/**
 * Ambil course terakhir yang sedang dipelajari user
 */
export async function getLastActiveCourse(userId) {
  // ambil activity terakhir
  const { data: activity, error } = await supabase
    .from("user_course_activity")
    .select("course_id, learning_path_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !activity) return null;

  // ambil detail course
  const { data: course } = await supabase
    .from("tb_course")
    .select("*")
    .eq("course_id", activity.course_id)
    .single();

  return course;
}

export async function getCourseProgress(userId, courseId) {
  const { data: tutorials } = await supabase
    .from("tb_tutorial")
    .select("tutorial_id")
    .eq("course_id", courseId);

  const { data: completed } = await supabase
    .from("user_course_activity")
    .select("tutorial_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("activity_type", "tutorial_completed");

  const total = tutorials?.length || 0;
  const done = completed?.length || 0;

  return {
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}
