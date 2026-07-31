export interface PriceTier {
  price: number;
  label: string;
  emoji: string;
  count: number;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PRICE_TIERS: PriceTier[] = [
  { price: 8, label: '$8', emoji: '🥒', count: 4, description: '基本小食', color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB' },
  { price: 10, label: '$10', emoji: '🍣', count: 8, description: '經典握壽司', color: '#FFFFFF', bgColor: '#FFFFFF', borderColor: '#E5E7EB' },
  { price: 12, label: '$12', emoji: '🐟', count: 8, description: '人气海鮮', color: '#FFFFFF', bgColor: '#A70819', borderColor: '#A70819' },
  { price: 13, label: '$13', emoji: '🐍', count: 5, description: '高級海鮮', color: '#000000', bgColor: '#FF9E80', borderColor: '#FF9E80' },
  { price: 14, label: '$14', emoji: '🥚', count: 1, description: '魚子醬軍艦', color: '#000000', bgColor: '#F2E8B5', borderColor: '#F2E8B5' },
  { price: 17, label: '$17', emoji: '🦐', count: 3, description: '極品海鮮', color: '#000000', bgColor: '#C0C0C0', borderColor: '#C0C0C0' },
  { price: 18, label: '$18', emoji: '🌯', count: 1, description: '太捲', color: '#000000', bgColor: '#80DEEA', borderColor: '#80DEEA' },
  { price: 22, label: '$22', emoji: '🍱', count: 1, description: '特選組合', color: '#000000', bgColor: '#F2E8B5', borderColor: '#F2E8B5' },
  { price: 27, label: '$27', emoji: '🥩', count: 1, description: 'TORO特選', color: '#FFFFFF', bgColor: '#1E1E1E', borderColor: '#1E1E1E' },
  { price: 28, label: '$28', emoji: '🍣', count: 1, description: '高級握壽司', color: '#000000', bgColor: '#B39DDB', borderColor: '#B39DDB' },
  { price: 33, label: '$33', emoji: '🍣', count: 1, description: '頂級海鮮', color: '#000000', bgColor: '#EF9A9A', borderColor: '#EF9A9A' },
  { price: 38, label: '$38', emoji: '🦪', count: 1, description: '北海道带子', color: '#000000', bgColor: '#F2B5E8', borderColor: '#F2B5E8' },
  { price: 39, label: '$39', emoji: '🍣', count: 1, description: '至尊海鮮', color: '#000000', bgColor: '#C8E6C9', borderColor: '#C8E6C9' },
];

export const getTierByPrice = (price: number): PriceTier | undefined => {
  return PRICE_TIERS.find((tier) => tier.price === price);
};