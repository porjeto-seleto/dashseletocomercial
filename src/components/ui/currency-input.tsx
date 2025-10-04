import * as React from "react";
import { Input } from "@/components/ui/input";
import { maskCurrencyInput, parseCurrencyBR } from "@/lib/currency";
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
        if (value === 0) {
          setDisplayValue('');
        } else {
          setDisplayValue(maskCurrencyInput((value * 100).toString()));
        }
      } else if (typeof value === 'string' && value !== '') {
        const numericValue = parseCurrencyBR(value);
        setDisplayValue(maskCurrencyInput((numericValue * 100).toString()));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Se estiver apagando, permite valor vazio
      if (inputValue === '') {
        setDisplayValue('');
        onChange?.(0);
        return;
      }
      
      // Aplica a máscara
      const maskedValue = maskCurrencyInput(inputValue);
      setDisplayValue(maskedValue);
      
      // Converte para número e chama onChange
      const numericValue = parseCurrencyBR(maskedValue);
      
      // Verifica se permite valores negativos
      if (!allowNegative && numericValue < 0) {
        return;
      }
      
      onChange?.(numericValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Garante que sempre termine com ,00 se não tiver centavos
      if (displayValue && !displayValue.includes(',')) {
        const newValue = displayValue + ',00';
        setDisplayValue(newValue);
        const numericValue = parseCurrencyBR(newValue);
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