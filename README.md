#mqtt-encrypted bridge

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
