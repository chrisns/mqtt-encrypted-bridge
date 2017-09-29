#mqtt-encrypted bridge

[![Greenkeeper badge](https://badges.greenkeeper.io/chrisns/mqtt-encrypted-bridge.svg)](https://greenkeeper.io/)

Designed to work with owntracks

Intention is with this that you can use a free public mqtt service such as [cloudmqtt](http://cloudmqtt.com) to let owntracks log to, but without revealing your actual location to that public service, then run a private behind a firewall mqtt cluster that you don't need to expose to the world that will get the locations unencrypted in to.

Intended to run with docker:

```
docker run -d \
  -e ENC_HOST=mqtts://XXX.cloudmqtt.com:YYYY \
  -e ENC_USER=dummy \
  -e ENC_PASS=dummypass \
  -e SUBSCRIBE='#' \
  -e UENC_HOST=mqtt://local \
  -e UENC_USER=mylocaluser \
  -e UENC_PASS=mylocalpass \
  -e CLIENT_ID=myclient \
  -e ENCRYPTION_KEY=foobar \
  chrisns/mqtt-encrypted-bridge
```

Or use the docker compose stack supplied to deploy to a swarm

```
  ENC_HOST=mqtts://XXX.cloudmqtt.com:YYYY \
  ENC_USER=dummy \
  ENC_PASS=dummypass \
  SUBSCRIBE='#' \
  UENC_HOST=mqtt://local \
  UENC_USER=mylocaluser \
  UENC_PASS=mylocalpass \
  CLIENT_ID=myclient \
  ENCRYPTION_KEY=foobar \
  docker stack deploy -c docker-compose.yml mqtt-encrypted-bridge
```

There is a http server on port `3000`, it'll return `200` if both connections are connected, otherwise `503`.

There is a bidirectional sync, where it'll take things published to the unencrypted mqtt, encrypt them and publish to the encrypted endpoint. However right now that ends up in an endless loop and I've not fixed it yet. This would allow you to send commands and such to the end device.

PRs welcome ;)