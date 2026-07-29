import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, ChevronDown } from "lucide-react";

interface SearchableSelectProps {
  name?: string;
  items: { id: string | number; nombre: string }[];
  value: string;
  onChange: (val: string) => void;
  onAdd: (nombre: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export function SearchableSelect({
  name,
  items,
  value,
  onChange,
  onAdd,
  placeholder,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const selected = items.find((item) => String(item.id) === String(value));
      if (selected) {
        setQuery(selected.nombre);
      }
    } else {
      setQuery("");
    }
  }, [value, items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        const selected = items.find((item) => String(item.id) === String(value));
        setQuery(selected ? selected.nombre : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, items]);

  const filteredItems = items.filter((item) =>
    item.nombre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <div className="relative flex items-center">
        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all outline-none",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange("");
            setOpen(true);
          }}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
              setQuery("");
            }
          }}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              setQuery("");
            }
          }}
        />
        <ChevronDown 
          size={14} 
          className="absolute right-3 text-muted-foreground pointer-events-none opacity-50" 
        />
      </div>
      
      {open && (
        <div className="absolute z-[999] w-full mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-background dark:bg-zinc-900 text-foreground shadow-xl outline-none animate-in fade-in-0 zoom-in-95">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(String(item.id));
                  setQuery(item.nombre);
                  setOpen(false);
                }}
              >
                {item.nombre}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-center text-muted-foreground flex flex-col items-center gap-3">
              <span>No se encontraron resultados</span>
              {query.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onAdd(query.trim());
                    setOpen(false);
                  }}
                  className="px-3 py-2 w-full bg-primary text-primary-foreground rounded-md text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={14} />
                  Agregar "{query.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
