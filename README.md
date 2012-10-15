# SlowProxy

A simple Node.js proxy server to simulate slow connections while developing and testing sites

Set delay (in ms) with request headers:

`delay` OR
`min-delay` AND `max-delay`

OR

`process.env.DELAY` OR
`process.env.MIN_DELAY` AND `process.env.MAX_DELAY`