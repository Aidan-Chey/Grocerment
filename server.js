#!/usr/bin/env node

const http = require('http'),
  fs = require('fs'),
  port = normalizePort(process.env.PORT || '3000');

var server = http.createServer(router);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Dealing with incoming requests
 */

function router(req, res) {
  let filename = null,
    uri = req.url;

  const public = 'public',
    mimeTypes = {
      'default': 'text/plain',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.svg': 'image/svg+xml',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.js': 'text/javascript',
      '.css': 'text/css'
    };

  if ( !uri.includes('.') ) {  // Page
    filename = (uri === '/' ? public + '/index' : uri) + '.html';
  } else {  // File
    filename = public + uri;
  }

  if ( filename && fs.existsSync(filename) ) {
    console.debug('200: ' + uri);
    extention = filename.substring( filename.lastIndexOf('.') );
    let mimeType = mimeTypes[extention] || mimeTypes['default'];
    res.writeHead(200, {'Content-Type': mimeType});

    let fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
  } else {
    console.debug('404: ' + uri);
    res.writeHead(404);
    res.end('404: Not found.');
  }
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.debug('Listening on ' + bind);
}

