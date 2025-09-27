const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { Pool } = require('pg');

// DynamoDB Configuration (AWS SDK v3)
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);

// PostgreSQL Configuration (if using RDS)
const pgPool = process.env.DATABASE_URL ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
}) : null;

// Test database connections
const testConnections = async () => {
    try {
        if (pgPool) {
            const client = await pgPool.connect();
            console.log('✅ PostgreSQL connection successful');
            client.release();
        }

        console.log('✅ DynamoDB client initialized');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

module.exports = {
    dynamoDB,
    pgPool,
    testConnections
};
