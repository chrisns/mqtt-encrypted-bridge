const mqtt = require("mqtt")
const util = require('tweetnacl-util')
const sodium = require('libsodium-wrappers');

const {ENC_HOST, ENC_USER, ENC_PASS, UENC_HOST, UENC_USER, UENC_PASS, SUBSCRIBE, CLIENT_ID, ENCRYPTION_KEY, BI_DIRECTIONAL} = process.env

const encrypted_client_endpoint = mqtt.connect(ENC_HOST, {
  username: ENC_USER,
  password: ENC_PASS,
  clean: false,
  clientId: CLIENT_ID
})

const unecrypted_client_endpoint = mqtt.connect(UENC_HOST, {
  username: UENC_USER,
  password: UENC_PASS,
  clean: false,
  clientId: CLIENT_ID
})

const handle_message = (publish_to, topic, message, packet) => {
  try {
    let json_payload = JSON.parse(message.toString())
    if (json_payload._type === "encrypted") {
      message = module.exports.decrypt_message(json_payload.data).toString()
    }
    else if (publish_to.encrypted) {
      message = `{"_type": "encrypted", "data": "${module.exports.encrypt_message(message)}"}`
    }
  }
  catch (e) {
    console.error(e)
  }
  return publish_to.publish(topic, message, {
    qos: packet.qos,
    retain: packet.retain,
    dup: packet.dup
  })
}

const str2ab = str => {
  const bufView = new Uint8Array(32);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

const decrypt_message = (message) => {
  let secret = module.exports.str2ab(ENCRYPTION_KEY)
  message = util.decodeBase64(message)
  let encryptedBuffer = Buffer.from(message);
  let nonce = encryptedBuffer.slice(0, sodium.crypto_box_NONCEBYTES);
  let encryptedMessage = encryptedBuffer.slice(sodium.crypto_box_NONCEBYTES);
  return sodium.crypto_secretbox_open_easy(encryptedMessage, nonce, secret, 'text');
}

const encrypt_message = (message) => {
  const secret = module.exports.str2ab(ENCRYPTION_KEY)
  const nonce = Buffer.from(sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES));
  const buf = Buffer.from(message);
  return util.encodeBase64(Buffer.concat([nonce, Buffer.from(sodium.crypto_secretbox_easy(buf, nonce, secret))]));
}

module.exports = {
  encrypt_message: encrypt_message,
  decrypt_message: decrypt_message,
  handle_message: handle_message,
  str2ab: str2ab
}

encrypted_client_endpoint.on('connect', () => encrypted_client_endpoint.subscribe(SUBSCRIBE))

encrypted_client_endpoint.on('connect', () => console.log("encrypted connection connected"))
unecrypted_client_endpoint.on('connect', () => console.log("unencrypted connection connected"))

encrypted_client_endpoint.on('error', (error) => console.error(error))
unecrypted_client_endpoint.on('error', (error) => console.error(error))

encrypted_client_endpoint.on('close', () => console.error("encrypted connection close"))
unecrypted_client_endpoint.on('close', () => console.error("unencrypted connection close"))

encrypted_client_endpoint.on('offline', () => console.log("encrypted connection offline"))
unecrypted_client_endpoint.on('offline', () => console.log("unencrypted connection offline"))

encrypted_client_endpoint.on('message', (topic, message, packet) => handle_message(unecrypted_client_endpoint, topic, message, packet))

if (BI_DIRECTIONAL) {
  console.log("BI directional sync enabled")
  encrypted_client_endpoint.encrypted = true;
  unecrypted_client_endpoint.on('connect', () => unecrypted_client_endpoint.subscribe(SUBSCRIBE))

  unecrypted_client_endpoint.on('message', (topic, message, packet) => handle_message(encrypted_client_endpoint, topic, message, packet))
}

const http = require('http');

const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  if (encrypted_client_endpoint.connected === false || unecrypted_client_endpoint.connected) {
    res.statusCode = 503
  }
  res.end(JSON.stringify({
    unecrypted_client_endpoint: unecrypted_client_endpoint.connected,
    encrypted_client_endpoint: encrypted_client_endpoint.connected
  }));
});

server.listen(3000);