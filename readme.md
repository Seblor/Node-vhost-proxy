# Virtual Host Node Proxy

This project is a Proof of Concept for a virtual host proxy made in Node.

# Installation guide

_(Note that this project is not to be used in a production environment)_

Clone this repo, and simple run `npm i` to install all the dependencies. Then run the command `npm start` to start the server.

The file `vhosts.json` contains the virtual hosts, it has to be changed.  
The file `config.json` contains de configuration settings. Currently only the contact address is customizable.

# How does it works ?

When the server receives a request, it checks the list of hosts located in the `vhosts.json` file and then redirects the request to the associated port on the local host.

Whenever the `vhosts.json` file is edited the server will automatically reload it.

If the virtual hosts does not exists in the `vhosts.json` file, the server will send a simple message stating that there is nothing corresponding to that host name.

If the virtual host exists in the `vhosts.json` file but is not reachable, the server will print an error message informing the end user that the server he is trying to access is not reachable.

### Further improvements

- Handle HTTPS
- Allow the messages to be customizable
- Add logging customization
