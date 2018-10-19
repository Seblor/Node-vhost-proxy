const http = require('http'),
  fs = require('fs'),
  httpProxy = require('http-proxy'),
  config = require('./config.json'),
  dns = require('dns');

let vhosts = {};

// First load of the hosts
loadHosts();

// Checking log folder, creates it if it does not exists
if (!fs.existsSync('./logs')) {
  fs.mkdir('./logs', (err) => {
    if (err)
      console.log(err);
  })
}


const PORT = 80;

// Creating the proxy server
var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function (req, res) {

  /**
   * Get port of virtual host
   */
  let host = String(req.headers.host).replace(/^www./, '')
  let port = vhosts[host] || null

  /**
   * vhost does not exists
   */
  if (port === null) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('There is nothing here. Are you sure you should be here ?', () => {
      logRequest(req, res)
    });
    return
  }

  /**
   * Proxy request
   */
  proxy.web(req, res, {
    target: 'http://127.0.0.1:' + port
  });
});

/**
 * Error listener, most likely host unreachable
 */
proxy.on('error', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end(`Could not reach host ${String(req.headers.host)}
The host is most likely down.

Please contact the administrator (${config.contact}).`, () => {
    logRequest(req, res)
  });
});

/**
 * Fires when the proxy hits the end server
 */
proxy.on('proxyRes', function (proxyRes, req, res) {
  logRequest(req, proxyRes)
});

/**
 * Starting the proxy server
 */
server.on('listening', function () {
  console.log('listening on port ' + PORT)
});
server.listen(PORT);

/**
 * Checking vhosts changes (might be triggered twice depending on the OS file system)
 */
fs.watch('./vhosts.json', (eventType, filename) => {
  loadHosts();
})

/**
 * Logs the request to the corresponding host
 * @param {Request} req The HTTP request
 * @param {Response} res The HTTP response
 */
function logRequest(req, res) {

  let url = String(req.headers.host)
  let host = url.replace(/^www./, '')

  if (req.url.startsWith("/")) {
    url += req.url
  } else {
    try {
      req.url += new URL(req.url).pathname
    } catch (error) {
      console.log("error with url:", req.url);
    }
  }

  let clientAddress = req.connection.remoteAddress
  let dateString = new Date().toISOString()

  try {
    dns.lookupService(req.connection.remoteAddress, req.connection.remotePort, (err, hostname) => {
      const log = `${clientAddress} (${hostname}) [${dateString}] "${req.method} ${url} HTTP/${req.httpVersion}" ${res.statusCode}`;
      console.log(log);
      fs.appendFile(`./logs/${host}.log`,
        log + '\n',
        (err) => {
          if (err) console.log(err);
        }
      )
    });
  } catch (error) {
    const log = `${clientAddress} (error) [${dateString}] "${req.method} ${url} HTTP/${req.httpVersion}" ${res.statusCode}`;
    console.log(log);
    fs.appendFile(`./logs/${host}.log`,
      log + '\n',
      (err) => {
        if (err) console.log(err);
      }
    )
  }
}

/**
 * Loads the hosts synchronously
 */
function loadHosts() {
  try {
    vhosts = JSON.parse(fs.readFileSync('./vhosts.json'))
    console.log(`File ./vhosts.json updated`);
  } catch (error) {
    console.log(`File ./vhosts.json is not JSON valid`);
    return;
  }
}