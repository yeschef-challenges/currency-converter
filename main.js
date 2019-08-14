const http = require('http');
const rates = {
  usd: 1
};
function setRates(urlParts, dataObj) {
  if (!dataObj.currency || !dataObj.rate) {
    throw { status: 400, message: 'Bad request' };
  }
  rates[dataObj.currency.toLowerCase()] = parseFloat(dataObj.rate);
}
function convert(requestParams) {
  if (requestParams.length < 5) {
    throw { status: 400, message: 'Bad request' };
  }
  let amount = requestParams[2];
  const currencyFrom = requestParams[3];
  const currencyTo = requestParams[4];
  if (isNaN(amount)) {
    throw { status: 400, message: 'Invalid `amount`' };
  }
  amount = parseFloat(amount);
  if (!rates[currencyFrom]) {
    throw { status: 400, message: 'Invalid `from` currency' };
  }
  if (!rates[currencyTo]) {
    throw { status: 400, message: 'Invalid `to` currency' };
  }
  return ((amount * rates[currencyTo]) / rates[currencyFrom]).toFixed(2);
}
http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    const urlParts = req.url.split('/');
    if (req.method === 'GET') {
      switch (urlParts[1]) {
        case 'convert':
          try {
            res.end(convert(urlParts));
          } catch (e) {
            res.statusCode = e.status || 500;
            res.end(e.message);
          }
          break;
        default:
          res.statusCode = 400;
          res.end('bad request');
      }
    } else if (req.method === 'POST' || req.method === 'PUT') {
      let data = [];
      req.on('data', chunk => {
        data.push(chunk);
      });
      req.on('end', () => {
        const reqDataObj = {};
        data
          .join()
          .split('&')
          .forEach(param => {
            const paramParts = param.split('=');
            reqDataObj[paramParts[0]] = paramParts[1];
          });
        switch (urlParts[1]) {
          case 'rates':
            try {
              setRates(urlParts, reqDataObj);
              res.statusCode = 200;
              res.end('Ok');
            } catch (e) {
              res.statusCode = e.status || 500;
              res.end(e.message);
            }
            break;
          default:
            res.statusCode = 400;
            res.end('bad request');
        }
      });
    } else {
      res.statusCode = 400;
      res.end('bad request');
    }
    console.log(req.url);
  })
  .listen(8080);
console.log('server is up and running on port 8080');