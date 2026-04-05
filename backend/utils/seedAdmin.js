const Admin = require('../models/Admin');
const MenuItem = require('../models/MenuItem');

const defaultMenu = [
  // Breakfast
  { name: 'Smashed Avocado Toast', description: 'Sourdough, whipped ricotta, cherry tomatoes, microgreens, chilli flakes, poached egg.', price: 295, category: 'breakfast', isVeg: true, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=75', tags: ['Vegetarian'], isFeatured: false },
  { name: 'The Full English', description: 'Two farm eggs any style, smoked chicken sausage, baked beans, grilled tomato, hash brown, toast.', price: 445, category: 'breakfast', isVeg: false, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=75', tags: ['Bestseller'], isFeatured: true },
  { name: 'Buttermilk Pancake Stack', description: 'Three fluffy pancakes, maple syrup, seasonal berries, whipped cream, candied pecans.', price: 325, category: 'breakfast', isVeg: true, image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=75', tags: ['Vegetarian'] },
  { name: 'Brioche French Toast', description: 'Thick-cut brioche, cinnamon custard dip, caramelised banana, salted caramel drizzle.', price: 275, category: 'breakfast', isVeg: true, image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=75', tags: ['Vegetarian'] },
  { name: 'Eggs Benedict', description: 'Toasted English muffin, pulled chicken, soft-poached egg, house hollandaise, chives.', price: 385, category: 'breakfast', isVeg: false, image: 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=600&q=75', tags: ["Chef's Pick"], isFeatured: true },
  { name: 'Honey Granola Bowl', description: 'House-made granola, Greek yoghurt, fresh mango, chia seeds, passionfruit coulis.', price: 245, category: 'breakfast', isVeg: true, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=75', tags: ['Vegetarian'] },
  // Beverages
  { name: 'South Indian Filter Coffee', description: 'Traditional drip-brewed Coorg blend, served hot in a brass dabarah-tumbler set.', price: 95, category: 'beverages', isVeg: true, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=75', tags: ['Heritage Brew'], isFeatured: true },
  { name: 'Slow Cold Brew', description: '18-hour cold-steeped Ethiopian Yirgacheffe, served over large clear ice, no sugar.', price: 175, category: 'beverages', isVeg: true, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=75', tags: ['Vegan'] },
  { name: 'Ceremonial Matcha Latte', description: 'Ceremonial-grade Japanese matcha whisked with oat milk, lightly sweetened with kokuto.', price: 195, category: 'beverages', isVeg: true, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=75', tags: ['Vegan'], isFeatured: true },
  { name: 'Morning Blush Juice', description: 'Cold-pressed watermelon, mint, lime zest, and a pinch of Himalayan pink salt.', price: 145, category: 'beverages', isVeg: true, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=75', tags: ['Vegan'] },
  { name: 'House Masala Chai', description: 'Strong Assam CTC tea, whole spices, ginger, full cream milk — simmered twenty minutes.', price: 85, category: 'beverages', isVeg: true, image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=600&q=75', tags: ['Vegetarian'] },
  // Specials
  { name: 'Spiced Shakshuka', description: 'Eggs poached in smoky tomato-harissa sauce, feta crumble, za\'atar oil, warm pita.', price: 365, category: 'specials', isVeg: true, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=75', tags: ["Chef's Special"], isFeatured: true },
  { name: 'Açaí Sunrise Bowl', description: 'Blended açaí, frozen banana, topped with granola, dragon fruit, kiwi, edible flowers.', price: 395, category: 'specials', isVeg: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=75', tags: ['Vegan'] },
  { name: 'Weekend Brunch Board', description: 'Sharing platter — smoked salmon, truffle scrambled eggs, roasted tomatoes, artisan breads, jams.', price: 795, category: 'specials', isVeg: false, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=75', tags: ['For Two'], isFeatured: true },
  { name: 'Belgian Waffle & Chicken', description: 'Crispy fried chicken on a fluffy waffle, hot honey, chive butter, bread-and-butter pickles.', price: 475, category: 'specials', isVeg: false, image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=75', tags: ["Chef's Special"] },
];

const seedAdmin = async () => {
  try {
    const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!existing) {
      await Admin.create({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: 'Café Admin' });
      console.log(`👤 Admin seeded: ${process.env.ADMIN_EMAIL}`);
    }
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      await MenuItem.insertMany(defaultMenu);
      console.log(`🍽️  Menu seeded: ${defaultMenu.length} items`);
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = seedAdmin;
