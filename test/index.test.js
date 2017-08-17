process.env.ENCRYPTION_KEY = "foobar"
const chai = require("chai")
const mockery = require("mockery")
const sinon = require("sinon")
const sinonChai = require("sinon-chai")
const expect = chai.expect
let app
const payload = "sW9hHV+BKXrX+oCT5ds24e5R4sMrGH3I60LHXUXjn5Ghd451d3vaylhZp5q0hEv8JoQLsOFxRKgk3t8rwmZfH+wuuNJt/my1"

chai.use(sinonChai)

const mqtt_mock = {
  connect: () => {
    return mqtt_instance
  }
}
let publish_stub = sinon.stub().returns('')

const mqtt_instance = {
  on: () => {
  },
  publish: () => {
  }
}

before(() => {
  mockery.enable()
  mockery.registerAllowables(['../index', 'tweetnacl-util', 'libsodium', 'crypto', 'libsodium-wrappers']);
  mockery.registerMock('mqtt', mqtt_mock);
  app = require("../index")
})

after(() => {
  mockery.disable()
})

describe('str2ab', () => {
  it('returns correct length padded array', () =>
    expect(app.str2ab("foobar")).to.have.lengthOf(32)
  )

  it('returns a Uint8Array', () =>
    expect(app.str2ab("foobar")).is.a('Uint8Array')
  )

  it('encodes a string correctly and pads accordingly', () =>
    expect(Array.from(app.str2ab("foobar"))).to.eql([102, 111, 111, 98, 97, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  )

})

describe('decrypt_message', () =>
  it('decrypts a message correctly', () =>
    expect(app.decrypt_message(payload)).to.eql('{"some": "json", "goes": "here"}')
  )
)

describe('encrypt_message', () => {
  it('should correctly encrypt a decryptable message', () =>
    expect(app.decrypt_message(app.encrypt_message("blahblahblah"))).to.equal("blahblahblah")
  )
})

describe('handle_message', () => {
  let options = {
    qos: 0,
    retain: true,
    dup: true
  }
  let buffered_payload = new Buffer.from(`{"_type": "action", "data": "foo"}`)
  let mocked_client = {
    publish: () => {
    }
  }
  beforeEach(() => {
    sinon.stub(mocked_client, "publish")
    sinon.stub(app, "decrypt_message").returns(["foo"])
    sinon.stub(app, "encrypt_message").returns("some encrypted string")
  })

  afterEach(() => {
      app.decrypt_message.restore()
      mocked_client.publish.restore()
      app.encrypt_message.restore()
    }
  )

  describe('encrypted payload', () => {

    beforeEach(() => {

      app.handle_message(mocked_client, 'mytopic', new Buffer.from(`{"_type": "encrypted", "data": "${payload}"}`), options)
    })

    it('passes the message to the decrypter if its _type:encrypted', () =>
      expect(app.decrypt_message).to.have.been.calledOnce
    )

    it('publishes the message', () =>
      expect(mocked_client.publish).to.have.been.calledOnce
    )

    it('does not call the encrypter', () =>
      expect(app.encrypt_message).to.have.not.been.called
    )

    it('publishes the correct thing', () =>
      expect(mocked_client.publish).to.have.been.calledWith('mytopic', 'foo', options)
    )
  })

  describe('unencrypted payload', () => {

    beforeEach(() => {
      app.handle_message(mocked_client, 'mytopic', buffered_payload, options)
    })

    it('does not call the decrypter if _type !== encrypted', () =>
      expect(app.decrypt_message).to.have.not.been.called
    )

    it('does not call the encrypter', () =>
      expect(app.encrypt_message).to.have.not.been.called
    )

    it('publishes the correct thing', () =>
      expect(mocked_client.publish).to.have.been.calledWith('mytopic', buffered_payload, options)
    )

  })

  describe('unencrypted payload that needs to be encrypted', () => {

    let buffered_payload = new Buffer.from(`{"_type": "action", "data": "foo"}`)

    beforeEach(() => {
      mocked_client.encrypted = true
      app.handle_message(mocked_client, 'mytopic', buffered_payload, options)
    })
    afterEach(() => {
      mocked_client.encrypted = false
    })

    it('does not call the decrypter if _type !== encrypted', () =>
      expect(app.decrypt_message).to.have.not.been.called
    )

    it('calls the encrypter', () =>
      expect(app.encrypt_message).to.have.been.called
    )

    it('publishes the correct thing', () =>
      expect(mocked_client.publish).to.have.been.calledWith('mytopic', '{"_type": "encrypted", "data": "some encrypted string"}', options)
    )

  })

})
