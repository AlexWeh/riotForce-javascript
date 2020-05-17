# lwc-controller

Here will be some information about the app.

## How to start?
Start building the container with `docker build --tag riotforce .`, then run with `docker run -p 3001:3001 -p 3002:3002--name controller riotForce` -> where :3001 is the web interface and :3002 the api to the controller.

In the `.devcontainer` is also a definition to run in VSCode.

The container should automatically start in dev mode by running `npm run watch`.

The source files are located in the [`src`](./src) folder. All web components are within the [`src/client/modules`](./src/modules) folder. The folder hierarchy also represents the naming structure of the web components. The entry file for the custom Express configuration can be found in the ['src/server'](./src/server) folder.
