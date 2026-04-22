import { LoginForm } from "@/features/auth/ui/login-form";
import Image from "next/image";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden">
      {/* 1. Imagen de Fondo Rotada */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/cabj.jpg"
          alt="Fondo de la tienda"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* 2. Overlay Opaco */}
      <div className="absolute inset-0 bg-black/70 -z-10" />

      {/* 3. Contenedor del Formulario */}
      <div className="w-full max-w-md bg-white border border-neutral-100 p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 overflow-hidden rounded-none bg-black">
            <Image
              src="/ninja-logo.jpg"
              alt="Logo"
              width={128}
              height={128}
              className="object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Panel de Control
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Ingresa tus credenciales para administrar la tienda
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
