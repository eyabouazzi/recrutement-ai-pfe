const mongoose = require('mongoose');

// MongoDB Index Optimization Script
// Run this script to create optimized indexes for better query performance

async function safeCreateIndex(collection, keys, options) {
    try {
        await collection.createIndex(keys, options);
        console.log(`  - ${options.name}: ${JSON.stringify(keys)} ${options.unique ? '(unique)' : ''}`);
    } catch (e) {
        if (e.code === 85 || e.code === 86 || e.code === 11000) {
            console.log(`  - ${options.name} warning/exists: ${e.message} (skipping)`);
        } else {
            console.error(`  - Error creating ${options.name}:`, e.message);
        }
    }
}

async function createIndexes() {
    console.log('Creating MongoDB indexes for optimal performance...\n');
    
    try {
        // Test Collection Indexes
        console.log('Creating Test collection indexes...');
        const testCollection = mongoose.connection.collection('tests');
        
        await safeCreateIndex(testCollection, { status: 1, createdAt: -1 }, { name: 'status_createdAt_idx' });
        await safeCreateIndex(testCollection, { createdBy: 1, createdAt: -1 }, { name: 'createdBy_createdAt_idx' });
        await safeCreateIndex(testCollection, { status: 1, employmentType: 1 }, { name: 'status_employmentType_idx' });
        await safeCreateIndex(testCollection, { status: 1, location: 1 }, { name: 'status_location_idx' });
        await safeCreateIndex(testCollection, { title: 'text', jobRole: 'text', description: 'text' }, { name: 'test_text_search_idx' });
        
        // Submission Collection Indexes
        console.log('\nCreating Submission collection indexes...');
        const submissionCollection = mongoose.connection.collection('submissions');
        
        await safeCreateIndex(submissionCollection, { candidateId: 1, createdAt: -1 }, { name: 'candidateId_createdAt_idx' });
        await safeCreateIndex(submissionCollection, { testId: 1, candidateId: 1 }, { name: 'testId_candidateId_idx', unique: true });
        await safeCreateIndex(submissionCollection, { testId: 1, createdAt: -1 }, { name: 'testId_createdAt_idx' });
        await safeCreateIndex(submissionCollection, { totalScore: -1 }, { name: 'totalScore_desc_idx' });

        // Interview Collection Indexes
        console.log('\nCreating Interview collection indexes...');
        const interviewCollection = mongoose.connection.collection('interviews');
        await safeCreateIndex(interviewCollection, { candidateId: 1, scheduledAt: -1 }, { name: 'candidateId_scheduledAt_desc_idx' });
        await safeCreateIndex(interviewCollection, { createdBy: 1, scheduledAt: -1 }, { name: 'createdBy_scheduledAt_desc_idx' });
        await safeCreateIndex(interviewCollection, { testId: 1, scheduledAt: -1 }, { name: 'testId_scheduledAt_desc_idx' });
        await safeCreateIndex(interviewCollection, { status: 1, scheduledAt: -1 }, { name: 'status_scheduledAt_desc_idx' });
        
        // User Collection Indexes
        console.log('\nCreating User collection indexes...');
        const userCollection = mongoose.connection.collection('users');
        await safeCreateIndex(userCollection, { email: 1 }, { name: 'email_unique_idx', unique: true });
        await safeCreateIndex(userCollection, { role: 1, createdAt: -1 }, { name: 'role_createdAt_idx' });
        
        // Question Collection Indexes
        console.log('\nCreating Question collection indexes...');
        const questionCollection = mongoose.connection.collection('questions');
        await safeCreateIndex(questionCollection, { testId: 1 }, { name: 'testId_idx' });
        
        // Log Collection Indexes
        console.log('\nCreating Log collection indexes...');
        const logCollection = mongoose.connection.collection('logs');
        await safeCreateIndex(logCollection, { userId: 1, createdAt: -1 }, { name: 'userId_createdAt_idx' });
        await safeCreateIndex(logCollection, { action: 1, createdAt: -1 }, { name: 'action_createdAt_idx' });
        await safeCreateIndex(logCollection, { createdAt: -1 }, { name: 'createdAt_desc_idx', expireAfterSeconds: 2592000 }); // TTL: 30 days
        
        // Recommendation Collection Indexes
        console.log('\nCreating Recommendation collection indexes...');
        const recommendationCollection = mongoose.connection.collection('recommendations');
        await safeCreateIndex(recommendationCollection, { userId: 1, lastUpdated: -1 }, { name: 'userId_lastUpdated_idx' });
        await safeCreateIndex(recommendationCollection, { 'recommendedTests.testId': 1 }, { name: 'recommendedTests_testId_idx' });

        // Notification Collection Indexes
        console.log('\nCreating Notification collection indexes...');
        const notificationCollection = mongoose.connection.collection('appnotifications');
        await safeCreateIndex(notificationCollection, { userId: 1, read: 1, createdAt: -1 }, { name: 'notif_user_read_created_idx' });
        await safeCreateIndex(notificationCollection, { userId: 1, archived: 1, createdAt: -1 }, { name: 'notif_user_archived_created_idx' });
        await safeCreateIndex(notificationCollection, { userId: 1, actionKey: 1, createdAt: -1 }, { name: 'notif_user_action_created_idx' });

        console.log('\nCreating ContactLead collection indexes...');
        const contactCollection = mongoose.connection.collection('contactleads');
        await safeCreateIndex(contactCollection, { createdAt: -1 }, { name: 'contact_createdAt_desc_idx' });
        await safeCreateIndex(contactCollection, { email: 1, type: 1, createdAt: -1 }, { name: 'contact_email_type_created_idx' });
        
        console.log('\n✅ All indexes checked and created successfully!');
        
        // Display index usage statistics properly using indexes() instead of indexStats()
        console.log('\n📊 Index Statistics:');
        const testIndexes = await testCollection.indexes();
        console.log(`   Tests collection: ${testIndexes.length} indexes`);
        
        const submissionIndexes = await submissionCollection.indexes();
        console.log(`   Submissions collection: ${submissionIndexes.length} indexes`);
        
        const userIndexes = await userCollection.indexes();
        console.log(`   Users collection: ${userIndexes.length} indexes`);
        
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

// Function to analyze query performance
async function analyzeQueryPerformance() {
    console.log('\n📈 Query Performance Analysis:\n');
    
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const testExists = collections.some(c => c.name === 'tests');
        const subExists = collections.some(c => c.name === 'submissions');
        
        if (testExists) {
            const testStats = await db.command({ collStats: 'tests' });
            console.log(`Tests Collection:`);
            console.log(`  - Document count: ${testStats.count}`);
            console.log(`  - Storage size: ${(testStats.storageSize / 1024).toFixed(2)} KB`);
        }
        
        if (subExists) {
            const submissionStats = await db.command({ collStats: 'submissions' });
            console.log(`\nSubmissions Collection:`);
            console.log(`  - Document count: ${submissionStats.count}`);
            console.log(`  - Storage size: ${(submissionStats.storageSize / 1024).toFixed(2)} KB`);
        }
        
    } catch (error) {
        console.error('Error analyzing performance:', error.message);
    }
}

module.exports = {
    createIndexes,
    analyzeQueryPerformance
};

// Run if called directly
if (require.main === module) {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment-platform')
        .then(() => {
            console.log('Connected to MongoDB\n');
            return createIndexes();
        })
        .then(() => analyzeQueryPerformance())
        .then(() => mongoose.disconnect())
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}
