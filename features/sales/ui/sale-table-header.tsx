import { ReactNode } from "react";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Search } from "lucide-react";

export interface SaleTableHeaderOption {
  value: string;
  label: string;
}

interface SaleTableHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  orderValue: string;
  onOrderChange: (value: string) => void;
  orderOptions: SaleTableHeaderOption[];
  actions?: ReactNode;
}

export function SaleTableHeader({
  searchValue,
  onSearchChange,
  orderValue,
  onOrderChange,
  orderOptions,
  actions,
}: Readonly<SaleTableHeaderProps>) {
  return (
    <div className="flex flex-row gap-2 sm:gap-4 justify-between items-center bg-card p-2 sm:p-4 rounded-xl border border-border">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por producto o #recibo..."
          className="pl-9 h-10 text-sm rounded-lg border-border/60 bg-muted focus-visible:bg-background shadow-none transition-colors w-full"
          value={searchValue}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
        />
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
        <Select value={orderValue} onValueChange={onOrderChange}>
          <SelectTrigger className="h-10 w-full sm:w-40 border-border/60 bg-white shadow-none font-medium">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {orderOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {actions && (
          <div className="flex flex-1 sm:flex-none justify-end gap-2 sm:ml-2 sm:pl-4 sm:border-l sm:border-border">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
