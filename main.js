const http = require('http');

const rates = {
    usd: 1
};

function setRates(urlParts, dataObj) {
  const { currency, rate } = dataObj;
  const castRate = +rate;
  if(Number.isNaN(castRate)){
    throw new Error(`Invalid rate of currency \`${currency}\``);
  }
  rates[currency.toLowerCase()] = castRate;
}

function validateCurrency(obj) {
  Object.keys(obj).forEach((key) => {
    if(!obj[key]){
      throw new Error(`Invalid \`${key}\` currency`);
    }
  });
}

function convert([,, amount, fromCur, toCur ]) {
  const operationRates = {
    from: rates[fromCur],
    to: rates[toCur]
  };
  validateCurrency(operationRates);
  return String((amount * operationRates.to / operationRates.from).toFixed(2));
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
}


http.createServer((req, res) => {
    setCORS(res);
    const urlParts = req.url.split("/");
    if (req.method === "GET") {
        switch (urlParts[1]) {
            case "convert":
                try {
                    res.end(convert(urlParts));
                } catch (e) {
                    res.statusCode = 401;
                    res.end(e.message);
                }
                break;
            default:
                res.statusCode = 401;
                res.end("bad request");
        }
    } else if (req.method === "POST") {
        let data = []
        req.on('data', chunk => {
            data.push(chunk)
        });
        req.on('end', () => {
            console.log("request data is " + data);
            const reqDataObj = {};
            data.join().split("&").forEach(param => {
                const paramParts = param.split("=");
                reqDataObj[paramParts[0]] = paramParts[1];
            });
            switch (urlParts[1]) {
                case "rates":
                    try {
                        setRates(urlParts, reqDataObj);
                        res.statusCode = 200;
                        res.end("Ok");
                    } catch (e) {
                        res.statusCode = 401;
                        res.end(e.message);
                    }

                    break;
                default:
                    res.statusCode = 401;
                    res.end("bad request");
            }
        });
    } else {
        res.statusCode = 401;
        res.end("bad request");
    }
    console.log(req.url);
}).listen(8080, () => {
  console.log("server is up and running on port 8080");
});
