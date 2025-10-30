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
      ':hkey': 'dragua#product'
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

router.get('/emergency', async (req, res) => {
  console.log("entro")
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
    ':hkey': 'dragua#emergency'
    }
  }
  try {
    const allProducts = await scanDynamoRecords(params, []);
    const body = {
      emergency: allProducts
    }
    res.json(body);
  } catch(error) {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  }
})

router.put('/emergency', async (req, res) => {
   const params2 = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#emergency'
    }
  };
  await dynamodb.query(params2).promise().then(async response2 => {
    if(response2.Items[0].active == 1){
const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#emergency',
      'sk': '1761835072764',
    },
    UpdateExpression: `set #bs = :value, #ae = :value2`,
    ExpressionAttributeNames: {
        "#bs": "Base",
      "#ae": "active",
    },
    ExpressionAttributeValues: {
      ':value': req.body.Base,
      ':value2': 0,
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
    }else{
      const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#emergency',
      'sk': '1761835072764',
    },
    UpdateExpression: `set #bs = :value, #ae = :value2`,
      ExpressionAttributeNames: {
        "#bs": "Base",
      "#ae": "active",
    },
    ExpressionAttributeValues: {
      ':value': req.body.Base,
      ':value2': 1,
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
    } 
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
  
})

router.post('/', async (req, res) => {
  let entrada = req.body
  entrada.pk = 'dragua#product'
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
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
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
      'pk': 'dragua#product',
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

//Store

router.get('/store/', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#store'
    }
  };
  await dynamodb.query(params).promise().then(response => {
    res.json(response.Items);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.get('/dolar/', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#dolar'
    }
  };
  await dynamodb.query(params).promise().then(response => {
    res.json(response.Items);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.put('/store', async (req, res) => {
  let nuevovalor = parseInt(req.body.Exist) + parseInt(req.body.Quantity)
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#store',
      'sk': req.body.ID,
    },
    UpdateExpression: `set Quantity = :value`,
    ExpressionAttributeValues: {
      ':value': nuevovalor
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

router.put('/', async (req, res) => {
  let nuevovalor = req.body.Price
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#product',
      'sk': req.body.ID,
    },
    UpdateExpression: `set Price = :value`,
    ExpressionAttributeValues: {
      ':value': nuevovalor
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

router.put('/cambios', async (req, res) => {
  let horaactualizacino = Date.now()
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#dolar',
      'sk': req.body.ID,
    },
    UpdateExpression: `set #BCV = :value, #dt = :value2`,
    ExpressionAttributeNames:{
      "#BCV": "BCV",
      "#dt": "Date",
    },
    ExpressionAttributeValues: {
      ':value': req.body.BCV,
      ':value2': horaactualizacino,
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

router.get('/store/entry', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#storeentry'
    }
  };
  await dynamodb.query(params).promise().then(response => {
    res.json(response.Items);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.get('/store/exit', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#storeexit'
    }
  };
  await dynamodb.query(params).promise().then(response => {
    res.json(response.Items);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.get('/provider/', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    KeyConditionExpression: 'pk = :hkey',
    ExpressionAttributeValues: {
      ':hkey': 'dragua#provider'
    }
  };
  await dynamodb.query(params).promise().then(response => {
    res.json(response.Items);
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.post('/provider/', async (req, res) => {
  let entrada = req.body
  entrada.pk = 'dragua#provider'
  entrada.sk = Date.now().toString()
  entrada.idProvider = entrada.sk
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
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.delete('/provider', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#provider',
      'sk': req.body.IdProvider,
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

router.post('/store', async (req, res) => {
  let entrada = req.body
  entrada.pk = 'dragua#store'
  entrada.sk = Date.now().toString()
  entrada.ID = entrada.sk
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
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

router.delete('/store', async (req, res) => {
  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#store',
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

module.exports = router;