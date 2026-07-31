export interface SushiItem {
  id: string;
  name: string;
  nameEn: string;
  category: SushiCategory;
  price: number;
  emoji: string;
}

export type SushiCategory = 'nigiri' | 'maki' | 'gunkan' | 'dessert' | 'drink';

export const CATEGORY_LABELS: Record<SushiCategory, string> = {
  nigiri: '握壽司',
  maki: '卷壽司',
  gunkan: '軍艦壽司',
  dessert: '甜品',
  drink: '飲品',
};

export const CATEGORY_EMOJIS: Record<SushiCategory, string> = {
  nigiri: '🍣',
  maki: '🍥',
  gunkan: '🛳️',
  dessert: '🍮',
  drink: '🥤',
};

export const MENU_ITEMS: SushiItem[] = [
  // Nigiri
  { id: 'nigiri-salmon', name: '三文魚', nameEn: 'Salmon Nigiri', category: 'nigiri', price: 10, emoji: '🐟' },
  { id: 'nigiri-tuna', name: '金槍魚', nameEn: 'Tuna Nigiri', category: 'nigiri', price: 12, emoji: '🐠' },
  { id: 'nigiri-ebi', name: '蝦壽司', nameEn: 'Shrimp Nigiri', category: 'nigiri', price: 10, emoji: '🦐' },
  { id: 'nigiri-ika', name: '墨魚', nameEn: 'Squid Nigiri', category: 'nigiri', price: 10, emoji: '🦑' },
  { id: 'nigiri-anago', name: '鰻魚', nameEn: 'Eel Nigiri', category: 'nigiri', price: 13, emoji: '🐍' },
  { id: 'nigiri-eggyolk', name: '魚子醬', nameEn: 'Ikura Nigiri', category: 'nigiri', price: 12, emoji: '🥚' },
  { id: 'nigiri-uni', name: '海膽', nameEn: 'Uni Nigiri', category: 'nigiri', price: 13, emoji: '🌊' },
  { id: 'nigiri-shrimp-ebi', name: '北海道带子', nameEn: 'Hokkaido Scallop', category: 'nigiri', price: 12, emoji: '🦪' },
  { id: 'nigiri-toro', name: 'TORO', nameEn: 'Fatty Tuna Nigiri', category: 'nigiri', price: 13, emoji: '🥩' },
  { id: 'nigiri-mackerel', name: '鯖魚', nameEn: 'Mackerel Nigiri', category: 'nigiri', price: 10, emoji: '🐡' },
  { id: 'nigiri-ginya', name: '銀鱈', nameEn: 'Ginza Nigiri', category: 'nigiri', price: 10, emoji: '🐟' },
  { id: 'nigiri-katsuo', name: '柴魚', nameEn: 'Bonito Nigiri', category: 'nigiri', price: 10, emoji: '🐟' },
  { id: 'nigiri-awabi', name: '鮑魚', nameEn: 'Abalone Nigiri', category: 'nigiri', price: 17, emoji: '🐚' },
  { id: 'nigiri-kohada', name: '鯛魚', nameEn: 'Kohada Nigiri', category: 'nigiri', price: 12, emoji: '🐟' },
  { id: 'nigiri-hokkigai', name: '堅貝', nameEn: 'Hokkigai Nigiri', category: 'nigiri', price: 12, emoji: '🐚' },
  // Maki
  { id: 'maki-kappamaki', name: '海膽卷', nameEn: 'Kappa Maki', category: 'maki', price: 10, emoji: '🥒' },
  { id: 'maki-salmon-maki', name: '三文魚卷', nameEn: 'Salmon Maki', category: 'maki', price: 12, emoji: '🐟' },
  { id: 'maki-tuna-maki', name: '金槍魚卷', nameEn: 'Tuna Maki', category: 'maki', price: 12, emoji: '🐠' },
  { id: 'maki-spicy-tuna', name: '辣味金槍魚卷', nameEn: 'Spicy Tuna Maki', category: 'maki', price: 13, emoji: '🌶️' },
  { id: 'maki-avocado', name: '牛油果卷', nameEn: 'Avocado Maki', category: 'maki', price: 10, emoji: '🥑' },
  { id: 'maki-cucumber', name: '黃瓜卷', nameEn: 'Cucumber Maki', category: 'maki', price: 8, emoji: '🥒' },
  { id: 'maki-shrimp-tempura', name: '天婦羅蝦卷', nameEn: 'Shrimp Tempura Maki', category: 'maki', price: 17, emoji: '🦐' },
  { id: 'maki-futomaki', name: '太捲', nameEn: 'Futomaki', category: 'maki', price: 18, emoji: '🌯' },
  { id: 'maki-chicken', name: '雞肉卷', nameEn: 'Chicken Maki', category: 'maki', price: 12, emoji: '🍗' },
  { id: 'maki-cream-cheese', name: '芝士卷', nameEn: 'Cream Cheese Maki', category: 'maki', price: 10, emoji: '🧀' },
  { id: 'maki-pickle', name: '蘿蔔卷', nameEn: 'Pickle Maki', category: 'maki', price: 8, emoji: '🥬' },
  // Gunkan
  { id: 'gunkan-salmon-roe', name: '三文魚籽', nameEn: 'Salmon Roe Gunkan', category: 'gunkan', price: 12, emoji: '🟠' },
  { id: 'gunkan-tobiko', name: '飛魚籽', nameEn: 'Tobiko Gunkan', category: 'gunkan', price: 12, emoji: '🔴' },
  { id: 'gunkan-spicy-tuna', name: '辣味金槍魚', nameEn: 'Spicy Tuna Gunkan', category: 'gunkan', price: 13, emoji: '🌶️' },
  { id: 'gunkan-una', name: '鰻魚軍艦', nameEn: 'Unagi Gunkan', category: 'gunkan', price: 13, emoji: '🐍' },
  { id: 'gunkan-ikura', name: '魚子醬軍艦', nameEn: 'Ikura Gunkan', category: 'gunkan', price: 14, emoji: '🥚' },
  { id: 'gunkan-quail-egg', name: '鵝蛋軍艦', nameEn: 'Quail Egg Gunkan', category: 'gunkan', price: 12, emoji: '🥚' },
  // Desserts
  { id: 'dessert-mochi', name: '抹茶布丁', nameEn: 'Mochi', category: 'dessert', price: 8, emoji: '🍮' },
  { id: 'dessert-ice', name: '冰淇淋', nameEn: 'Ice Cream', category: 'dessert', price: 8, emoji: '🍦' },
  { id: 'dessert-pudding', name: '焦糖布丁', nameEn: 'Pudding', category: 'dessert', price: 8, emoji: '🍮' },
  { id: 'dessert-black-forest', name: '黑森林', nameEn: 'Black Forest', category: 'dessert', price: 10, emoji: '🍰' },
  { id: 'dessert-cheesecake', name: '芝士蛋糕', nameEn: 'Cheesecake', category: 'dessert', price: 10, emoji: '🍰' },
  // Drinks
  { id: 'drink-orange-juice', name: '柳橙汁', nameEn: 'Orange Juice', category: 'drink', price: 8, emoji: '🍊' },
  { id: 'drink-coke', name: '可口可樂', nameEn: 'Coca-Cola', category: 'drink', price: 6, emoji: '🥤' },
  { id: 'drink-tea', name: '紅茶', nameEn: 'Iced Tea', category: 'drink', price: 6, emoji: '🍵' },
  { id: 'drink-water', name: '矿泉水', nameEn: 'Water', category: 'drink', price: 3, emoji: '💧' },
  { id: 'drink-beer', name: '啤酒', nameEn: 'Beer', category: 'drink', price: 8, emoji: '🍺' },
  { id: 'drink-jasmine', name: '茉莉花茶', nameEn: 'Jasmine Tea', category: 'drink', price: 6, emoji: '🍵' },
  { id: 'drink-yuzu', name: '柚子汁', nameEn: 'Yuzu Juice', category: 'drink', price: 8, emoji: '🍋' },
];