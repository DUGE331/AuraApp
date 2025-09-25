const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

router.post('/', async (req, res) => {
  const { username, score } = req.body;

  if (!username || score === undefined) {
    return res.status(400).json({ error: 'Username and score are required' });
  }

  // Optional: prevent duplicate usernames
  const existing = await dynamoDb.get({ TableName: process.env.DYNAMO_TABLE, Key: { username } }).promise();
  if (existing.Item) return res.status(400).json({ error: 'Username already exists' });

  const params = {
    TableName: process.env.DYNAMO_TABLE,
    Item: { username, score }
  };

  try {
    await dynamoDb.put(params).promise();
    res.json({ message: `Player ${username} added successfully!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add player' });
  }
});

module.exports = router;
