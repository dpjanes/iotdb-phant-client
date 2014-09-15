/*
 *  phant.js
 *
 *  David Janes
 *  IOTDB.org
 *  2014-09-05
 *  "The Great Fire of London happened this day in 1666"
 *
 *  Connect to Phant/data.sparkfun.com-type servers
 *
 *  Copyright [2013-2014] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict"

var unirest = require('unirest')
var fs = require('fs')

/**
 *  Connect to a Phant server
 *
 *  @param {object} paramd
 *  @param {String|undefined} paramd.iri
 *  The server to connect to, by default "http://data.sparkfun.com"
 *
 *  @constructor
 */
var Phant = function(paramd) {
    var self = this

    paramd = defaults(paramd, {
        iri: "http://data.sparkfun.com"
    })

    self.iri = paramd.iri
}

/**
 *  Create a new stream
 *
 *  @param {object} paramd
 *  @param {String} paramd.title
 *  @param {String} paramd.description
 *  @param {String} paramd.fields
 *  
 *  @param {Phant~stream_callback} callback
 */
Phant.prototype.create = function(paramd, callback) {
    var self = this

    paramd = defaults(paramd, {
        title: "",
        description: "",
        fields: ""
    })

    unirest
        .post(self.iri + "/streams")
        .headers({ 'Accept': 'application/json' })
        .type('json')
        .send({
            title: paramd.title,
            description: paramd.description,
            fields: paramd.fields
        })
        .end(function(result) {
            if (result.error || !result.body.success) {
                if (result.body && result.body.message) {
                    callback(result.body.message, null)
                } else if (result.error.code) {
                    callback(result.error.code, null)
                } else {
                    console.error("# Phant.create", "unknown error text follows as-is", "\n" + result.body)
                    callback("error creating stream [unknown error]", null)
                }
            } else {
                callback(null, {
                    title: result.body.stream.title,
                    description: result.body.stream.description,
                    fields: result.body.stream.fields,
                    outputUrl: self.iri + '/output/' + result.body.publicKey,
                    inputUrl: self.iri + '/input/' + result.body.publicKey,
                    manageUrl: self.iri + '/streams/' + result.body.publicKey,
                    publicKey: result.body.publicKey,
                    privateKey: result.body.privateKey,
                    deleteKey: result.body.deleteKey
                })
            }

        })
    ;
}

/**
 *  Connect to a stream, via a stream
 *  record or a stream IRI
 *
 *  @param {object|iri} streamd
 *  @param {String|undefined} streamd.publicKey
 *  @param {String|undefined} streamd.privateKey
 *  @param {String|undefined} streamd.deleteKey
 *  If 'streamid' is an IRI string, it
 *  will be assumed to be an management-type URL
 *  e.g. 'https://data.sparkfun.com/streams/dZ4EVmE8yGCRGx5XRX1W'
 *
 *  @param {Phant~stream_callback} callback
 */
Phant.prototype.connect = function(streamd, callback) {
    var self = this

    if (is_iri(streamd)) {
        var parts = streamd.match(/^(.*)\/streams\/([^\/]*)/)
        if (!parts) {
            callback("unrecognized iri format: " + streamd)
            return
        }

        streamd = {
            publicKey: parts[2],
            outputUrl: parts[1] + "/output/" + parts[2],
            inputUrl: parts[1] + "/input/" + parts[2],
            manageUrl: parts[1] + "/streams/" + parts[2]
        }
    } 

    unirest
        .get(streamd.manageUrl)
        .headers({ 
            'Accept': 'application/json',
        })
        .end(function(result) {
            if (result.error || !result.body.success) {
                if (result.body) {
                    callback(result.body.message, null)
                } else if (result.error.code) {
                    callback(result.error.code, null)
                } else {
                    console.error("# Phant.create", "unknown error text follows as-is", "\n" + result.body)
                    callback("error connecting to stream [unknown error]", null)
                }
            } else {
                callback(null, {
                    title: result.body.stream.title,
                    description: result.body.stream.description,
                    fields: result.body.stream.fields,
                    outputUrl: streamd.outputUrl,   // this can be done better
                    inputUrl: streamd.inputUrl,
                    manageUrl: streamd.manageUrl,
                    publicKey: streamd.publicKey,
                    privateKey: streamd.privateKey,
                    deleteKey: streamd.deleteKey
                })
            }
        })
    ;
}

/**
 *  Return the next record from the stream. If this
 *  stream has not been read from it will return the
 *  latest record first.
 *  <p>
 *  WARNING: If the stream is being written to while
 *  this is being used, there's likely some duplicate 
 *  records that will be returned when a refetch 
 *  happens
 *  <p>
 *  This is likely to cache multiple results
 *
 *  @param {object} streamd
 *  As returned by
 *  {@link Phant#connect connect} or
 *  {@link Phant#create create}.
 *
 *  @param {Phant~record_callback} callback
 */
Phant.prototype.next = function(streamd, callback) {
    var self = this

    var offset = 0

    if (streamd.__rds === undefined) {
        streamd.__rds = []
        streamd.__offset = 0
        streamd.__eof = false
    } else if (streamd.__eof) {
        callback(null, null)
        return
    } else if (streamd.__offset < streamd.__rds.length) {
        callback(null, streamd.__rds[streamd.__offset++])
        return
    } else {
        /* need to go deeper into the streamd */
    }

    /*
     *  If we get here we need to fetch a new record
     */
    var iri = streamd.outputUrl + '.json?offset=' + streamd.__offset
    unirest
        .get(iri)
        .headers({ 
            'Accept': 'application/json',
        })
        .end(function(result) {
            if (result.error) {
                if (result.error.code) {
                    callback(result.error.code, null)
                } else if (result.body) {
                    // deceptive: an error is returned for empty streams
                    streamd.__eof = true
                    callback(null, null)
                } else {
                    callback("error reading stream", null)
                }
            } else {
                streamd.__rds.push.apply(streamd.__rds, result.body)
                if (streamd.__offset < streamd.__rds.length) {
                    callback(null, streamd.__rds[streamd.__offset++])
                } else {
                    streamd.__eof = true
                    callback(null, null)
                }
            }
        })
    ;
}

/**
 *  Reset the stream so that "next" will return
 *  the latest record again.
 *  <p>
 *  This is immediate: there is no callback.
 *
 *  @param {object} streamd
 *  As returned by
 *  {@link Phant#connect connect} or
 *  {@link Phant#create create}.
 */
Phant.prototype.reset = function(streamd) {
    var self = this

    streamd.__rds = undefined
}

/**
 *  Return the latest record from the stream.
 *  This is entirely independent of next/reset.
 *  @param {object} streamd
 *  As returned by
 *  {@link Phant#connect connect} or
 *  {@link Phant#create create}.
 *
 *  @param {Phant~record_callback} callback
 */
Phant.prototype.latest = function(streamd, callback) {
    var self = this

    unirest
        .get(streamd.outputUrl + '/latest.json')
        .headers({ 
            'Accept': 'application/json',
        })
        .end(function(result) {
            if (result.error) {
                if (result.error.code) {
                    callback(result.error.code, null)
                } else if (result.body) {
                    // deceptive: an error is returned for empty streams
                    callback(null, null)
                } else {
                    callback("error reading stream", null)
                }
            } else if (result.body) {
                callback(null, result.body[0])
            } else {
                callback(null, null)
            }
        })
    ;
}

/**
 *  Add a record to the stream
 *
 *  @param {object} streamd
 *  As returned by
 *  {@link Phant#connect connect} or
 *  {@link Phant#create create}.
 *
 *  @param {Phant~op_callback|undefined} callback
 */
Phant.prototype.add = function(streamd, rd, callback) {
    var self = this

    for (var fi in streamd.fields) {
        var field = streamd.fields[fi]
        if (rd[field] === undefined) {
            rd[field] = ""
        }
    }
    rd = defaults(rd, {})

    unirest
        .post(streamd.inputUrl)
        .headers({ 
            'Accept': 'application/json',
            'Phant-Private-Key': streamd.privateKey
        })
        .type('json')
        .send(rd)
        .end(function(result) {
            if (!callback) {
            } else if (result.error || !result.body.success) {
                if (result.body) {
                    callback(result.body.message)
                } else if (result.error.code) {
                    callback(result.error.code)
                } else {
                    console.error("# Phant.create", "unknown error text follows as-is", "\n" + result.body)
                    callback("error adding to stream [unknown error]")
                }
            } else {
                callback(null)
            }
        })
    ;
}

/**
 *  Update the metadata of a stream.
 *  <p>
 *  <b>WARNING</b>: may wipe out data?
 *
 *  @param {object} streamd
 *  As returned by
 *  {@link Phant#connect connect} or
 *  {@link Phant#create create}.
 *
 *  @param {object} paramd
 *  @param {String} paramd.title
 *  @param {String} paramd.description
 *  @param {String} paramd.fields
 *  ... and more ...
 *
 *  @param {Phant~op_callback|undefined} callback
 */
Phant.prototype.update = function(streamd, paramd, callback) {
    var self = this

    paramd = defaults(paramd, {
        title: streamd.title,
        description: streamd.description
    })

    // API oddness
    if (paramd.fields)  {
        paramd.field_check = ''
    } else {
        paramd.fields = streamd.fields.join(",")
        paramd.field_check = streamd.fields.join(",")
    }

    unirest
        .post(streamd.manageUrl + '/update/' + streamd.privateKey + '.json')
        .headers({ 
            'Accept': 'application/json',
            'Phant-Private-Key': streamd.privateKey
        })
        .type('json')
        .send(paramd)
        .end(function(result) {
            if (!callback) {
            } else if (result.error || !result.body.success) {
                if (result.body) {
                    callback(result.body.message)
                } else if (result.error.code) {
                    callback(result.error.code)
                } else {
                    console.error("# Phant.create", "unknown error text follows as-is", "\n" + result.body)
                    callback("error updating metadata [unknown error]")
                }
            } else {
                callback(null)
            }
        })
    ;
}

/**
 *  Return a scrubbed version of the streamd.
 *  These can be used for serialization to disk
 *  or for starting an independent input stream.
 *  <p>
 *  A scrubbed streamd can be operated on
 *  if it's the result of a 
 *  {@link Phant#connect connect} or
 *  {@link Phant#create create} callback.
 *  <p>
 *  This is immediate: there is no callback.
 *
 *  @param {object} streamd
 *  As returned by
 *  {@link Phant#connect connect} or
 *  {@link Phant#create create}.
 *
 *  @return {object}
 *  A new streamd
 */
Phant.prototype.scrub = function(streamd) {
    var nd = {}

    for (var key in streamd) {
        if (!key.match(/^__/)) {
            nd[key] = streamd[key]
        }
    }
    
    return nd
}

/**
 *  Helper function to load a stream record
 *  from a file.
 *
 *  @param {String} filename
 *  File to load from
 *
 *  @param {object} streamd
 *  Stream record. You must still should send this to
 *  {@link Phant#connect connect} to use.
 */
Phant.prototype.load = function(filename) {
    return JSON.parse(fs.readFileSync(filename, { encoding: 'utf8' }))
}

/**
 *  Helper function to save a stream record
 *  to a file. The stream record 
 *
 *  @param {String} filename
 *  File to save to 
 *
 *  @param {object} streamd
 *  As returned by
 *  {@link Phant#connect connect} or
 *  {@link Phant#create create}.
 */
Phant.prototype.save = function(filename, streamd) {
    fs.writeFileSync(filename, JSON.stringify(this.scrub(streamd), null, 2) + "\n")
}

/**
 *  Make sure a 'paramd' is properly set up. That is,
 *  that it's a dictionary and if any values in defaultd
 *  are undefined in paramd, they're copied over
 */
var defaults = function(paramd, defaultd) {
    if (paramd === undefined) {
        return defaultd
    }

    for (var key in defaultd) {
        var pvalue = paramd[key]
        if (pvalue === undefined) {
            paramd[key] = defaultd[key]
        }
    }

    return paramd;
}

var is_string = function(value) {
    return typeof value === "string"
}

var is_iri = function(value) {
    if (!is_string(value)) {
        return false
    }

    return value.match(/^https?:\/\//) ? true : false
}

/**
 *  Callback that returns a stream
 *
 *  @param {string} error
 *  If not null, the error.
 *
 *  @param {object|undefined}
 *  An open stream
 *  Ignore if <code>error</code> is present
 *
 *  @callback Phant~stream_callback
 */

/**
 *  Callback that returns a record from a stream
 *
 *  @param {string} error
 *  If not null, the error
 *
 *  @param {object|null|undefined}
 *  If null, this means EOF - no more
 *  records are available. Otherwise
 *  it's a record.
 *  Ignore if <code>error</code> is present
 *
 *  @callback Phant~record_callback
 */

/**
 *  Callback from a operations that have no result
 *
 *  @param {string} error
 *  If null, the operation succeeed. Otherwise 
 *  it's the operation.
 *
 *  @callback Phant~op_callback
 */

exports.Phant = Phant
