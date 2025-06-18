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
  const params2 = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#product'
    }
  };
  await dynamodb.query(params2).promise().then(async response2 => {
    const params = {
      TableName: dynamodbTableName,
      KeyConditionExpression: 'pk = :hkey and sk = :skey',
      ExpressionAttributeValues: {
        ':hkey': 'dragua#purchase',
        ':skey': req.query.ID
      }
    };
    await dynamodb.query(params).promise().then(response => {
      response.Items[0].Products = response2.Items
      res.json(response.Items[0]);
    }, error => {
      console.error('Do your custom error handling here. I am just ganna log it out: ', error);
      res.status(500).send(error);
    })
  }, error2 => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error2);
    res.status(500).send(error2);
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

router.put('/', async (req, res) => {
  const params2 = {
      TableName: dynamodbTableName,
      Key: { pk : 'dragua#purchase', sk:  req.body.sk},
      UpdateExpression: 'set #a = :x',
      ExpressionAttributeNames: {'#a' : 'Status'},
      ExpressionAttributeValues: {
        ':x': 1
      }
    };
    await dynamodb.update(params2).promise().then(() => {
          const body = {
            Operation: 'SAVE',
            Message: 'SUCCESS',
            Item: req.body
          }
          NotifyRegistro(req.body)
          res.status(200).send(body)
        }, error => {
          console.error('Do your custom error handling here. I am just ganna log it out: ', error);
          res.status(500).send(error);
        })
})

async function NotifyRegistro(params) {
  let data = {
    to: params.PhoneContact,
    mensaje: "Su pago ha sido procesado, Gracias por comprar en Doctor Agua!"
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
  let id = req.body.ID
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#purchase',
      'sk': `${id}`,
    },
    ReturnValues: 'ALL_OLD'
  }
  console.log(params)
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