"use client";

import { useState } from "react";
import AuthInput from "@/components/AuthInput";
import { supabase } from "@/lib/supabaseClient";

// Turns a guest account into a normal one (email + password) so the runs
// and chats can be reached again from another phone or after clearing the browser.
export default function SaveAccountForm({ title = "Save your account", intro, onSaved }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!email.trim() || password.length < 6) {
      setErr("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.updateUser({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const done = data.user?.email === email.trim().toLowerCase();
    setMsg(
      done
        ? "Saved. You can now sign in from any phone."
        : "Check your email to confirm, then your account is saved."
    );
    if (done) {
      await supabase.auth.refreshSession();
      onSaved?.();
    }
  }

  return (
    <form
      onSubmit={save}
      className="mb-7 rounded-2xl border border-accent/30 bg-accent/5 p-4"
    >
      <div className="font-display font-bold text-[15px] mb-1">{title}</div>
      <p className="text-muted text-[12.5px] mb-3.5">
        {intro ||
          "You're on a guest account. Add an email and password to keep your runs if you switch phones or clear your browser."}
      </p>
      <AuthInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <AuthInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
      {err && <p className="text-accent-warm text-[12.5px] mb-2">{err}</p>}
      {msg && <p className="text-accent text-[12.5px] mb-2">{msg}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full bg-accent text-bg font-display font-bold text-[14px] rounded-xl py-3 disabled:opacity-60"
      >
        {busy ? "Saving..." : "Save account"}
      </button>
    </form>
  );
}
