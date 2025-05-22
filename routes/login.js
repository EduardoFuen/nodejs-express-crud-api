const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'TestTable';

router.post('/', async (req, res) => {
    const params = {
        TableName: dynamodbTableName,
        KeyConditionExpression: 'pk = :hkey',
        FilterExpression: 'username = :userkey and password = :passkey',
        ExpressionAttributeValues: {
          ':hkey': 'dragua#user',
          ':userkey': req.body.email,
          ':passkey': req.body.password,
        }
      };
      await dynamodb.query(params).promise().then(response => {
        res.json(response.Items[0]);
      }, error => {
        console.error('Do your custom error handling here. I am just ganna log it out: ', error);
        res.status(500).send(error);
      })
  })

  module.exports = router;