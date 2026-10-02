"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Retorna { loading, session, isAdmin }
export default function useAdmin() {
  const [state, setState] = useState({ loading: true, session: null, isAdmin: false });

  useEffect(() => {
    async function check(session) {
      if (!session) return setState({ loading: false, session: null, isAdmin: false });
      const { data } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setState({ loading: false, session, isAdmin: !!data });
    }
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => check(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}
