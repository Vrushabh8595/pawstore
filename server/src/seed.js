import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { User, Category, Product, Settings } from './models/index.js'

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`

const categories = [
  { slug: 'dry-food', name: 'Dry Food' },
  { slug: 'wet-food', name: 'Wet Food' },
  { slug: 'treats', name: 'Treats' },
  { slug: 'puppy', name: 'Puppy' },
  { slug: 'supplements', name: 'Supplements' },
]

const products = [
  { name: 'Daily Chicken Adult Dry Food', slug: 'chicken-adult-dry', category: 'dry-food', brand: 'PawNutri', rating: 4.7, reviews: 214, lifeStage: 'adult', breedSize: 'medium', foodType: 'dry', diet: ['chicken'], images: [img('photo-1589924691995-400dc9ecc119')], short: 'Protein-rich chicken kibble for everyday adult nutrition.', description: 'Complete and balanced recipe made with real deboned chicken.', ingredients: 'Deboned chicken, brown rice, oats, chicken fat, flaxseed, vitamins.', feeding: 'Small 90–140g, medium 140–300g, large 300–450g per day.', nutrition: { protein: '26%', fat: '14%', fibre: '4%', moisture: '10%' }, tags: ['bestseller'], variants: [{ sku: 'CAD-1', size: '1kg', flavour: 'Chicken', price: 549, mrp: 699, stock: 40 }, { sku: 'CAD-3', size: '3kg', flavour: 'Chicken', price: 1399, mrp: 1799, stock: 25 }, { sku: 'CAD-10', size: '10kg', flavour: 'Chicken', price: 3999, mrp: 4999, stock: 12 }] },
  { name: 'Grain-Free Lamb & Sweet Potato', slug: 'lamb-grainfree-adult', category: 'dry-food', brand: 'WildRoots', rating: 4.8, reviews: 167, lifeStage: 'adult', breedSize: 'large', foodType: 'dry', diet: ['grain-free', 'lamb'], images: [img('photo-1568640347023-a616a30bc3bd')], short: 'Grain-free lamb recipe for sensitive tummies.', description: 'Limited-ingredient grain-free formula with pasture-raised lamb.', ingredients: 'Lamb meal, sweet potato, peas, chickpeas, salmon oil, vitamins.', feeding: 'Feed 1.5–3% of body weight per day.', nutrition: { protein: '28%', fat: '15%', fibre: '4.5%', moisture: '10%' }, tags: ['grain-free'], variants: [{ sku: 'LGF-2', size: '2kg', flavour: 'Lamb', price: 1199, mrp: 1499, stock: 30 }, { sku: 'LGF-6', size: '6kg', flavour: 'Lamb', price: 2999, mrp: 3799, stock: 15 }] },
  { name: 'Puppy Starter Chicken & Milk', slug: 'puppy-starter-chicken', category: 'puppy', brand: 'PawNutri', rating: 4.9, reviews: 320, lifeStage: 'puppy', breedSize: 'small', foodType: 'dry', diet: ['chicken'], images: [img('photo-1543466835-00a7907e9de1')], short: 'Soft, soakable kibble for weaning puppies.', description: 'For puppies 3–12 months with DHA for brain development.', ingredients: 'Chicken, milk powder, rice, egg, fish oil, calcium, probiotics.', feeding: 'Soak for young puppies. 3–4 small meals a day.', nutrition: { protein: '30%', fat: '18%', fibre: '3%', moisture: '10%' }, tags: ['bestseller', 'puppy'], variants: [{ sku: 'PST-1', size: '1kg', flavour: 'Chicken', price: 649, mrp: 799, stock: 50 }, { sku: 'PST-3', size: '3kg', flavour: 'Chicken', price: 1699, mrp: 2099, stock: 22 }] },
  { name: 'Chicken Stew Wet Food (Pack of 6)', slug: 'chicken-stew-wet', category: 'wet-food', brand: 'GravyBowl', rating: 4.6, reviews: 98, lifeStage: 'adult', breedSize: 'medium', foodType: 'wet', diet: ['chicken'], images: [img('photo-1585846416120-3a7df1a0d5a3')], short: 'Tender chicken chunks in gravy, 6 x 100g pouches.', description: 'Succulent chunks of real chicken slow-cooked in savoury gravy.', ingredients: 'Chicken (60%), chicken broth, carrots, peas, sunflower oil.', feeding: 'One 100g pouch per 3kg body weight per day.', nutrition: { protein: '10%', fat: '6%', fibre: '1%', moisture: '80%' }, tags: ['new'], variants: [{ sku: 'CSW-6', size: '6 x 100g', flavour: 'Chicken', price: 499, mrp: 629, stock: 60 }, { sku: 'CSW-12', size: '12 x 100g', flavour: 'Chicken', price: 949, mrp: 1199, stock: 35 }] },
  { name: 'Veg Dental Sticks', slug: 'veg-dental-treats', category: 'treats', brand: 'ChewWell', rating: 4.5, reviews: 141, lifeStage: 'adult', breedSize: 'small', foodType: 'treats', diet: ['veg', 'grain-free'], images: [img('photo-1518717758536-85ae29035b6d')], short: 'Plant-based dental chews that freshen breath.', description: 'Vegetarian dental sticks that help reduce tartar.', ingredients: 'Potato starch, pea fibre, glycerin, mint, parsley.', feeding: 'One stick per day as a treat.', nutrition: { protein: '8%', fat: '3%', fibre: '6%', moisture: '12%' }, tags: ['veg'], variants: [{ sku: 'VDS-7', size: '7 sticks', flavour: 'Mint', price: 249, mrp: 329, stock: 80 }, { sku: 'VDS-28', size: '28 sticks', flavour: 'Mint', price: 849, mrp: 1099, stock: 40 }] },
  { name: 'Senior Joint-Care Dry Food', slug: 'senior-joint-care', category: 'dry-food', brand: 'WildRoots', rating: 4.7, reviews: 76, lifeStage: 'senior', breedSize: 'large', foodType: 'dry', diet: ['chicken'], images: [img('photo-1610041321327-b794c052db27')], short: 'Lower-calorie recipe with glucosamine for older dogs.', description: 'For senior dogs 7+ with glucosamine and chondroitin.', ingredients: 'Chicken meal, barley, oats, glucosamine, chondroitin, turmeric.', feeding: 'Feed per weight chart; avoid overfeeding.', nutrition: { protein: '24%', fat: '11%', fibre: '5%', moisture: '10%' }, tags: ['senior'], variants: [{ sku: 'SJC-3', size: '3kg', flavour: 'Chicken', price: 1599, mrp: 1999, stock: 18 }, { sku: 'SJC-10', size: '10kg', flavour: 'Chicken', price: 4499, mrp: 5499, stock: 8 }] },
  { name: 'Salmon Skin & Coat Formula', slug: 'salmon-skin-coat', category: 'dry-food', brand: 'GravyBowl', rating: 4.8, reviews: 203, lifeStage: 'adult', breedSize: 'medium', foodType: 'dry', diet: ['grain-free'], images: [img('photo-1535930891776-0c2dfb7fda1a')], short: 'Omega-rich salmon for a glossy coat.', description: 'Wild-caught salmon packed with omega-3 and omega-6.', ingredients: 'Salmon, salmon meal, peas, sweet potato, flaxseed, seaweed.', feeding: 'Feed 1.5–3% body weight per day.', nutrition: { protein: '27%', fat: '16%', fibre: '4%', moisture: '10%' }, tags: ['bestseller', 'grain-free'], variants: [{ sku: 'SSC-2', size: '2kg', flavour: 'Salmon', price: 1299, mrp: 1649, stock: 26 }, { sku: 'SSC-6', size: '6kg', flavour: 'Salmon', price: 3299, mrp: 3999, stock: 14 }] },
  { name: 'Training Liver Bites', slug: 'training-liver-bites', category: 'treats', brand: 'ChewWell', rating: 4.9, reviews: 410, lifeStage: 'puppy', breedSize: 'small', foodType: 'treats', diet: ['chicken'], images: [img('photo-1444212477490-ca407925329e')], short: 'Soft, bite-sized rewards for training sessions.', description: 'Irresistible soft liver bites, perfectly sized for training.', ingredients: 'Chicken liver, chicken, rice flour, glycerin, natural flavour.', feeding: 'Use as training rewards.', nutrition: { protein: '22%', fat: '9%', fibre: '2%', moisture: '18%' }, tags: ['bestseller', 'puppy'], variants: [{ sku: 'TLB-1', size: '200g', flavour: 'Liver', price: 299, mrp: 379, stock: 90 }, { sku: 'TLB-2', size: '500g', flavour: 'Liver', price: 599, mrp: 749, stock: 55 }] },
]

async function run() {
  await connectDB(process.env.MONGO_URI)
  await Promise.all([Category.deleteMany({}), Product.deleteMany({})])
  await Category.insertMany(categories)
  await Product.insertMany(products)

  const email = process.env.ADMIN_EMAIL || 'admin@pawstore.in'
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10)
  await User.findOneAndUpdate(
    { email },
    { name: process.env.ADMIN_NAME || 'Store Admin', email, passwordHash, role: 'admin' },
    { upsert: true, new: true }
  )

  await Settings.findOneAndUpdate(
    { key: 'global' },
    { key: 'global', upiId: process.env.UPI_ID || 'pawstore@upi', payeeName: process.env.UPI_PAYEE || 'PawStore' },
    { upsert: true }
  )

  console.log(`✓ Seeded ${categories.length} categories, ${products.length} products, 1 admin (${email}), settings`)
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
