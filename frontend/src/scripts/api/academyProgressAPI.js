import { supabase } from "./supabaseClient.js";

/**
 * Log tutorial selesai
 */
export async function completeTutorial({
  userId,
  learningPathId,
  courseId,
  tutorialId
}) {
  return await supabase
    .from("user_course_activity")
    .insert({
      user_id: userId,
      learning_path_id: learningPathId,
      course_id: courseId,
      tutorial_id: tutorialId,
      activity_type: "tutorial_completed"
    });
}

/**
 * Ambil jumlah tutorial yang sudah diselesaikan
 */
export async function getCompletedTutorialCount(userId, courseId) {
  const { count, error } = await supabase
    .from("user_course_activity")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) {
    console.error("getCompletedTutorialCount error:", error);
    return 0;
  }

  return count || 0;
}

export async function completeAllTutorialsInCourse(
  userId,
  courseId
) {
  const { error } = await supabase.rpc(
    "complete_all_tutorials_in_course",
    {
      p_user_id: userId,
      p_course_id: courseId
    }
  );

  if (error) {
    console.error("completeAllTutorialsInCourse error:", error);
    throw error;
  }
}

export async function isCourseCompleted(userId, courseId) {
  // total tutorial
  const { count: total } = await supabase
    .from("tb_tutorial")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId);

  // tutorial selesai
  const { count: completed } = await supabase
    .from("user_course_activity")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("activity_type", "tutorial_completed");

  return completed === total && total > 0;
}