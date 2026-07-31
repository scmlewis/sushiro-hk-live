export interface PriceTier {
  price: number;
  label: string;
  emoji: string;
  count: number;
  description: string;
}

export const PRICE_TIERS: PriceTier[] = [
  { price: 8, label: '$8', emoji: '🥒', count: 4, description: '基本小食' },
  { price: 10, label: '$10', emoji: '🍣', count: 8, description: '經典握壽司' },
  { price: 12, label: '$12', emoji: '🐟', count: 8, description: '人气海鮮' },
  { price: 13, label: '$13', emoji: '🐍', count: 5, description: '高級海鮮' },
  { price: 14, label: '$14', emoji: '🥚', count: 1, description: '魚子醬軍艦' },
  { price: 17, label: '$17', emoji: '🦐', count: 3, description: '極品海鮮' },
  { price: 18, label: '$18', emoji: '🌯', count: 1, description: '太捲' },
  { price: 22, label: '$22', emoji: '🍱', count: 1, description: '特選組合' },
  { price: 27, label: '$27', emoji: '🥩', count: 1, description: 'TORO特選' },
  { price: 28, label: '$28', emoji: '🍣', count: 1, description: '高級握壽司' },
  { price: 33, label: '$33', emoji: '🍣', count: 1, description: '頂級海鮮' },
  { price: 38, label: '$38', emoji: '🦪', count: 1, description: '北海道带子' },
  { price: 39, label: '$39', emoji: '🍣', count: 1, description: '至尊海鮮' },
];

export const getTierByPrice = (price: number): PriceTier | undefined => {
  return PRICE_TIERS.find((tier) => tier.price === price);
};