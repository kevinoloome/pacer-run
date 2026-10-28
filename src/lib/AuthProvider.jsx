"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext({ session: null, loading: true, user: null, isGuest: false });

// Gives a visitor a guest (anonymous) account so they can join, post and chat
// without filling in any form. Returns the existing session if there is one.
// Needs "Allow anonymous sign-ins" turned on in Supabase (Authentication).
let guestPromise = null;
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  if (!guestPromise) {
    const name = `Runner ${100 + Math.floor(Math.random() * 900)}`;
    guestPromise = supabase.auth
      .signInAnonymously({ options: { data: { display_name: name } } })
      .then(({ data: d, error }) => {
        if (error) throw error;
        return d.session;
      })
      .finally(() => {
        guestPromise = null;
      });
  }
  return guestPromise;
}

// Tracks the signed-in Supabase session for the whole app (browser session,
// persisted to localStorage by supabase-js itself, same idea as the native
// app's AuthProvider but backed by the browser instead of AsyncStorage).
// Components read it with useAuth() instead of talking to supabase.auth
// directly, so there's one source of truth for "are we signed in right now".
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
        session,
        loading,
        user: session?.user ?? null,
        isGuest: !!session?.user?.is_anonymous,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
