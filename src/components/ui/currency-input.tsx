import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput, parseCurrencyBR, maskCurrencyInput } from "@/lib/currency";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  value?: number | string;
  onChange?: (value: number) => void;
  allowNegative?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = '', onChange, allowNegative = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    
    // Atualiza o valor exibido quando o valor prop muda
    React.useEffect(() => {
      if (typeof value === 'number') {
        const formatted = formatCurrencyInput(value);
        if (formatted !== displayValue) {
          setDisplayValue(formatted);
        }
      } else if (typeof value === 'string' && value !== '') {
        const numericValue = parseCurrencyBR(value);
        const formatted = formatCurrencyInput(numericValue);
        if (formatted !== displayValue) {
          setDisplayValue(formatted);
        }
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      if (inputValue === '') {
        setDisplayValue('');
        onChange?.(0);
        return;
      }
      
      // Aplica a máscara que trata os dígitos como centavos
      const maskedValue = maskCurrencyInput(inputValue);
      setDisplayValue(maskedValue);
      
      // Converte para número
      const numericValue = parseCurrencyBR(maskedValue);
      
      if (!allowNegative && numericValue < 0) {
        return;
      }
      
      onChange?.(numericValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue && displayValue !== '0,00') {
        const numericValue = parseCurrencyBR(displayValue);
        const formatted = formatCurrencyInput(numericValue);
        setDisplayValue(formatted);
        onChange?.(numericValue);
      }
      props.onBlur?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(className)}
        placeholder="0,00"
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
