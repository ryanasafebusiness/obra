// IDs criados diretamente na conta Stripe ligada ("evolink"), em EUR.
// Não são segredos — podem ficar no código.
export const STRIPE_PRICES = {
  pro: 'price_1TyxF8H7t2oko0FsBdtKQpbp',
} as const

export type PaidPlano = keyof typeof STRIPE_PRICES
