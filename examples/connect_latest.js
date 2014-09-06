/*
 *  connect_latest.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-09-06
 *
 *  Demonstrate:
 *  - connecting to an existing stream
 *  - listing the latest object
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
            if (error) {
                console.log("# latest-error", error, "\n", streamd)
            } else {
                console.log("+ latest", rd)
            }
        })
    }
})
