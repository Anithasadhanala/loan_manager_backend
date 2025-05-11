export const LoanStatusEnum = [
    'PENDING',
    'VERIFIED',
    'APPROVED',
    'RELEASED',
    'OUTSTANDING',
    'COMPLETED',
    'CANCELLED',
  ] as const;
  
export const PaymentMethodEnum = [
  'UPI',
  'CASH',
  'BANK_TRANSACTION',
] as const;


export type LoanStatus = typeof LoanStatusEnum[number];
export type PaymentMethod = typeof PaymentMethodEnum[number];

