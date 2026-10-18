import { cn } from "@/lib/utils";

export interface Choice<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface ChoiceGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T | "";
  options: readonly Choice<T>[];
  onChange: (value: T) => void;
}


export function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset>
      <legend className="text-label mb-2">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "transition-ui rounded-control flex min-h-11 cursor-pointer flex-col justify-center border px-3 py-2",
              "hover:bg-muted has-checked:border-success has-checked:bg-success-surface",
              "has-focus-visible:outline-ring has-focus-visible:outline-2 has-focus-visible:outline-offset-2",
            )}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="accent-success size-4 shrink-0"
              />
              <span className="text-sm font-medium">{option.label}</span>
            </span>
            {option.description && (
              <span className="money text-caption text-muted-foreground mt-0.5 pl-6">
                {option.description}
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
