import { supabase } from "./supabaseClient.js";

export async function getLearningPaths() {
  return await supabase.from("learning_path").select("*");
}

export async function getCoursesByPath(pathId) {
  return await supabase
    .from("tb_course")
    .select(`
      course_id,
      course_name,
      hours_to_study,
      course_level:course_level_id (course_level)
    `)
    .eq("learning_path_id", pathId)
    .order("course_level_id", { ascending: true });
}


export async function getTutorials(courseId) {
  console.log("QUERY tutorial course_id =", courseId);

  return await supabase
    .from("tb_tutorial")
    .select("*")
    .eq("course_id", courseId);
}

export async function getProgress(email, courseName) {
  return await supabase
    .from("studentProgress")
    .select("*")
    .eq("email", email)
    .eq("course_name", courseName)
    .maybeSingle();
}

export async function updateProgress(progressId, body) {
  return await supabase
    .from("studentProgress")
    .update(body)
    .eq("id", progressId);
}

/* ============================================================
    NEW — createOrGetProgress(email, courseName)
    Membuat progress jika belum ada
   ============================================================ */
export async function createOrGetProgress(email, courseName) {
  const { data: existing, error: checkError } = await supabase
    .from("studentProgress")
    .select("*")
    .eq("email", email)
    .eq("course_name", courseName)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("studentProgress")
    .insert([
      {
        email,
        course_name: courseName,
        active_tutorials: 1,
        completed_tutorials: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("createOrGetProgress error:", error);
    return null;
  }

  return data;
}

/* ============================================================
    NEW — incrementActive(progressId)
    Menambah active_tutorials +1 secara aman
   ============================================================ */
export async function incrementActive(progressId) {
  const { data: progress } = await supabase
    .from("studentProgress")
    .select("*")
    .eq("id", progressId)
    .single();

  const newValue = (progress.active_tutorials || 0) + 1;

  const { data, error } = await supabase
    .from("studentProgress")
    .update({ active_tutorials: newValue })
    .eq("id", progressId)
    .select()
    .single();

  if (error) console.error("incrementActive error:", error);

  return data;
}

/* ============================================================
    NEW — incrementCompleted(progressId)
    Menambah completed_tutorials +1
   ============================================================ */
export async function incrementCompleted(progressId) {
  const { data: progress } = await supabase
    .from("studentProgress")
    .select("*")
    .eq("id", progressId)
    .single();

  const newValue = (progress.completed_tutorials || 0) + 1;

  const { data, error } = await supabase
    .from("studentProgress")
    .update({ completed_tutorials: newValue })
    .eq("id", progressId)
    .select()
    .single();

  if (error) console.error("incrementCompleted error:", error);

  return data;
}

// ---------------------
// FIXED initProgress
// ---------------------
export async function initProgress(email, courseName) {
  return await createOrGetProgress(email, courseName);
}

export async function getCourseById(id) {
  return await supabase
    .from("tb_course")
    .select("*")
    .eq("course_id", id)
    .maybeSingle();
}

// ---------------------
// GET learning path by ID
// ---------------------
export async function getLearningPathById(id) {
  const { data, error } = await supabase
    .from("learning_path")
    .select("learning_path_name")
    .eq("learning_path_id", id)
    .single();

  if (error) {
    console.error("getLearningPathById error:", error);
    return null;
  }

  return data;
}
