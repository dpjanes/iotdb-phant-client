/*
 *  connect_all.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-09-06
 *
 *  Demonstrate:
 *  - connecting to an existing stream
 *  - downloading all records
 *  - loading a stream record
 */

"use strict"

var Phant = require('../phant').Phant

var phant = new Phant()
var streamd = phant.load(process.argv.length == 2 ? "stream.json" : process.argv[2])

phant.connect(streamd, function(error, streamd) {
    if (error) {
        console.log("# connect-error", error)
    } else {
        console.log("+ connected")
        phant.latest(streamd, function(error, rd) {
            var fetcher = function() {
                phant.next(streamd, function(error, rd) {
                    if (error) {
                        console.log("# next-error", error)
                    } else if (rd === null) {
                        console.log("+ next-eof")
                    } else {
                        console.log("+ next", rd)
                        fetcher()
                    }
                })
            }
            fetcher()
        })
    }
})
