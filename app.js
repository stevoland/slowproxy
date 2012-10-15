var http = require('http'),
	util = require('util');


function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}

function getDelay(request) {
	var delay;
	
	if (typeof request.headers['min-delay'] !== 'undefined' &&
		typeof request.headers['max-delay'] !== 'undefined') {
		delay = getRandom(request.headers['min-delay'], request.headers['max-delay']);
	} else if (typeof request.headers.delay !== 'undefined') {
		delay = request.headers.delay;
	} else if (typeof process.env.MIN_DELAY !== 'undefined' &&
				typeof process.env.MAX_DELAY !== 'undefined') {
		delay = getRandom(process.env.MIN_DELAY, process.env.MAX_DELAY);
	} else if (typeof process.env.DELAY !== 'undefined') {
		delay = process.env.DELAY;
	} else {
		delay = 3000;
	}

	return delay;
}

http.createServer(function (request, response) {
	var delay = getDelay(request),
		start = +(new Date()),
		proxy = http.createClient(80, request.headers.host),
		proxy_request = proxy.request(request.method, request.url, request.headers);

	//deal with errors, timeout, con refused, ...
	proxy.on('error', function(err) {
		util.log(err.toString() + " resource ("+request.url+") is not accessible on host \""+request.headers.host+"\"");
	});

	proxy_request.addListener('response', function (proxy_response) {
		var buffer = [],
			length = 0;

		delete proxy_response.headers['transfer-encoding'];

		proxy_response.addListener('data', function (chunk) {
			buffer.push(chunk);
			length += chunk.length;
		});


		proxy_response.addListener('end', function() {
			delay = Math.max(delay - (new Date() - start), 0),

			setTimeout(function () {
				proxy_response.headers['Content-length'] = length;
				response.writeHead(proxy_response.statusCode, proxy_response.headers);
				proxy_response.headers['content-length'] = length; //cancel transfer encoding "chunked"
				response.writeHead(proxy_response.statusCode, proxy_response.headers);

				for (var i=0, l=buffer.length; i<l; i++) {
					response.write(buffer[i], 'binary');
				}

				response.end();
			}, delay);
		});
	});

	//proxies to SEND request to real server
	request.addListener('data', function (chunk) {
		proxy_request.write(chunk, 'binary');
	});

	request.addListener('end', function () {
		proxy_request.end();
	});

}).listen(process.env.VMC_APP_PORT || 1337);