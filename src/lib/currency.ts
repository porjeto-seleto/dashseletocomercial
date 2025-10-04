/**
 * Utilitários para formatação e validação de moeda brasileira (Real)
 */

export const formatCurrencyBR = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseCurrencyBR(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};

export const formatCurrencyInput = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseCurrencyBR(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};

export const parseCurrencyBR = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // Remove qualquer coisa que não seja número, vírgula ou ponto
  let cleanValue = value.toString().replace(/[^\d.,]/g, '');
  
  // Se tem vírgula E ponto, assume formato brasileiro (1.234.567,89)
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    // Remove pontos (separadores de milhar) e substitui vírgula por ponto
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  }
  // Se tem apenas vírgula, substitui por ponto
  else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
    cleanValue = cleanValue.replace(',', '.');
  }
  // Se tem apenas ponto, verifica se é separador decimal ou de milhar
  else if (cleanValue.includes('.') && !cleanValue.includes(',')) {
    const parts = cleanValue.split('.');
    // Se a última parte tem menos de 3 dígitos, é separador decimal
    if (parts[parts.length - 1].length <= 2) {
      // Mantém o último ponto como decimal, remove os outros
      const lastDotIndex = cleanValue.lastIndexOf('.');
      const beforeLastDot = cleanValue.substring(0, lastDotIndex).replace(/\./g, '');
      const afterLastDot = cleanValue.substring(lastDotIndex);
      cleanValue = beforeLastDot + afterLastDot;
    } else {
      // Remove todos os pontos (são separadores de milhar)
      cleanValue = cleanValue.replace(/\./g, '');
    }
  }
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

export const maskCurrencyInput = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para centavos e depois para reais
  const centavos = parseInt(numbers);
  const reais = centavos / 100;
  
  // Formata com separadores brasileiros
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(reais);
};

export const validateCurrencyBR = (value: string): boolean => {
  if (!value) return true; // Permite vazio
  
  // Regex para formato brasileiro: 123.456.789,12 ou 123456,12 ou 123,12
  const brCurrencyRegex = /^(\d{1,3}(\.\d{3})*|\d+)(,\d{1,2})?$/;
  
  return brCurrencyRegex.test(value.replace(/[^\d.,]/g, ''));
};