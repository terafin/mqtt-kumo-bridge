#!/usr/bin/env node

'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
require('source-map-support').install()
const request = require('request')
const fs = require('fs')
const _ = require('lodash')
const S = 0
const W = '44c73283b498d432ff25f5c8e06a016aef931e68f0a00ea710e36e6338fb22db'

const processcfg = function(acc, j) {
    var mycfg = {}
    let mycl = {}
    for (let children in j) {
        let child = j[children]
        for (let zone in child['zoneTable']) {
            let z = child['zoneTable'][zone]
            let myc = {
                serial: z.serial,
                label: z.label,
                cryptoSerial: z.cryptoSerial,
                cryptoKeySet: z.cryptoKeySet,
                password: z.password,
                address: z.address,
                S: S,
                W: W
            }
            mycl[zone] = myc
        }
        mycfg[acc] = mycl
    }
    return mycfg
}

const post = function(post_data, callback) {
    request.post({
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'accept-Language': 'en-US,en',
            'Content-Length': post_data.length,
            'Content-Type': 'application/json'
        },
        url: 'https://geo-c.kumocloud.com/login',
        body: post_data
    }, function(error, resp, body) {
        if (error != null) {
            console.error('Unable to get config')
            console.error(error)
            if (!_.isNil(callback)) {
                return callback(null)
            }
        }
        try {
            var dt = JSON.parse(body)
            console.log('dt: ' + dt)
            console.log(dt)
            var cfg = processcfg(dt[0]['username'], dt[2]['children'])
            console.log('Downloaded the config file from cloud...')
            console.log(cfg)
            var out = fs.createWriteStream('kumo.cfg')
            out.write('module.exports = \n')
            out.write(JSON.stringify(cfg))
            out.end()
            console.log('Output written to file :./kumo.cfg')
            if (!_.isNil(callback)) {
                return callback(cfg)
            }
        } catch (e) {
            console.error('Unable to get config from returned data')
            console.error(e)
            if (!_.isNil(callback)) {
                return callback(null)
            }
        }
    })
}


exports.auth = function(username, password, callback) {
    let msg = {
        username: username,
        password: password,
        appVersion: '2.2.0'
    }
    var post_data = JSON.stringify(msg)
    post(post_data, callback)

}