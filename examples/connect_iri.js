/*
 *  connect_latest.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-09-06
 *
 *  Demonstrate:
 *  - connecting to an existing stream via IRI
 *  - listing the latest object
 */

"use strict"

var Phant = require('../phant').Phant

var iri = process.argv.length == 2 ? "https://data.sparkfun.com/streams/dZ4EVmE8yGCRGx5XRX1W" : process.argv[2]

var phant = new Phant()
phant.connect(iri, function(error, streamd) {
    if (error) {
        console.log("# connect-error", error)
    } else {
        console.log("+ connected")
        phant.latest(streamd, function(error, rd) {
            if (error) {
                console.log("# latest-error", error, "\n", streamd)
            } else {
                console.log("+ latest", rd)
            }
        })
    }
})
