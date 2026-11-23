"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

export function ResetPasswordForm({
  submitLabel = "Guardar contraseña",
}: {
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState(updatePasswordAction, initial);

  return (
    <form action={action} className="grid gap-4">
      <div className="field">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="field">
        <Label htmlFor="confirm">Confirmar</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
