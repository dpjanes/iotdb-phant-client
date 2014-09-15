iotdb-phant-client
==================

Node Client for Phant.

## Usage
To connect to [data.sparkfun.com](http://data.sparkfun.com)

    var Phant = require('phant-client')
    var phant = new Phant()

To connect to your own [Phant](http://phant.io/) server:

    var phant = new Phant({ "iri": "http://localhost:8080" })

**IMPORTANT NOTE**

If you are using your own Phant server, you must be
running <code>phant-manager-http</code>. 
Make sure you follow the instructions in the README.md
on this page:

    https://github.com/sparkfun/phant-manager-http

### Creating a new stream
Functions
<code>create()</code> and <code>connect()</code>
will callback with a <code>streamd</code> object
which can be used to do Phant stuff.
You **must** <code>create()</code> or <code>connect()</code> to a Phant
server first: you can't just use a serialized <code>streamd</code>
object.

    phant.create({
        title: "My Awesome Stream",
        description: "The description",
        fields: "a,b,c"
    }, function(error, streamd) {
        if (error) {
            console.log("+ error", error)
        } else {
            console.log(streamd)
        }
    }

### Connecting to an existing stream

Note that if the stream as created on a different Phant server,
it will work exactly as expected. The <code>streamd</code> 
records the location of the server it connected to.

    phant.connect(streamd, function(error, streamd) {
        /* do stuff */
    })

### Connecting to an IRI

If you have a 'streams' IRI, you can connect directly to that
    
    var iri = 'https://data.sparkfun.com/streams/dZ4EVmE8yGCRGx5XRX1W'
    phant.connect(iri, function(error, streamd) {
        /* do stuff */
    })

### Adding a record


    phant.add(streamd, {
        a: 22
    })
    
Phant requires that all fields be present. 
<code>iotdb-phant-client</code> cleverly defaults
these to the empty string.

### Retrieving the latest record
Note that this is entirely independent of the <code>next</code>/<code>reset</code>
functions below.

    phant.latest(streamd, function(error, rd) {
        if (error) {
            console.log("# error", error)
        } else if (rd === null) {
            console.log("+ eof")
        } else {
            console.log("+ got", rd)
        }
    })

### Stepping through stream
The first class to <code>next()</code> will get the first
record and subsequent calls will step through the data.
When no more data is available, <code>null</code> will be
returned to indicate **EOF**. 
If you want to start looping through the records again
from the beginning, call <code>phant.reset(streamd)</code>. 
If you need to loop through records multiple times
simultaneously, use <code>phant.scrub(streamd)</code> to 
return a copy of the stream object.

The sightly complicated nature of this example
is because the code is callback driven.

    var fetcher = function() {
        phant.next(streamd, function(error, rd) {
            if (error) {
                console.log("# error", error)
            } else if (rd === null) {
                console.log("+ eof")
            } else {
                console.log("+ got", rd)
                fetcher()
            }
        })
    }

    fetcher()
    

