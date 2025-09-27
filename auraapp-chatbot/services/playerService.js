const { GetCommand, PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamoDB, pgPool } = require('../config/awsConfig');

class PlayerService {
    constructor() {
        this.tableName = process.env.DYNAMODB_TABLE_NAME || 'Players';
        this.usePostgreSQL = !!pgPool;
    }

    async addPlayer(username, score) {
        // Input validation
        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            throw new Error('Username is required and must be a non-empty string');
        }

        if (typeof score !== 'number' || isNaN(score) || score < 0) {
            throw new Error('Score must be a non-negative number');
        }

        const sanitizedUsername = username.trim().toLowerCase();
        const timestamp = new Date().toISOString();

        try {
            if (this.usePostgreSQL) {
                return await this.addPlayerPostgreSQL(sanitizedUsername, score, timestamp);
            } else {
                return await this.addPlayerDynamoDB(sanitizedUsername, score, timestamp);
            }
        } catch (error) {
            console.error('❌ Error adding player:', error);
            throw new Error('Failed to save player data');
        }
    }

    async addPlayerPostgreSQL(username, score, timestamp) {
        const client = await pgPool.connect();
        try {
            const query = `
                INSERT INTO players (username, score, created_at, updated_at)
                VALUES ($1, $2, $3, $3)
                ON CONFLICT (username)
                DO UPDATE SET score = $2, updated_at = $3
                RETURNING *;
            `;
            const result = await client.query(query, [username, score, timestamp]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async addPlayerDynamoDB(username, score, timestamp) {
        const params = {
            TableName: this.tableName,
            Item: {
                username,
                score,
                createdAt: timestamp,
                updatedAt: timestamp,
                ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
            },
            ConditionExpression: 'attribute_not_exists(username)',
        };

        try {
            await dynamoDB.send(new PutCommand(params));
            return params.Item;
        } catch (error) {
            if (error.name === 'ConditionalCheckFailedException') {
                // Update existing player
                const updateParams = {
                    TableName: this.tableName,
                    Key: { username },
                    UpdateExpression: 'SET score = :score, updatedAt = :timestamp',
                    ExpressionAttributeValues: {
                        ':score': score,
                        ':timestamp': timestamp
                    },
                    ReturnValues: 'ALL_NEW'
                };
                const result = await dynamoDB.send(new UpdateCommand(updateParams));
                return result.Attributes;
            }
            throw error;
        }
    }

    async getPlayerScore(username) {
        if (!username || typeof username !== 'string') {
            throw new Error('Username is required');
        }

        const sanitizedUsername = username.trim().toLowerCase();

        try {
            if (this.usePostgreSQL) {
                return await this.getPlayerPostgreSQL(sanitizedUsername);
            } else {
                return await this.getPlayerDynamoDB(sanitizedUsername);
            }
        } catch (error) {
            console.error('❌ Error getting player:', error);
            throw new Error('Failed to retrieve player data');
        }
    }

    async getPlayerPostgreSQL(username) {
        const client = await pgPool.connect();
        try {
            const query = 'SELECT * FROM players WHERE username = $1';
            const result = await client.query(query, [username]);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    async getPlayerDynamoDB(username) {
        const params = {
            TableName: this.tableName,
            Key: { username }
        };

        const result = await dynamoDB.send(new GetCommand(params));
        return result.Item || null;
    }

    async getAllPlayers(limit = 100) {
        try {
            if (this.usePostgreSQL) {
                return await this.getAllPlayersPostgreSQL(limit);
            } else {
                return await this.getAllPlayersDynamoDB(limit);
            }
        } catch (error) {
            console.error('❌ Error getting all players:', error);
            throw new Error('Failed to retrieve players');
        }
    }

    async getAllPlayersPostgreSQL(limit) {
        const client = await pgPool.connect();
        try {
            const query = 'SELECT * FROM players ORDER BY score DESC LIMIT $1';
            const result = await client.query(query, [limit]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    async getAllPlayersDynamoDB(limit) {
        const params = {
            TableName: this.tableName,
            Limit: limit
        };

        const result = await dynamoDB.send(new ScanCommand(params));
        return result.Items || [];
    }
}

module.exports = new PlayerService();