const fdk = require('@fnproject/fdk');
// do not use Dapr Node SDK because of: "ReferenceError: globalThis is not defined - (/function/node_modules/dapr-client/actors/runtime/ActorRuntimeConfig.js:3:20
// const DaprClient = require("dapr-client").DaprClient;
// const CommunicationProtocolEnum = require("dapr-client").CommunicationProtocolEnum;

const http = require('http')
const url = require('url')

const daprHost = "127.0.0.1";
const daprPort = process.env.DAPR_HTTP_PORT;

const daprizedCall = function (bindingName, bindingData) {

    const options = {
        hostname: `${daprHost}`,
        port: `${daprPort}`,
        path: `/v1.0/bindings/${bindingName}`,
        method: 'POST',
        timeout: 500,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(bindingData).length
        }
    };

    return new Promise((resolve, reject) => {
        console.log(`make call with options ${JSON.stringify(options)}`)
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data)
            });

        }).on("error", (err) => {
            console.log("Error: ", err.message);
            reject(err)
        })
        req.write(JSON.stringify(bindingData));
        req.end();
    });
}

async function getGreeting() {
    const greetingOutputBinding = "greetings"
    const path = "/chrisbuttery/greeting/master/greetings.json"
    const data = {
        "operation": "get",
        "metadata": {
            "path": path
        }
    }
    let greetingData = await daprizedCall(greetingOutputBinding,data) 
    let greetingsArray = JSON.parse(`{ "data" : ${greetingData} }`).data
    let randomGreetingIndex = Math.floor(Math.random() * greetingsArray.length)
    return greetingsArray[randomGreetingIndex]       
}

async function getFruit() {
    const fruitsBinding = "fruits.graphql"
    const fruitsQuery = `query filterFruit {
        filterFruitsFam(family: "Rosaceae") {
           id
           tree_name
           fruit_name
           family
         }
       }`
    const data = {
        "operation": "query",
        "metadata": {
            "query": fruitsQuery
        }
    }
    const fruitsData = await daprizedCall(fruitsBinding,data) 
    const fruitArray = JSON.parse(fruitsData).filterFruitsFam
    let randomFruitIndex = Math.floor(Math.random() * fruitArray.length)
    
    return fruitArray[randomFruitIndex]
}

fdk.handle(async function (input) {
    let name = 'World';
    if (input.name) {
        name = input.name;
    }
    // TODO pararellize these calls
    let greeting = await getGreeting()
    let fruit = await getFruit()
    return {
        'message': 'Hello ' + greeting + " " + name
        , "eat some fruit": fruit
    }
})

