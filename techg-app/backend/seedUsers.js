const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const specialUsers = [
  {
    name: 'Tech Geo',
    email: 'techgeof@gmail.com',
    phone: '+254700000001',
    password: 'BLOG123',  // Changed from BLOG1 to BLOG123
    role: 'blogger'
  },
  {
    name: 'Geoffrey Muthoka',
    email: 'geoffreymuthoka@gmail.com',
    phone: '+254700000002',
    password: 'Muthoka2024',  // This is already 10 characters
    role: 'admin'
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing special users
    await User.deleteMany({
      email: { $in: ['techgeof@gmail.com', 'geoffreymuthoka@gmail.com'] }
    });

    // Create special users
    for (const userData of specialUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created ${userData.role} user: ${userData.email}`);
    }

    console.log('Special users seeded successfully!');
    console.log('Blogger login: techgeof@gmail.com / BLOG123');
    console.log('Admin login: geoffreymuthoka@gmail.com / Muthoka2024');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
