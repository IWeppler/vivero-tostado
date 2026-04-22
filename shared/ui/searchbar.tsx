import { Input } from "@/shared/ui/input";
import { Search } from "lucide-react";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function SearchInput({
  className,
  containerClassName,
  ...props
}: ComponentProps<typeof Input> & { containerClassName?: string }) {
  return (
    <div
      className={cn(
        "relative flex-1 max-w-sm flex items-center",
        containerClassName,
      )}
    >
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        className={cn("pl-9 bg-card h-10", className)}
        {...props}
      />
    </div>
  );
}
