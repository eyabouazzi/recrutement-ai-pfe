const mongoose = require('mongoose');

// MongoDB Index Optimization Script
// Run this script to create optimized indexes for better query performance

async function createIndexes() {
    console.log('Creating MongoDB indexes for optimal performance...\n');
    
    try {
        // Test Collection Indexes
        console.log('Creating Test collection indexes...');
        const testCollection = mongoose.connection.collection('tests');
        
        await testCollection.createIndex(
            { status: 1, createdAt: -1 },
            { name: 'status_createdAt_idx' }
        );
        console.log('  - status_createdAt_idx: { status: 1, createdAt: -1 }');
        
        await testCollection.createIndex(
            { createdBy: 1, createdAt: -1 },
            { name: 'createdBy_createdAt_idx' }
        );
        console.log('  - createdBy_createdAt_idx: { createdBy: 1, createdAt: -1 }');
        
        await testCollection.createIndex(
            { status: 1, employmentType: 1 },
            { name: 'status_employmentType_idx' }
        );
        console.log('  - status_employmentType_idx: { status: 1, employmentType: 1 }');
        
        await testCollection.createIndex(
            { status: 1, location: 1 },
            { name: 'status_location_idx' }
        );
        console.log('  - status_location_idx: { status: 1, location: 1 }');
        
        await testCollection.createIndex(
            { title: 'text', jobRole: 'text', description: 'text' },
            { name: 'test_text_search_idx' }
        );
        console.log('  - test_text_search_idx: Text index for search');
        
        // Submission Collection Indexes
        console.log('\nCreating Submission collection indexes...');
        const submissionCollection = mongoose.connection.collection('submissions');
        
        await submissionCollection.createIndex(
            { candidateId: 1, createdAt: -1 },
            { name: 'candidateId_createdAt_idx' }
        );
        console.log('  - candidateId_createdAt_idx: { candidateId: 1, createdAt: -1 }');
        
        await submissionCollection.createIndex(
            { testId: 1, candidateId: 1 },
            { name: 'testId_candidateId_idx', unique: true }
        );
        console.log('  - testId_candidateId_idx: { testId: 1, candidateId: 1 } (unique)');
        
        await submissionCollection.createIndex(
            { testId: 1, createdAt: -1 },
            { name: 'testId_createdAt_idx' }
        );
        console.log('  - testId_createdAt_idx: { testId: 1, createdAt: -1 }');
        
        await submissionCollection.createIndex(
            { totalScore: -1 },
            { name: 'totalScore_desc_idx' }
        );
        console.log('  - totalScore_desc_idx: { totalScore: -1 }');
        
        // User Collection Indexes
        console.log('\nCreating User collection indexes...');
        const userCollection = mongoose.connection.collection('users');
        
        // Skip email index if already exists
        try {
            await userCollection.createIndex(
                { email: 1 },
                { name: 'email_unique_idx', unique: true }
            );
            console.log('  - email_unique_idx: { email: 1 } (unique)');
        } catch (e) {
            if (e.code === 85 || e.code === 86) {
                console.log('  - email index already exists (skipping)');
            } else {
                throw e;
            }
        }
        
        await userCollection.createIndex(
            { role: 1, createdAt: -1 },
            { name: 'role_createdAt_idx' }
        );
        console.log('  - role_createdAt_idx: { role: 1, createdAt: -1 }');
        
        // Question Collection Indexes
        console.log('\nCreating Question collection indexes...');
        const questionCollection = mongoose.connection.collection('questions');
        
        await questionCollection.createIndex(
            { testId: 1 },
            { name: 'testId_idx' }
        );
        console.log('  - testId_idx: { testId: 1 }');
        
        // Log Collection Indexes
        console.log('\nCreating Log collection indexes...');
        const logCollection = mongoose.connection.collection('logs');
        
        await logCollection.createIndex(
            { userId: 1, createdAt: -1 },
            { name: 'userId_createdAt_idx' }
        );
        console.log('  - userId_createdAt_idx: { userId: 1, createdAt: -1 }');
        
        await logCollection.createIndex(
            { action: 1, createdAt: -1 },
            { name: 'action_createdAt_idx' }
        );
        console.log('  - action_createdAt_idx: { action: 1, createdAt: -1 }');
        
        await logCollection.createIndex(
            { createdAt: -1 },
            { name: 'createdAt_desc_idx', expireAfterSeconds: 2592000 } // TTL: 30 days
        );
        console.log('  - createdAt_desc_idx: TTL index (30 days retention)');
        
        // Recommendation Collection Indexes
        console.log('\nCreating Recommendation collection indexes...');
        const recommendationCollection = mongoose.connection.collection('recommendations');
        
        await recommendationCollection.createIndex(
            { userId: 1, lastUpdated: -1 },
            { name: 'userId_lastUpdated_idx' }
        );
        console.log('  - userId_lastUpdated_idx: { userId: 1, lastUpdated: -1 }');
        
        await recommendationCollection.createIndex(
            { 'recommendedTests.testId': 1 },
            { name: 'recommendedTests_testId_idx' }
        );
        console.log('  - recommendedTests_testId_idx: { recommendedTests.testId: 1 }');
        
        console.log('\n✅ All indexes created successfully!');
        
        // Display index usage statistics
        console.log('\n📊 Index Statistics:');
        const testStats = await testCollection.indexStats();
        console.log(`   Tests collection: ${testStats.length} indexes`);
        
        const submissionStats = await submissionCollection.indexStats();
        console.log(`   Submissions collection: ${submissionStats.length} indexes`);
        
        const userStats = await userCollection.indexStats();
        console.log(`   Users collection: ${userStats.length} indexes`);
        
    } catch (error) {
        console.error('Error creating indexes:', error);
        throw error;
    }
}

// Function to analyze query performance
async function analyzeQueryPerformance() {
    console.log('\n📈 Query Performance Analysis:\n');
    
    try {
        // Get collection stats
        const db = mongoose.connection.db;
        
        const testStats = await db.command({ collStats: 'tests' });
        console.log(`Tests Collection:`);
        console.log(`  - Document count: ${testStats.count}`);
        console.log(`  - Storage size: ${(testStats.storageSize / 1024).toFixed(2)} KB`);
        console.log(`  - Index size: ${(testStats.totalIndexSize / 1024).toFixed(2)} KB`);
        
        const submissionStats = await db.command({ collStats: 'submissions' });
        console.log(`\nSubmissions Collection:`);
        console.log(`  - Document count: ${submissionStats.count}`);
        console.log(`  - Storage size: ${(submissionStats.storageSize / 1024).toFixed(2)} KB`);
        console.log(`  - Index size: ${(submissionStats.totalIndexSize / 1024).toFixed(2)} KB`);
        
    } catch (error) {
        console.error('Error analyzing performance:', error);
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
