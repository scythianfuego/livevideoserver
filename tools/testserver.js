const WebSocket = require('uws');
var NanoTimer = require('nanotimer');
var timer = new NanoTimer();

let data = Buffer.alloc(4096, 0xAB);
const speed = 187500; // bytes per second
const interval = Math.ceil(1000 * 4096 / speed);
console.log('interval ', interval);

const wss = new WebSocket.Server({ host: '0.0.0.0', port: 9090 });

sockets = [];

wss.on('connection', function connection(ws) {

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  sockets.push(ws);

  ws.on('close', () => {
    const index = sockets.indexOf(ws);
    if (index > -1) {
      sockets.splice(index, 1);
    }
  })
});

let count = 0;
let sent = 0;
let msgid = 0;
let uuid = 0;

setInterval(() => {
  msgid++;
  for (let i = 0; i < sockets.length; i++) {
    const socket = sockets[i];
    data.writeUInt32LE(i, 0);
    data.writeUInt32LE(msgid, 4);
    data.writeUInt32LE(uuid, 8);
    uuid++;
    sent += data.length;
    socket.send(data, (error) => {
      if (error) {
          console.log(error);
      }
    });
  }

  count++;
  if (count == 44) {
    console.log('send rate ' + sent * 8 / 1000000 + ' Mbps '
      + ' msgcount=' + count*sockets.length + ' msgid=' + msgid + ' uuid=' + uuid);
    count = 0;
    sent = 0;
  }

}, interval);
