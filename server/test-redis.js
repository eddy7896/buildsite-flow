/**
 * Quick Redis Connection Test
 * Run: node test-redis.js
 */

const { getRedisClient, isRedisAvailable } = require('./config/redis');

async function testRedis() {
  console.log('Testing Redis connection...\n');
  
  try {
    const available = await isRedisAvailable();
    
    if (available) {
      console.log('✅ Redis is available!');
      
      const client = await getRedisClient();
      if (client) {
        // Test basic operations
        await client.set('test:key', 'Hello Redis!');
        const value = await client.get('test:key');
        console.log(`✅ Set/Get test: ${value}`);
        
        await client.del('test:key');
        console.log('✅ Delete test: passed');
        
        await client.quit();
        console.log('\n✅ All Redis tests passed!');
        process.exit(0);
      }
    } else {
      console.log('❌ Redis is not available');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    process.exit(1);
  }
}

testRedis();
