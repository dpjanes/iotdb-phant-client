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
        console.log("+ create-error", error)
    } else {
        phant.add(streamd, {
            a: 1
        }, function(error) {
            if (error) {
                console.log("+ add-error", error)
            } else {
                console.log("+ add ok")
            }
        })
    }
})
