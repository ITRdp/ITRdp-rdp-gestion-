"use client";

import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type AuthState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initial,
  );

  return (
    <form action={action} className="grid gap-4">
      <div className="field">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required autoComplete="username" />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
