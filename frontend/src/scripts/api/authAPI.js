
import { supabase } from "./supabaseClient.js";

export async function registerUser({ fullname, email, password }) {
  try {
    // 1. Register ke Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin,
            data: {
                full_name: fullname,
            }
        }
    });

    if (error) return { data: null, error };

    const user = data.user;

    // 2. Simpan profil ke tabel public.users
    if (user) {
        await supabase.from("users").insert([
        {
            id: user.id,     // wajib FK ke auth.users
            email: email,
            name: fullname,
        }
        ]);
    }

    return { data: user, error: null };

  } catch (err) {
    return { data: null, error: err };
  }
}

export async function loginUser({ email, password }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };

  } catch (err) {
    return { data: null, error: err };
  }
}

export async function checkEmailExists(email) {
  const { data, error } = await supabase
    .from("users")
    .select("email")
    .eq("email", email)
    .single();

  return { data, error };
}

export async function logoutUsers() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    throw error;
  }

  // Hilangkan data login di localStorage (jika Anda menyimpan)
  localStorage.removeItem("user");

  return true;
}