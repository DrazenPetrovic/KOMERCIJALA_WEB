export const formatCurrency = (value: number): string =>
  `${value.toLocaleString("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} KM`;
