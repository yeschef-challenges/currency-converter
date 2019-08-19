const http = require('http');

const rates = {
    usd: 1
};

function setRates(urlParts, dataObj) {
    try {
        const currencyName = dataObj.currency.toLowerCase();
        if (!rates.hasOwnProperty(`${currencyName}`)) {
            rates[currencyName] = +dataObj.rate;
        }
    } catch (err) {
        throw new Error(err);
    }
}

function convert(requestParams) {
    try {
        const curToConvertRate = rates[requestParams[4]];
        const convertedCurRate = rates[requestParams[3]];
        if (isNaN(curToConvertRate)) {
            return "Invalid `to` currency"
        } else if (isNaN(convertedCurRate)) {
            return "Invalid `from` currency"
        } else {
            const value = requestParams[2];
            const converted = (value*curToConvertRate) / (value*convertedCurRate);
            return (converted * 10).toFixed(2);
        }
    } catch (err) {
        throw new Error(err);
    }
}

http.createServer((req, res) => {
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
