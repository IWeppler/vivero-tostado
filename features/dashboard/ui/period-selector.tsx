"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

interface PeriodSelectorProps {
  defaultPeriod?: string;
}

export function PeriodSelector({
  defaultPeriod = "mes",
}: Readonly<PeriodSelectorProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", value);

    router.push(`/?${params.toString()}`);
  };

  return (
    <Select value={defaultPeriod} onValueChange={handlePeriodChange}>
      <SelectTrigger className="w-[180px] bg-white border-gray-200 cursor-pointer">
        <SelectValue placeholder="Seleccionar período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="mes">Este mes</SelectItem>
        <SelectItem value="trimestre">Últimos 3 meses</SelectItem>
        <SelectItem value="semestre">Últimos 6 meses</SelectItem>
        <SelectItem value="anio">Último año</SelectItem>
        <SelectItem value="historico">Histórico total</SelectItem>
      </SelectContent>
    </Select>
  );
}
