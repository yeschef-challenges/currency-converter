const http = require('http');

const rates = {
    usd: 1
};

function handle400() {
    throw { status: 400, message: 'Bad request'};
}

function handle404(message = 'Invalid params') {
    throw { status: 404, message };
}

function setRates(urlParts, dataObj) {
    if (!dataObj.currency || !dataObj.rate) {
        handle400();
    }
    rates[dataObj.currency.toLowerCase()] = parseFloat(dataObj.rate);
}

function convert(requestParams) {
    if (requestParams.length < 5) {
        handle400();
    }
    let amount = requestParams[2];
    const currencyFrom = requestParams[3];
    const currencyTo = requestParams[4];

    if (isNaN(amount)) {
        handle404('Invalid `amount`');
    }

    amount = parseFloat(amount);
    if (!rates[currencyFrom]) {
        handle404('Invalid `from` currency');
    }
    if (!rates[currencyTo]) {
        handle404('Invalid `to` currency');
    }

    const returnVal = (amount * rates[currencyTo]) / rates[currencyFrom];
    return returnVal.toFixed(2);
}

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    } else {
        const urlParts = req.url.split("/");
        if (req.method === "GET") {
            switch (urlParts[1]) {
                case "convert":
                    try {
                        res.end(convert(urlParts));
                    } catch (e) {
                        res.statusCode = e.status || 500;
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
                            res.statusCode = 500;
                            res.end(e.message);
                        }
                        break;
                    default:
                        res.statusCode = 400;
                        res.end("bad request");
                }
            });
        } else {
            res.statusCode = 400;
            res.end("bad request");
        }
    }
}).listen(8080);

console.log("server is up and running on port 8080")
