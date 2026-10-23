"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import AuthInput from "@/components/AuthInput";

export default function SignInPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Already signed in? No reason to see this page, send them home.
  useEffect(() => {
    if (!authLoading && session) router.replace("/");
  }, [authLoading, session, router]);

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/");
  }

  return (
    <div className="px-6 py-12 pb-28 max-w-[430px] mx-auto">
      <div className="font-display font-bold text-xl mb-7">
        pacer<span className="text-accent">.</span>
      </div>
      <h1 className="font-display font-bold text-2xl mb-1.5">Welcome back</h1>
      <p className="text-muted text-[13.5px] mb-6">Sign in to find your next run.</p>

      <form onSubmit={handleSignIn}>
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error && <p className="text-accent-warm text-[12.5px] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5 mt-1.5 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="flex justify-center gap-1 mt-5 text-[13px]">
        <span className="text-muted">New to Pacer?</span>
        <Link href="/sign-up" className="font-semibold text-accent">
          Create an account
        </Link>
      </div>
    </div>
  );
}
