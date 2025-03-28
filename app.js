const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3050;

const clientRouter = require('./routes/cliente');
const productRouter = require('./routes/product');
const warehouseRouter = require('./routes/warehouse');
app.use(express.json({limit: '50mb'}));
//app.use(express.urlencoded({limit: '50mb'}));
app.use(
  cors({
    origin: "*",
  }),
);
app.use('/supplier', clientRouter);
app.use('/product', productRouter);
app.use('/warehouse', warehouseRouter);

app.get('/', (req, res) => {
  res.send('<h1>Node.js CRUD API</h1> <h4>Message: Success</h4><p>Version: 1.0</p>');
})

app.get('/health', (req, res) => {
  res.send();
})

app.listen(port, () => {
  console.log('Demo app is up and listening to port: ' + port);
})

