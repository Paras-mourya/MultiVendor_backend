import mongoose from 'mongoose';
import BlogService from './src/services/blog.service.js';
import connectDB from './src/config/db.js';
import redisClient from './src/config/redis.js';

async function verifyIntrospection() {
  try {
    console.log('--- Starting Introspection Verification ---');
    await connectDB();
    await redisClient.connect();

    // 1. Initial State (Public)
    console.log('1. Fetching current settings (Public approach)...');
    const initialSettings = await BlogService.getSettings();
    console.log('Default Title:', initialSettings.introspectionTitle);
    console.log('Default Subtitle:', initialSettings.introspectionSubtitle);

    // 2. Update Settings (Admin approach)
    console.log('2. Updating Settings...');
    const newTitle = 'Custom Blog Title';
    const newSubtitle = 'This is a custom subtitle for the homepage.';
    await BlogService.updateSettings({ 
      isBlogEnabled: true,
      introspectionTitle: newTitle,
      introspectionSubtitle: newSubtitle 
    });

    // 3. Verify Update
    const updatedSettings = await BlogService.getSettings();
    console.log('Updated Title:', updatedSettings.introspectionTitle);
    console.log('Updated Subtitle:', updatedSettings.introspectionSubtitle);

    if (updatedSettings.introspectionTitle === newTitle && updatedSettings.introspectionSubtitle === newSubtitle) {
      console.log('SUCCESS: Introspection settings updated correctly.');
    } else {
      console.error('FAIL: Introspection settings NOT updated correctly!');
    }

    console.log('--- Verification Successful (Introspection) ---');
  } catch (err) {
    console.error('--- Verification Failed (Introspection) ---');
    console.error(err);
  } finally {
    await mongoose.connection.close();
    await redisClient.quit();
    process.exit(0);
  }
}

verifyIntrospection();
