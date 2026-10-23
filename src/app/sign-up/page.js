"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import AuthInput from "@/components/AuthInput";

export default function SignUpPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Set once sign-up succeeds but Supabase requires email confirmation
  // before a session exists, the default on a fresh Supabase project.
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && session) router.replace("/");
  }, [authLoading, session, router]);

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Tell us what to call you.");
      return;
    }
    if (!email.trim() || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      return;
    }
    router.replace("/");
  }

  if (checkEmail) {
    return (
      <div className="px-6 py-16 pb-28 max-w-[430px] mx-auto text-center">
        <h1 className="font-display font-bold text-2xl mb-2">Check your email</h1>
        <p className="text-muted text-[13.5px] mb-6">
          We sent a confirmation link to {email.trim()}. Click it, then come back here and sign in.
        </p>
        <Link
          href="/sign-in"
          className="inline-block w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 pb-28 max-w-[430px] mx-auto">
      <div className="font-display font-bold text-xl mb-7">
        pacer<span className="text-accent">.</span>
      </div>
      <h1 className="font-display font-bold text-2xl mb-1.5">Create your account</h1>
      <p className="text-muted text-[13.5px] mb-6">Find someone to run with.</p>

      <form onSubmit={handleSignUp}>
        <AuthInput label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Wanjiru" />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />

        {error && <p className="text-accent-warm text-[12.5px] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5 mt-1.5 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="flex justify-center gap-1 mt-5 text-[13px]">
        <span className="text-muted">Already have an account?</span>
        <Link href="/sign-in" className="font-semibold text-accent">
          Sign in
        </Link>
      </div>
    </div>
  );
}
