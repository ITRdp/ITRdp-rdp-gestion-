"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";

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
        <label htmlFor="email">Correo</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="tu@despacho.es"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Accediendo…" : "Entrar"}
      </button>

      <p className="hint text-center">
        No hay registro público. Solo miembros habilitados por un administrador.
      </p>
    </form>
  );
}
