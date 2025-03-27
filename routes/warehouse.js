const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { ENVIRONMENT_VAR } = require('@/const');
const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = ENVIRONMENT_VAR;
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env[AWS_ACCESS_KEY_ID],
  secretAccessKey: process.env[AWS_SECRET_ACCESS_KEY],
});
console.log(process.env[AWS_ACCESS_KEY_ID])
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'TestTable';

router.get('/', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey and sk > :rkey',
    ExpressionAttributeValues: {
      ':hkey': 'warehouse',
    }
  };
  await dynamodb.get(params).promise().then(response => {
    res.json(response.Item);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.get('/all', async (req, res) => {
  console.log("entro")
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
    ':hkey': 'warehouse'
    }
  }
  try {
    const allProducts = await scanDynamoRecords(params, []);
    const body = {
      products: allProducts
    }
    res.json(body);
  } catch(error) {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  }
})

router.post('/', async (req, res) => {
  console.log(req.body)
    let entrada = req.body
    entrada.pk = 'warehouse'
  const params = {
    TableName: dynamodbTableName,
    Item: entrada
  }
  await dynamodb.put(params).promise().then(() => {
    const body = {
      Operation: 'SAVE',
      Message: 'SUCCESS',
      Item: req.body
    }
    res.json(body);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.patch('/', async (req, res) => {
     let entrada = req.body
    entrada.pk = 'warehouse'
    entrada.sk = Date.now()
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': entrada.pk,
      'sk': entrada.sk,
    },
    UpdateExpression: `set ${entrada.updateKey} = :value`,
    ExpressionAttributeValues: {
      ':value': entrada.updateValue
    },
    ReturnValues: 'UPDATED_NEW'
  }
  await dynamodb.update(params).promise().then(response => {
    const body = {
      Operation: 'UPDATE',
      Message: 'SUCCESS',
      UpdatedAttributes: response
    }
    res.json(body);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.delete('/', async (req, res) => {
    let entrada = req.body
    entrada.pk = 'warehouse'
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': entrada.pk,
      'sk': req.body.sk,
    },
    ReturnValues: 'ALL_OLD'
  }
  await dynamodb.delete(params).promise().then(response => {
    const body = {
      Operation: 'DELETE',
      Message: 'SUCCESS',
      Item: response
    }
    res.json(body);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

async function scanDynamoRecords(scanParams, itemArray) {
  try {
    const dynamoData = await dynamodb.query(scanParams).promise();
    itemArray = itemArray.concat(dynamoData.Items);
    if (dynamoData.LastEvaluatedKey) {
      scanParams.ExclusiveStartKey = dynamoData.LastEvaluatedKey;
      return await scanDynamoRecords(scanParams, itemArray);
    }
    return itemArray;
  } catch(error) {
    throw new Error(error);
  }
}

module.exports = router;