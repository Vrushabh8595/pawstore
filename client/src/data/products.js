// Dummy dog-food catalog. Replace with API data (GET /products) later.
// Images use Unsplash source URLs (royalty-free) as placeholders.

export const categories = [
  { slug: 'dry-food', name: 'Dry Food' },
  { slug: 'wet-food', name: 'Wet Food' },
  { slug: 'treats', name: 'Treats' },
  { slug: 'puppy', name: 'Puppy' },
  { slug: 'supplements', name: 'Supplements' },
]

export const filterOptions = {
  lifeStage: ['puppy', 'adult', 'senior'],
  breedSize: ['small', 'medium', 'large'],
  foodType: ['dry', 'wet', 'treats'],
  diet: ['grain-free', 'veg', 'chicken', 'lamb'],
}

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`

export const products = [
  {
    id: 'p1', slug: 'chicken-adult-dry', name: 'Daily Chicken Adult Dry Food',
    category: 'dry-food', brand: 'PawNutri', rating: 4.7, reviews: 214,
    lifeStage: 'adult', breedSize: 'medium', foodType: 'dry', diet: ['chicken'],
    images: [img('photo-1589924691995-400dc9ecc119'), img('photo-1601758228041-f3b2795255f1')],
    short: 'Protein-rich chicken kibble for everyday adult nutrition.',
    description: 'A complete and balanced recipe made with real deboned chicken as the first ingredient. Supports lean muscle, healthy digestion and a shiny coat. No artificial colours or flavours.',
    ingredients: 'Deboned chicken, brown rice, oats, chicken fat, flaxseed, dried beet pulp, vitamins & minerals.',
    feeding: 'Small dog (5–10kg): 90–140g/day. Medium (10–25kg): 140–300g/day. Large (25kg+): 300–450g/day. Split into two meals.',
    nutrition: { protein: '26%', fat: '14%', fibre: '4%', moisture: '10%' },
    variants: [
      { sku: 'CAD-1', size: '1kg', flavour: 'Chicken', price: 549, mrp: 699, stock: 40 },
      { sku: 'CAD-3', size: '3kg', flavour: 'Chicken', price: 1399, mrp: 1799, stock: 25 },
      { sku: 'CAD-10', size: '10kg', flavour: 'Chicken', price: 3999, mrp: 4999, stock: 12 },
    ],
    tags: ['bestseller'],
  },
  {
    id: 'p2', slug: 'lamb-grainfree-adult', name: 'Grain-Free Lamb & Sweet Potato',
    category: 'dry-food', brand: 'WildRoots', rating: 4.8, reviews: 167,
    lifeStage: 'adult', breedSize: 'large', foodType: 'dry', diet: ['grain-free', 'lamb'],
    images: [img('photo-1568640347023-a616a30bc3bd'), img('photo-1591768575198-88dac53fbd0a')],
    short: 'Grain-free lamb recipe for sensitive tummies.',
    description: 'A limited-ingredient, grain-free formula with pasture-raised lamb and sweet potato. Ideal for dogs with grain sensitivities. Rich in omega fatty acids for skin and coat.',
    ingredients: 'Lamb meal, sweet potato, peas, chickpeas, lamb fat, salmon oil, blueberries, vitamins & minerals.',
    feeding: 'Feed 1.5–3% of body weight per day, split across two meals. Adjust for activity level.',
    nutrition: { protein: '28%', fat: '15%', fibre: '4.5%', moisture: '10%' },
    variants: [
      { sku: 'LGF-2', size: '2kg', flavour: 'Lamb', price: 1199, mrp: 1499, stock: 30 },
      { sku: 'LGF-6', size: '6kg', flavour: 'Lamb', price: 2999, mrp: 3799, stock: 15 },
    ],
    tags: ['grain-free'],
  },
  {
    id: 'p3', slug: 'puppy-starter-chicken', name: 'Puppy Starter Chicken & Milk',
    category: 'puppy', brand: 'PawNutri', rating: 4.9, reviews: 320,
    lifeStage: 'puppy', breedSize: 'small', foodType: 'dry', diet: ['chicken'],
    images: [img('photo-1543466835-00a7907e9de1'), img('photo-1583337130417-3346a1be7dee')],
    short: 'Soft, soakable kibble for weaning puppies.',
    description: 'Specially formulated for puppies 3–12 months with DHA for brain development, calcium for strong bones, and small, soakable kibble that is easy to chew.',
    ingredients: 'Chicken, milk powder, rice, egg, fish oil (DHA), calcium, probiotics, vitamins & minerals.',
    feeding: 'Soak in warm water for young puppies. Feed 3–4 small meals a day based on weight chart on pack.',
    nutrition: { protein: '30%', fat: '18%', fibre: '3%', moisture: '10%' },
    variants: [
      { sku: 'PST-1', size: '1kg', flavour: 'Chicken', price: 649, mrp: 799, stock: 50 },
      { sku: 'PST-3', size: '3kg', flavour: 'Chicken', price: 1699, mrp: 2099, stock: 22 },
    ],
    tags: ['bestseller', 'puppy'],
  },
  {
    id: 'p4', slug: 'chicken-stew-wet', name: 'Chicken Stew Wet Food (Pack of 6)',
    category: 'wet-food', brand: 'GravyBowl', rating: 4.6, reviews: 98,
    lifeStage: 'adult', breedSize: 'medium', foodType: 'wet', diet: ['chicken'],
    images: [img('photo-1585846416120-3a7df1a0d5a3'), img('photo-1596492784531-6e6eb5ea9993')],
    short: 'Tender chicken chunks in gravy, 6 x 100g pouches.',
    description: 'Succulent chunks of real chicken slow-cooked in a savoury gravy. A complete wet meal or a tasty topper for dry food. No added preservatives.',
    ingredients: 'Chicken (60%), chicken broth, carrots, peas, sunflower oil, vitamins & minerals.',
    feeding: 'One 100g pouch per 3kg body weight per day. Refrigerate after opening.',
    nutrition: { protein: '10%', fat: '6%', fibre: '1%', moisture: '80%' },
    variants: [
      { sku: 'CSW-6', size: '6 x 100g', flavour: 'Chicken', price: 499, mrp: 629, stock: 60 },
      { sku: 'CSW-12', size: '12 x 100g', flavour: 'Chicken', price: 949, mrp: 1199, stock: 35 },
    ],
    tags: ['new'],
  },
  {
    id: 'p5', slug: 'veg-dental-treats', name: 'Veg Dental Sticks',
    category: 'treats', brand: 'ChewWell', rating: 4.5, reviews: 141,
    lifeStage: 'adult', breedSize: 'small', foodType: 'treats', diet: ['veg', 'grain-free'],
    images: [img('photo-1518717758536-85ae29035b6d'), img('photo-1576201836106-db1758fd1c97')],
    short: 'Plant-based dental chews that freshen breath.',
    description: 'Vegetarian dental sticks with a ridged texture that helps reduce tartar and freshen breath. Made with natural mint and parsley. Grain-free.',
    ingredients: 'Potato starch, pea fibre, glycerin, mint, parsley, chlorophyll, natural flavour.',
    feeding: 'One stick per day as a treat. Not a meal replacement. Always provide fresh water.',
    nutrition: { protein: '8%', fat: '3%', fibre: '6%', moisture: '12%' },
    variants: [
      { sku: 'VDS-7', size: '7 sticks', flavour: 'Mint', price: 249, mrp: 329, stock: 80 },
      { sku: 'VDS-28', size: '28 sticks', flavour: 'Mint', price: 849, mrp: 1099, stock: 40 },
    ],
    tags: ['veg'],
  },
  {
    id: 'p6', slug: 'senior-joint-care', name: 'Senior Joint-Care Dry Food',
    category: 'dry-food', brand: 'WildRoots', rating: 4.7, reviews: 76,
    lifeStage: 'senior', breedSize: 'large', foodType: 'dry', diet: ['chicken'],
    images: [img('photo-1610041321327-b794c052db27'), img('photo-1612531386530-97286d97c2d2')],
    short: 'Lower-calorie recipe with glucosamine for older dogs.',
    description: 'Formulated for senior dogs 7+ with added glucosamine and chondroitin for joint health, lower calories to maintain healthy weight, and antioxidants for immune support.',
    ingredients: 'Chicken meal, barley, oats, glucosamine, chondroitin, green-lipped mussel, turmeric, vitamins & minerals.',
    feeding: 'Feed per weight chart. Senior dogs are less active — avoid overfeeding to protect joints.',
    nutrition: { protein: '24%', fat: '11%', fibre: '5%', moisture: '10%' },
    variants: [
      { sku: 'SJC-3', size: '3kg', flavour: 'Chicken', price: 1599, mrp: 1999, stock: 18 },
      { sku: 'SJC-10', size: '10kg', flavour: 'Chicken', price: 4499, mrp: 5499, stock: 8 },
    ],
    tags: ['senior'],
  },
  {
    id: 'p7', slug: 'salmon-skin-coat', name: 'Salmon Skin & Coat Formula',
    category: 'dry-food', brand: 'GravyBowl', rating: 4.8, reviews: 203,
    lifeStage: 'adult', breedSize: 'medium', foodType: 'dry', diet: ['grain-free'],
    images: [img('photo-1535930891776-0c2dfb7fda1a'), img('photo-1507146426996-ef05306b995a')],
    short: 'Omega-rich salmon for a glossy coat.',
    description: 'Wild-caught salmon packed with omega-3 and omega-6 fatty acids to nourish skin and give a glossy, healthy coat. Grain-free and highly digestible.',
    ingredients: 'Salmon, salmon meal, peas, sweet potato, salmon oil, flaxseed, seaweed, vitamins & minerals.',
    feeding: 'Feed 1.5–3% body weight per day. Introduce gradually over 7 days when switching foods.',
    nutrition: { protein: '27%', fat: '16%', fibre: '4%', moisture: '10%' },
    variants: [
      { sku: 'SSC-2', size: '2kg', flavour: 'Salmon', price: 1299, mrp: 1649, stock: 26 },
      { sku: 'SSC-6', size: '6kg', flavour: 'Salmon', price: 3299, mrp: 3999, stock: 14 },
    ],
    tags: ['bestseller', 'grain-free'],
  },
  {
    id: 'p8', slug: 'training-liver-bites', name: 'Training Liver Bites',
    category: 'treats', brand: 'ChewWell', rating: 4.9, reviews: 410,
    lifeStage: 'puppy', breedSize: 'small', foodType: 'treats', diet: ['chicken'],
    images: [img('photo-1444212477490-ca407925329e'), img('photo-1425082661705-1834bfd09dca')],
    short: 'Soft, bite-sized rewards for training sessions.',
    description: 'Irresistibly tasty soft liver bites, perfectly sized for training rewards. Low calorie so you can reward often without overfeeding. Loved by puppies and adults alike.',
    ingredients: 'Chicken liver, chicken, rice flour, glycerin, natural flavour, mixed tocopherols.',
    feeding: 'Use as training rewards. Up to 10 bites per day for small dogs; adjust for size.',
    nutrition: { protein: '22%', fat: '9%', fibre: '2%', moisture: '18%' },
    variants: [
      { sku: 'TLB-1', size: '200g', flavour: 'Liver', price: 299, mrp: 379, stock: 90 },
      { sku: 'TLB-2', size: '500g', flavour: 'Liver', price: 599, mrp: 749, stock: 55 },
    ],
    tags: ['bestseller', 'puppy'],
  },
]

export const getProduct = (slug) => products.find((p) => p.slug === slug)
export const getProductById = (id) => products.find((p) => p.id === id)
