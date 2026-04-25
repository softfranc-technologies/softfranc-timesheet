require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - remove in production)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@softfranc.com',
      passwordHash: 'admin123',
      role: 'admin',
      department: 'Management',
      position: 'System Administrator',
      isActive: true
    });
    console.log('👤 Admin created:', admin.email);

    // Create sample employees
    const employees = [
      { name: 'Alice Johnson', email: 'alice@softfranc.com', passwordHash: 'emp123', department: 'Engineering', position: 'Software Developer' },
      { name: 'Bob Smith', email: 'bob@softfranc.com', passwordHash: 'emp123', department: 'Design', position: 'UI/UX Designer' },
      { name: 'Carol Williams', email: 'carol@softfranc.com', passwordHash: 'emp123', department: 'Marketing', position: 'Marketing Manager' },
      { name: 'David Brown', email: 'david@softfranc.com', passwordHash: 'emp123', department: 'Engineering', position: 'Backend Developer' },
    ];

    for (const emp of employees) {
      const user = await User.create({ ...emp, role: 'employee', isActive: true });
      console.log('👤 Employee created:', user.email);
    }

    console.log('\n✅ Seed completed!');
    console.log('─────────────────────────────────────────');
    console.log('🔑 Admin Login:    admin@softfranc.com / admin123');
    console.log('🔑 Employee Login: alice@softfranc.com / emp123');
    console.log('─────────────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
