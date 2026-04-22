"use client";

import { useActionState } from "react";
import { loginAction } from "../actions/login";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";

const initialState = { error: "" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
          />
        </div>
      </div>

      {state?.error && (
        <div className="p-3 text-sm text-destructive font-medium bg-destructive/10 rounded-md border border-destructive/20">
          {state.error}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
