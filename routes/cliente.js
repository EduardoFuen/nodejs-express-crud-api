const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const axios = require('axios')
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = 'TestTable';

router.get('/', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#client'
    }
  };
  await dynamodb.query(params).promise().then(response => {
    res.json(response.Items);
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
    ':hkey': 'key'
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
  let entrada = req.body
  entrada.pk = 'dragua#client'
  entrada.sk = Date.now().toString()
  const params = {
    TableName: dynamodbTableName,
    Item: req.body
  }
  await dynamodb.put(params).promise().then(() => {
    const body = {
      Operation: 'SAVE',
      Message: 'SUCCESS',
      Item: req.body
    }
    res.status(200).send(body)
    NotifyRegistro(params.Item)
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

async function NotifyRegistro(params) {
  let data = {
    to: params.PhoneContact,
    mensaje: "Su registro ha sido Exitoso! Bienvenido a Doctor Agua! ya puede hacer sus pedidos, para mas informacion escriba la palabra: como hacer un pedido"
  }
  const response = await axios.post(`https://zly2flikh7.execute-api.us-east-1.amazonaws.com/api/enviarVerificacionReg`, { ...data });
  console.log(response)
  return "ok"
}

router.patch('/', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': req.body.pk,
      'sk': req.body.sk,
    },
    UpdateExpression: `set ${req.body.updateKey} = :value`,
    ExpressionAttributeValues: {
      ':value': req.body.updateValue
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
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#client',
      'sk': req.body.ID,
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