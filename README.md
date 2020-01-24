# mqtt-kumo-bridge

This is a simple docker container that I use to bridge to/from my MQTT bridge.

I have a collection of bridges, and the general format of these begins with these environment variables:
```
      TOPIC_PREFIX: /your_topic_prefix  (eg: /some_topic_prefix/somthing)
      MQTT_HOST: YOUR_MQTT_URL (eg: mqtt://mqtt.yourdomain.net)
      (OPTIONAL) MQTT_USER: YOUR_MQTT_USERNAME
      (OPTIONAL) MQTT_PASS: YOUR_MQTT_PASSWORD
````

For changing states '/set' commands also work, eg:

publish this to change "loft" to cool mode (you'll notice this works for all the published attributes)
```
   topic: /kumo/loft/set 
   value: cool
```

Here's an example docker compose:

```
version: '3.3'
services:
  mqtt-kumo-bridge:
    image: terafin/mqtt-kumo-bridge:latest
    environment:
      LOGGING_NAME: mqtt-kumo-bridge
      TZ: America/Los_Angeles
      TOPIC_PREFIX: /your_topic_prefix  (eg: /kumo)

      KUMO_USER: YOUR_KUMO_USERNAME
      KUMO_PASS: YOUR_KUMO_PASSWORD

      MQTT_HOST: YOUR_MQTT_URL (eg: mqtt://mqtt.yourdomain.net)
      (OPTIONAL) MQTT_USER: YOUR_MQTT_USERNAME
      (OPTIONAL) MQTT_PASS: YOUR_MQTT_PASSWORD
```

Here's an example publish for my setup: 


```
/kumo/loft/roomtemp 17
/kumo/loft/mode cool
/kumo/loft/spcool 20
/kumo/loft/spheat 17
/kumo/loft/vanedir auto
/kumo/loft/fanspeed auto
/kumo/loft/tempsource unset
/kumo/loft/activethermistor unset
/kumo/loft/filterdirty false
/kumo/loft/hotadjust false
/kumo/loft/defrost false
/kumo/loft/standby false
/kumo/loft/runtest 0
```
