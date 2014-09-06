/*
 *  phant-latest.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-09-06
 *
 *  Return the latest record in a Phant stream
 */

"use strict"

var Phant = require('../phant').Phant
var minimist = require('minimist')

var phant = new Phant()

var ad = require('minimist')(process.argv.slice(2), {
});

if (ad._.length != 1) {
    console.log("usage: phant-latest <url|stream-file.json>")
    process.exit(0)
}

var streamd = null
if (ad._[0].match(/^https?:\/\//)) {
    streamd = ad._[0]
} else {
    streamd = phant.load(ad._[0])
}

phant.connect(streamd, function(error, streamd) {
    if (error) {
        console.error("# connect-error", error)
    } else {
        console.warn("+ connected")
        phant.latest(streamd, function(error, rd) {
            if (error) {
                console.error("# latest-error", error, "\n", streamd)
            } else {
                process.stdout.write(JSON.stringify(rd, null, 2) + "\n")
            }
        })
    }
})
