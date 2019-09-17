const mqtt = require('mqtt')
const _ = require('lodash')
const logging = require('homeautomation-js-lib/logging.js')
const repeat = require('repeat')
const health = require('homeautomation-js-lib/health.js')
const request = require('request')
const mqtt_helpers = require('homeautomation-js-lib/mqtt_helpers.js')
const queryInterval = 10
const updateTimer = 5
const config = require('./kumojs/kumoConfig.js')
const kumoLib = require('./kumojs/kumojs.js').Kumo
var kumo = null

// Config
const topic_prefix = process.env.TOPIC_PREFIX
const username = process.env.KUMO_USER
const password = process.env.KUMO_PASS



if (_.isNil(username)) {
	logging.warn('KUMO_USER not set, not starting')
	process.abort()
}

if (_.isNil(password)) {
	logging.warn('KUMO_PASS not set, not starting')
	process.abort()
}

if (_.isNil(topic_prefix)) {
	logging.warn('TOPIC_PREFIX not set, not starting')
	process.abort()
}

var mqttOptions = {qos: 1, retain: true}

var shouldRetain = process.env.MQTT_RETAIN

if (_.isNil(shouldRetain)) {
	shouldRetain = true
}

mqttOptions['retain'] = shouldRetain

var connectedEvent = function() {
	health.healthyEvent()

	const topics = [topic_prefix + '/+/+/set']

	logging.info('Connected, subscribing ')
	topics.forEach(function(topic) {
		logging.info(' => Subscribing to: ' + topic)
		client.subscribe(topic, {qos: 1})
	}, this)
}

var disconnectedEvent = function() {
	health.unhealthyEvent()
}

const client = mqtt_helpers.setupClient(connectedEvent, disconnectedEvent)


config.auth(username, password, function(config){
	logging.info('Done auth: ' + JSON.stringify(config))
    
	kumo = new kumoLib(config)
})

client.on('message', (topic, message) => {
	logging.info(' ' + topic + ':' + message, {
		topic: topic,
		value: message
	})
	const components = topic.split('/')
	const room = components[components.length - 3]
	const address = kumo.getAddress(room)

	if (topic.indexOf('/mode/set') >= 0) {
		logging.info('setting mode: ' + message + '   room: ' + room)
		kumo.setMode(address, message.toString())
	} else if (topic.indexOf('/fanspeed/set') >= 0) {
		logging.info('setting fan speed: ' + message + '   room: ' + room)
		kumo.setFanSpeed(address, message.toString())
	} else if (topic.indexOf('/vanedir/set') >= 0) {
		logging.info('setting vent direction: ' + message + '   room: ' + room)
		kumo.setVentDirection(address, message.toString())
	} else if (topic.indexOf('/cool/set') >= 0) {
		logging.info('setting cool: ' + message + '   room: ' + room)
		kumo.setCoolTemp(address, Number(message))
	} else if (topic.indexOf('/heat/set') >= 0) {
		logging.info('setting heat: ' + message + '   room: ' + room)
		kumo.setHeatTemp(address, Number(message))
	} else {
		logging.error(' * unhandled command')
	}
})


const queryKumo = function() {
	if ( _.isNil(kumo) ) {
		return 
	}

	kumo.getRoomList().forEach(roomLabel => {
		const address = kumo.getAddress(roomLabel)
        
		kumo.getStatus(address).then((result) => {
			const status = result.r.indoorUnit.status
			console.log('Room: ' + roomLabel)
			console.log('   Address: ' + address)
			console.log('   Status: ' + JSON.stringify(status))
			Object.keys(status).forEach(key => {
				const topic = mqtt_helpers.generateTopic(topic_prefix, roomLabel, key)
				client.smartPublish(topic, status[key].toString(), mqttOptions)
			})

		})
    
	})

}

const startPoll = function() {
	logging.info('Starting to Kumo: ' + username)
	repeat(queryKumo).every(queryInterval, 's').start.in(1, 'sec')
}

startPoll()
