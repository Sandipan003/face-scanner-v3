import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Product } from './models/Product';
import bcrypt from 'bcrypt';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/face-scanner';

const seedProducts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Create a dummy client vendor user
    let vendor = await User.findOne({ email: 'vendor@apothecary.com' });
    if (!vendor) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      vendor = await User.create({
        name: 'Horace Slughorn',
        email: 'vendor@apothecary.com',
        password: hashedPassword,
        role: 'client',
        businessDetails: {
          businessName: 'Slughorn Apothecary',
          businessAddress: 'Diagon Alley'
        }
      });
      console.log('Created Vendor user');
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    const products = [
      {
        clientId: vendor._id,
        name: 'Draught of Peace',
        description: 'A complex potion that relieves anxiety and agitation. Its pearly white vapor will soothe even the most frayed nerves. Highly recommended for those exhibiting high stress levels, irregular pulse waveforms, and low energy. Contains powdered moonstone and syrup of hellebore.',
        price: 45.00,
        targetHealthConditions: ['High Stress'],
        imageBase64: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&q=80&w=800'
      },
      {
        clientId: vendor._id,
        name: 'Vitamix Elixir (Skele-Gro Base)',
        description: 'While originally formulated to mend bones, this adapted elixir significantly boosts Heart Rate Variability (HRV) and overall resonance. The potent mix of restorative herbs drastically improves fatigue scores. Warning: tastes terrible, but the vitality boost is unparalleled.',
        price: 80.00,
        targetHealthConditions: ['Low HRV'],
        imageBase64: 'https://images.unsplash.com/photo-1595152452543-e5fc28ebc2b8?auto=format&fit=crop&q=80&w=800'
      },
      {
        clientId: vendor._id,
        name: 'Essence of Dittany',
        description: 'A powerful healing herb and restorative. When applied topically, it instantly revitalizes the skin, combating dehydration, evening out skin tone, and drastically reducing apparent skin age. Excellent for individuals flagged with poor skin hydration, dull complexion, or elevated wrinkles.',
        price: 120.00,
        targetHealthConditions: ['Skincare'],
        imageBase64: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=800'
      },
      {
        clientId: vendor._id,
        name: 'Blood-Replenishing Potion',
        description: 'An advanced potion designed to stabilize cardiovascular irregularities. It naturally lowers elevated blood pressure and reduces overall cardiovascular risk. Infused with dragon\'s blood, it promotes a healthy pulse and improves circulation.',
        price: 150.00,
        targetHealthConditions: ['Blood Pressure', 'Elevated CV Risk'],
        imageBase64: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&q=80&w=800'
      },
      {
        clientId: vendor._id,
        name: 'Invigoration Draught',
        description: 'A potion that acts as a profound stimulant. Perfect for treating severe fatigue and low energy scores. It boosts eye alertness immediately upon consumption and enhances overall cognitive metrics for up to 12 hours.',
        price: 60.00,
        targetHealthConditions: ['Low Energy'],
        imageBase64: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=80&w=800'
      }
    ];

    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedProducts();
