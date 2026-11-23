"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthState = {};

export function LoginForm({ disabledHint }: { disabledHint?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {(disabledHint || state.error) && (
        <div className="alert" role="alert">
          {state.error ??
            "Tu cuenta no está habilitada. Contacta con un administrador del despacho."}
        </div>
      )}

      <div className="field">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="tu@despacho.co"
        />
      </div>

      <div className="field">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Accediendo…" : "Entrar"}
      </Button>

      <p className="hint text-center">
        No hay registro público. Solo miembros habilitados por un administrador.
      </p>
    </form>
  );
}
