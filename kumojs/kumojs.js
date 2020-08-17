'use strict'
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value))
            } catch (e) {
                reject(e)
            }
        }

        function rejected(value) {
            try {
                step(generator['throw'](value))
            } catch (e) {
                reject(e)
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : new P(function(resolve) {
                resolve(result.value)
            }).then(fulfilled, rejected)
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
}
Object.defineProperty(exports, '__esModule', { value: true })
const sjcl = require('sjcl')
const request = require('request')
const base64 = require('base-64')
const _ = require('lodash')
class Kumo {
    constructor(config) {
        this.cfg = config
        this.cfgr = {}
        this.cfga = {}
        for (let acc in config) {
            for (let hash in config[acc]) {
                let e = config[acc][hash]
                this.cfgr[e.label] = e
                this.cfga[e.address] = e
            }
        }
    }
    h2l(dt) {
        var r = []
        for (var i = 0; i < dt.length; i += 2) {
            r.push(parseInt(dt.substr(i, 2), 16))
        }
        return r
    }
    l2h(l) {
        var r = ''
        for (var i = 0; i < l.length; ++i) {
            var c = l[i]
            if (c < 16) {
                r += '0'
            }
            r += Number(c).toString(16)
        }
        return r
    }
    getRoomList() {
        return Object.keys(this.cfgr)
    }
    getAddressList() {
        return Object.keys(this.cfga)
    }
    getAddress(label) {
        if (label in this.cfgr) {
            return this.cfgr[label].address
        } else {
            throw Error('Room ' + label + ' Not Found.')
        }
    }
    cryptokeyFromAddress(dt, address) {
        let cfg = this.cfga[address]
        let W = this.h2l(cfg.W)
        let p = base64.decode(cfg.password)
        let dt1 = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(sjcl.codec.hex.toBits(this.l2h(Array.prototype.map.call(p + dt, function(m2) {
            return m2.charCodeAt(0)
        })))))
        let dt1_l = this.h2l(dt1)
        let dt2 = ''
        for (let i = 0; i < 88; i++) {
            dt2 += '00'
        }
        let dt3 = this.h2l(dt2)
        dt3[64] = 8
        dt3[65] = 64
        Array.prototype.splice.apply(dt3, [32, 32].concat(dt1_l))
        dt3[66] = cfg.S
        let cryptoserial = this.h2l(cfg['cryptoSerial'])
        dt3[79] = cryptoserial[8]
        dt3[80] = cryptoserial[4]
        dt3[81] = cryptoserial[5]
        dt3[82] = cryptoserial[6]
        dt3[83] = cryptoserial[7]
        dt3[84] = cryptoserial[0]
        dt3[85] = cryptoserial[1]
        dt3[86] = cryptoserial[2]
        dt3[87] = cryptoserial[3]
        Array.prototype.splice.apply(dt3, [0, 32].concat(W))
        let hash = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(sjcl.codec.hex.toBits(this.l2h(dt3))))
        return hash
    }
    cmd_(address, pdata) {
        return __awaiter(this, void 0, void 0, function*() {
            return new Promise((resolve, reject) => {
                let url = 'http://' + address + '/api?m=' + this.cryptokeyFromAddress(pdata, address)
                request.put({
                    headers: {
                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    },
                    url: url,
                    body: pdata
                }, function(error, resp, body) {
                    if (error != null) {
                        console.error('Unable to put data')
                        console.error(error)
                        reject(error)
                    }
                    try {
                        var dt = JSON.parse(body)
                        console.error('body: ' + body)

                        const api_error = body._api_error
                        if (!_.isNil(api_error)) {
                            reject(api_error)
                        } else {
                            resolve(dt)
                        }
                    } catch (e) {
                        console.error('Unable to parse result after  put :', body)
                        console.error(e)
                        reject(e)
                    }
                })
            })
        })
    }
    timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    cmd(address, pdata) {
        return __awaiter(this, void 0, void 0, function*() {
            for (let cnt = 0; cnt < 10; ++cnt) {
                try {
                    const dt = yield this.cmd_(address, pdata)
                    return dt
                } catch (e) {
                    console.error('Error when trying to send command ', pdata, ' to ', address)
                    console.error(e)
                    yield this.timeout(5000)
                }
            }
            const dt = yield this.cmd_(address, pdata)
            return dt
        })
    }
    getStatus(address) {
        return __awaiter(this, void 0, void 0, function*() {
            let c = JSON.stringify({ 'c': { 'indoorUnit': { 'status': {} } } })
            return this.cmd(address, c)
        })
    }
    setMode(address, mode) {
        return __awaiter(this, void 0, void 0, function*() {
            if (['off', 'heat', 'cool', 'dry', 'vent', 'auto'].indexOf(mode) < 0) {
                throw new Error('Invalid Mode:' + mode)
            }
            let c = JSON.stringify({ 'c': { 'indoorUnit': { 'status': { 'mode': mode } } } })
            return this.cmd(address, c)
        })
    }
    setFanSpeed(address, speed) {
        return __awaiter(this, void 0, void 0, function*() {
            if (['quiet', 'low', 'powerful', 'auto', 'superPowerful'].indexOf(speed) < 0) {
                throw new TypeError('Invalid Fan Speed:' + speed)
            }
            let c = JSON.stringify({ 'c': { 'indoorUnit': { 'status': { 'fanSpeed': speed } } } })
            return this.cmd(address, c)
        })
    }
    setVentDirection(address, dir) {
        return __awaiter(this, void 0, void 0, function*() {
            if (['auto', 'horizontal', 'midhorizontal', 'midpoint', 'midvertical',
                    'vertical', 'swing'
                ].indexOf(dir) < 0) {
                throw new TypeError('Invalid Direction:' + dir)
            }
            let c = JSON.stringify({ 'c': { 'indoorUnit': { 'status': { 'vaneDir': dir } } } })
            return this.cmd(address, c)
        })
    }
    setCoolTemp(address, tempC) {
        return __awaiter(this, void 0, void 0, function*() {
            let c = JSON.stringify({ 'c': { 'indoorUnit': { 'status': { 'spCool': tempC } } } })
            return this.cmd(address, c)
        })
    }
    setHeatTemp(address, tempC) {
        return __awaiter(this, void 0, void 0, function*() {
            let c = JSON.stringify({ 'c': { 'indoorUnit': { 'status': { 'spHeat': tempC } } } })
            return this.cmd(address, c)
        })
    }
}
exports.Kumo = Kumo