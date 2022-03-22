# Enable Project Fn Functions with Dapr.io

This repo describes how functions created with and for Project Fn can be married to Dapr.io - to leverage some of the Dapr facilities, such as outbound bindings, pub (not so much sub), secrets and state store. 

## Objective
Provide a simple application that demonstrates how Fn functions can be enhanced with the powers of Dapr.io. This includes:
* installing the Dapr runtime into the Function container
* configure some Dapr components
* run Daprd runtime as a "sidecar" (parallel process) alongside the Fn function
* invoke the Dapr Sidecar from Fn function to trigger the components in order to interact with external services

The application is a simple one - not meaningful regarding its functionality. It should make clear what is to be done for connecting an Fn function to Dapr. I have picked Node as the function implementation language. This choice is arbitrary - most of what is done here should work in a similar fashion for other FDKs, such as Java, Python, Go.

## Context


func.yaml
runtime docker

Dockerfile
build stage
install bash Dapr CLI
install Dapr slim
(in addition to node-modules)

function container
copy daprd
set env var for dapr http port
run dapr & node application 

package.json:
start:dapr runs daprd and function in parallel processes; the function knows how to access daprd, daprd does not know about the function
    "scripts": {
        "start":"node func.js" ,
        "start:dapr": "/function/daprd --app-id daprized-function --dapr-http-port $DAPR_HTTP_PORT --components-path ./components/ & npm run start"
    },


issues:
Dapr Node SDK cannot be used ( because of: "ReferenceError: globalThis is not defined - (/function/node_modules/dapr-client/actors/runtime/ActorRuntimeConfig.js:3:20)
Node app cannot be started through Daprd, hence the use of & in dapr:start

Two bindings (in components directory)
HTTP binding to GitHub - http.yaml - used to fetch a JSON document with greeting messages  https://raw.githubusercontent.com/chrisbuttery/greeting/master/greetings.json (note: application does not have to use https)
GraphQL binding to a demonstration API that returns Fruit data - graphql.yaml




fn start  --log-level DEBUG

fn -v build
fn deploy --create-app --app tutorial --local --no-bump
fn invoke tutorial daprized-function

To understand what happens inside the built image, we can turn it into a container and run it. To do so, after the build:
list the image to get one just created:
docker images
get the image id for the image

Create a container from this image:
docker create <image id>
This returns a container id. Using that id we can run the container:

docker start <container id>

Using this next command, we can inspect the logs produced from the container:
docker logs <container id>

And with this command we can look inside the running container:
docker exec -it <container id> /bin/bash

## Application using Dapr

The interaction from the Function (the Node code) with Dapr is implemented in *func.js*. Because of a problem with the Node SDK DaprClient (initialization fails with *ReferenceError: globalThis is not defined*), the calls to the Dapr Sidecar are implemented as HTTP calls to the Dapr HTTP Endpoint. This works fine - but is not as elegant and efficient as using the Node SDK (that can use gRPC communication).

In this sample application, two calls are made to the Dapr Sidecar - one leveraging the HTTP binding component (defined in components/http.yaml) and the other one using the GraphQL binding component (defined in components/graphql.yaml). The call from the Node application consists of a fairly fixed set of elements:
* Dapr Sidecar's HTTP endpoint
* name of the binding component
* (name of) operation  
* metadata for the operation - such as GraphQL query or HTTP path

When the function is first invoked, the container is started based on the image and the daprd daemon is executed, alongside the Node application. The daprd process is the sidecar. It initializes components and listens for incoming HTTP requests - which will only come from the Node application that implements the function. There is the possibility that the dapr sidecar takes longer to initialize and start accepting HTTP requests than it takes the 

## Resources

How to take control over building of the Function container [Creating a Function from a Docker Image](https://fnproject.io/tutorials/ContainerAsFunction/)
How to install Dapr runtime into a custom container[Running Dapr on Azure IoT Edge](https://xaviergeerinck.com/post/2021/4/23/iot-dapr-iot-edge)

[Troubleshooting and Logging with Fn](https://fnproject.io/tutorials/Troubleshooting/)
[Dapr HTTP binding component](https://docs.dapr.io/reference/components-reference/supported-bindings/http/)
[Dapr GraphQL binding component](https://docs.dapr.io/reference/components-reference/supported-bindings/graghql/)
[Fruits GraphQL API](https://fruits-api.netlify.app/graphql)

[Dapr arguments and annotations for daprd, CLI, and Kubernetes](https://docs.dapr.io/reference/arguments-annotations-overview/)
[Install packages in Alpine docker](https://stackoverflow.com/questions/48281323/install-packages-in-alpine-docker)