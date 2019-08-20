const express = require('express')
const cors = require('cors')
const app = express()
const http = require('http');

app.use(cors());

const rates = {
    usd: 1
};

function setRates(urlParts, dataObj) {
    //todo: store/update a rate
    const { currency, rate } = dataObj; 
    if (isNaN(rate)) {
        throw new Error('rate is not a valid number');
    }
    rates[currency.toLowerCase()] = parseFloat(rate);
    return 'Ok';
}

function convert(requestParams) {
    //todo: convert between two currencies
    if ( requestParams.length !== 5 ) {
        throw new Error('invalid parameters');
    }
    const srcAmount = requestParams[2];
    const srcCurrency = requestParams[3];
    const dstCurrency = requestParams[4];
    
    // param validation
    if (isNaN(srcAmount)) {
        throw new Error('amount is not valid number');
    }
    if (!srcCurrency || !rates[srcCurrency.toLowerCase()]) {
        throw new Error('Invalid `from` currency');
    }
    if (!dstCurrency || !rates[dstCurrency.toLowerCase()]) {
        throw new Error('Invalid `to` currency');
    }

    const dstAmount = (srcAmount * rates[dstCurrency.toLowerCase()] / rates[srcCurrency.toLowerCase()]).toFixed(2);
    return dstAmount;
}

app.use('/', (req, res) => {
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
});

const server = http.createServer(app);
server.listen(8080);

console.log("server is up and running on port 8080")

