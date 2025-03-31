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

router.get('/', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#purchase'
    }
  };
  await dynamodb.query(params).promise().then(response => {
    res.json(response.Items);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.get('/byid', async (req, res) => {
  console.log(req.query.ID)
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey and sk = :skey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#purchase',
      ':skey': req.query.ID
    }
  };
  await dynamodb.query(params).promise().then(response => {
    res.json(response.Items[0]);
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
    const params2 = {
        TableName: dynamodbTableName,
        KeyConditionExpression: 'pk = :hkey and sk = :skey',
        ExpressionAttributeValues: {
          ':hkey': 'dragua#client',
          ':skey': req.body.SupplierID,
        }
      };
      await dynamodb.query(params2).promise().then(async response2 => {
        let entrada = req.body
        entrada.pk = 'dragua#purchase'
        entrada.BusinessName = response2.Items[0].BusinessName
        entrada.Rif = response2.Items[0].Rif
        entrada.EmailContact = response2.Items[0].EmailContact
        const params = {
          TableName: dynamodbTableName,
          Item: entrada
        }
        console.log(params.Item)
        await dynamodb.put(params).promise().then(() => {
          const body = {
            Operation: 'SAVE',
            Message: 'SUCCESS',
            Item: req.body
          }
          res.status(200).send(body)
        }, error => {
          console.error('Do your custom error handling here. I am just ganna log it out: ', error);
          res.status(500).send(error);
        })
      })
})

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
      'pk': 'dragua#purchase',
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