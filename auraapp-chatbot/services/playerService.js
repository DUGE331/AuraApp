const dynamoDB = require('../config/awsConfig');

async function getPlayerScore(username) {
    const params = {
        TableName: 'Players',
        Key: { username: username }  // Explicit key mapping
    };

    try {
        const result = await dynamoDB.get(params).promise();
        return result.Item || null;
    } catch (err) {
        console.error('❌ DynamoDB error in getPlayerScore:', err);
        throw err;
    }
}

module.exports = { getPlayerScore }; //makes route available to other files 
//It’s purely a code organization / modularity / maintainability practice.