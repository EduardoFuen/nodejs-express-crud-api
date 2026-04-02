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
const token = "EAAK0ZCFTtWJABPLtOgZAaYRFbkhQZCIAfeltVyOXLEnn412y9pIXZB5IGZAu5pH9YvTXgzZBhRSNO6AMJGKLyCq1tZC91WmQiZB3ZCaGSgnGxtDwJaujcUxsWbtFWe1wdObB9w75kmAm2suk8XediYXBvqF5rWtx0gI54nrgAiEv8k2dfhPrK56fTEjktKlZB868HrxgZDZD"
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

router.put('/', async (req, res) => {
  const { ID, pk, sk, ...updateData } = req.body;

  if (!ID) {
    return res.status(400).send({ Message: 'ID is required' });
  }

  let updateExpression = 'set';
  let expressionAttributeNames = {};
  let expressionAttributeValues = {};

  const keys = Object.keys(updateData);
  if (keys.length === 0) {
    return res.status(400).send({ Message: 'No segments to update' });
  }

  keys.forEach((key, index) => {
    updateExpression += ` #${key} = :value${index}${index < keys.length - 1 ? ',' : ''}`;
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:value${index}`] = updateData[key];
  });

  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': 'dragua#client',
      'sk': ID.toString(),
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
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

router.post('/', async (req, res) => {
   let entrada = req.body
  if(entrada.rifempresa){
    entrada.Code = entrada.rifempresa
     entrada.Rif = entrada.rifempresa
  }else{
    entrada.Code = entrada.Rif
  }
  if(!entrada.BusinessName){
    entrada.BusinessName = entrada.Vendedor
  }
 
  entrada.pk = 'dragua#client'
  entrada.sk = Date.now().toString()
  const params = {
    TableName: dynamodbTableName,
    Item: entrada
  }
  await dynamodb.put(params).promise().then(() => {
    const body = {
      Operation: 'SAVE',
      Message: 'SUCCESS',
      Item: entrada
    }
    res.status(200).send(body)
    metaNotify(params.Item)
  }, error => {
    console.error('Do your custom error handling here. I am just ganna log it out: ', error);
    res.status(500).send(error);
  })
})

/*async function NotifyRegistro(params) {
  let data = {
    to: params.PhoneContact,
    mensaje: "Su registro ha sido Exitoso! Bienvenido a Doctor Agua! ya puede hacer sus pedidos, para mas informacion seleccione el menu: como hacer un pedido"
  }
  const response = await axios.post(`https://zly2flikh7.execute-api.us-east-1.amazonaws.com/api/enviarVerificacionReg`, { ...data });
  console.log(response)
  return "ok"
}*/

const lista = {
            type: "list",
            body: {
                text: "Si deseas algo mas te invito a ver nuestro menu de servicios"
            },
            action:{
                button: "Menu de servicios",
                sections: [
                    {
                        title: "Menu de servicios",
                        rows: [{
                            id: "m1",
                            title: "🛒 Quiero hacer un pedido",

                        },
                        {
                            id: "m6",
                            title: "📍 Horarios de atención.",
                        },
                         {
                            id: "m3",
                            title: "📞 Atención al cliente",
                        },
                        {
                            id: "m7",
                            title: "📑 Mi estado de cuenta",
                        },
                        {
                            id: "m8",
                            title: "💧 Nuestro servicio",
                        },
                        {
                            id: "m2",
                            title: "💵 Lista de precios",
                        }
                    ]
                }
                ]
            }
        }

async function metaNotify(params) {
 await axios({
        method: "POST",
        url: `https://graph.facebook.com/v23.0/731086380087063/messages`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: params.PhoneContact,
          type: "text",
           text: {
              body: "✅ Registro exitoso \n¡Bienvenido a Doctor Agua! Ya puedes realizar tus pedidos. \nPara más detalles, consulta el menú: Quiero hacer un pedido."
            }
        },
      });
       await axios({
        method: "POST",
        url: `https://graph.facebook.com/v23.0/731086380087063/messages`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: params.PhoneContact,
          type: "interactive",
           interactive: lista
        },
      });
  return "ok"
}



router.patch('/', async (req, res) => {
  const { pk, sk, ...updateData } = req.body;

  if (!pk || !sk) {
    return res.status(400).send({ Message: 'pk and sk are required' });
  }

  let updateExpression = 'set';
  let expressionAttributeNames = {};
  let expressionAttributeValues = {};

  const keys = Object.keys(updateData);
  if (keys.length === 0) {
    return res.status(400).send({ Message: 'No data to update' });
  }

  keys.forEach((key, index) => {
    updateExpression += ` #${key} = :value${index}${index < keys.length - 1 ? ',' : ''}`;
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:value${index}`] = updateData[key];
  });

  const params = {
    TableName: dynamodbTableName,
    Key: {
      'pk': pk,
      'sk': sk,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
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