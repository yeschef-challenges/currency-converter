const http = require('http');

const rates = {
    usd: 1
};

function Exception(message) {
    this.message = message;
}

function setRates(urlParts, dataObj) {
    const currency = dataObj.currency.toLowerCase()
    rates[currency] = parseFloat(dataObj.rate)
}

function convert(requestParams) {
    const amount = parseFloat(requestParams[2])
    const fromCurrency = requestParams[3]
    const toCurrency = requestParams[4]
    if (isNaN(amount)) {
        throw new Exception('Invalid amount')
    } else if (!rates[fromCurrency]) {
        throw new Exception('Invalid `from` currency')
    } else  if (!rates[toCurrency]) {
        throw new Exception('Invalid `to` currency')
    } else {
        return String(Number(amount / rates[fromCurrency] * rates[toCurrency]).toFixed(2))
    }
}

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    const urlParts = req.url.split("/");
    if (req.method === "GET") {
        switch (urlParts[1]) {
            case "convert":
                try {
                    res.end(convert(urlParts));
                } catch (e) {
                    res.statusCode = 400;
                    res.end(e.message);
                }
                break;
            default:
                res.statusCode = 400;
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
}).listen(8080);

console.log("server is up and running on port 8080")
