FROM fnproject/node:dev as build-stage
WORKDIR /function
COPY package.json /function/
RUN npm install
RUN apk update
RUN apk add --no-cache bash
# RUN apk add --no-cache wget
# Install the Dapr CLI
RUN wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash
# Install the latest Dapr Runtime through the CLI, -s is for slim-init
RUN dapr init -s; dapr --version


FROM fnproject/node
WORKDIR /function
# copy contents of build directory to /function
COPY . /function/
# copy contents of node-modules collected in build-stage to the function container
COPY --from=build-stage /function/node_modules/ /function/node_modules/
# copy the daprd main binary to the function container
COPY --from=build-stage /root/.dapr/bin/daprd /function/
# this port can be any available port; it needs to be known to both daprd and the function; the latter uses it to invoke the former
ENV DAPR_HTTP_PORT=3500 
CMD [ "npm", "run", "start:dapr" ]
