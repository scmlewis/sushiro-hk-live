export interface PriceTier {
  price: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PRICE_TIERS: PriceTier[] = [
  { price: 8, color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB' },
  { price: 10, color: '#FFFFFF', bgColor: '#FFFFFF', borderColor: '#E5E7EB' },
  { price: 12, color: '#FFFFFF', bgColor: '#A70819', borderColor: '#A70819' },
  { price: 13, color: '#000000', bgColor: '#FF9E80', borderColor: '#FF9E80' },
  { price: 14, color: '#000000', bgColor: '#F2E8B5', borderColor: '#F2E8B5' },
  { price: 17, color: '#000000', bgColor: '#C0C0C0', borderColor: '#C0C0C0' },
  { price: 18, color: '#000000', bgColor: '#80DEEA', borderColor: '#80DEEA' },
  { price: 22, color: '#000000', bgColor: '#F2E8B5', borderColor: '#F2E8B5' },
  { price: 27, color: '#FFFFFF', bgColor: '#1E1E1E', borderColor: '#1E1E1E' },
  { price: 28, color: '#000000', bgColor: '#B39DDB', borderColor: '#B39DDB' },
  { price: 33, color: '#000000', bgColor: '#EF9A9A', borderColor: '#EF9A9A' },
  { price: 38, color: '#000000', bgColor: '#F2B5E8', borderColor: '#F2B5E8' },
  { price: 39, color: '#000000', bgColor: '#C8E6C9', borderColor: '#C8E6C9' },
];

export const getTierByPrice = (price: number): PriceTier | undefined => {
  return PRICE_TIERS.find((tier) => tier.price === price);
};