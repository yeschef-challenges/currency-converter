const http = require('http');

const rates = {
    usd: 1
};

function setRates(urlParts, dataObj) {
    rates[dataObj.currency.toLowerCase()] = +dataObj.rate;
}

function convert(requestParams) {
    //todo: convert between two currencies
    const amount = +requestParams[2];
    const from = requestParams[3];
    const to = requestParams[4];

    console.log(amount, rates[from], rates[to]);

    return rates[from] ? (amount / rates[from] * rates[to]).toFixed(2) : 'Invalid `from` currency';
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
}).listen(8080);

console.log("server is up and running on port 8080")
