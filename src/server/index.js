const WebSocket = require('uws');
const fs = require('fs');
const { spawn } = require('child_process');
const { FLV, FLVDecoder } = require('./flvdecoder');

const configJson = fs.readFileSync(__dirname + '/../../config.json');
const config = JSON.parse(configJson);
const streamUrl = config.source;

const startRTMP = () => {
  let chunkId = 0;
  let timeStart = new Date().getTime();
  const rtmpdump = spawn('rtmpdump', ['-vr', streamUrl, '-o', '-']);
  rtmpdump.stdout.on('data', (data) => {
    parseStream(data);
    const time = ((new Date().getTime()) - timeStart) / 1000;
    console.log(`[${time}] RTMP got chunk ${chunkId}`);
    chunkId++;

  });

  rtmpdump.stdout.on('error', (error) => {
    console.log(error);
  });

  rtmpdump.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  rtmpdump.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  })
}

const decoder = new FLVDecoder(() => {
  startSocketServer();
});

const startSocketServer = () => {

  let clientId = 0;
  const wss = new WebSocket.Server({ host: '0.0.0.0', port: 9090 });
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
    });

    // send flv header and aac/avc tags
    ws.send(decoder.firstPacket);
    // wait for keyframe
    let waitFirstKeyframe = true;
    let wsClientId = ++clientId;

    // start sending data
    let handler = (tag) => {
      if (tag.avcFrameType == FLV.VIDEO_AVC_KEYFRAME) {
        waitFirstKeyframe = false;
      }

      if (!waitFirstKeyframe) {
        // console.log('ws send frame to c:' + wsClientId);
        ws.send(tag.data, (error) => {
          if (error) {
            decoder.removeListener('frame', handler);
          }
        });
      }
    };

    decoder.on('frame', handler);

  });


}


let lastdata = Buffer.alloc(0);
const parseStream = (data) => {

  // console.log('last:' + lastdata.length + ' new:' + data.length)

  data = Buffer.concat([lastdata, data]);
  let bytesLeft = decoder.parseChunks(data);
  const unprocessedDataStart = data.length - bytesLeft;
  data = data.slice(unprocessedDataStart);
  lastdata = data;
  // console.log('cut ' + bytesLeft);
}


startRTMP();

// const chunk = fs.readFileSync('stream.flv');
// decoder.parseChunks(chunk);
// const stream = fs.createReadStream('stream.flv');
// stream.on('data', parseStream);