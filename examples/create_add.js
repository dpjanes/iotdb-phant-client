/*
 *  create_add.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-09-06
 *
 *  Demonstrate:
 *  - creating a new feed
 *  - adding a record
 *  - save a stream to file
 */

"use strict"

var Phant = require('../phant').Phant

var phant = new Phant({ "iri": "http://localhost:8080" })
var streamd = {
    title: "Test 2",
    description: "Test 1",
    fields: "a,b,c"
}
phant.create(streamd, function(error, streamd) {
    if (error) {
        console.log("# create-error", error)
    } else {
        var add_callback = function(error) {
            if (error) {
                console.log("+ add-error", error)
            } else {
                console.log("+ add ok")
            }
        }

        phant.save("stream.json", streamd)
        phant.add(streamd, { a: 1 }, add_callback)
        phant.add(streamd, { a: 2, b: 1 }, add_callback)
        phant.add(streamd, { a: 3, b: 2, c: "Hello, World\n" }, add_callback)
    }
})
