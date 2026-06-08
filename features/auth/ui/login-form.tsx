"use client";

import { useActionState, useEffect } from "react";
import { loginAction } from "../actions/login";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/dist/client/components/navigation";

const initialState = { error: "", success: false };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/");
      router.refresh();
    }
  }, [state?.success, router]);

  const isLoading = isPending || state?.success;

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

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 md:h-10"
      >
        {isLoading ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
