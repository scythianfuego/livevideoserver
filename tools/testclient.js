#!/usr/bin/node

const WebSocket = require('uws');
if (!process.argv[2]) {
    console.log('usage: wstest <connections> <host>');
}

let count = process.argv[2] ? parseInt(process.argv[2], 10) : 10;
let host = process.argv[3] ? process.argv[3] : 'localhost:9090';
let currentConnections = 0;
console.log(`Host: ${host} conn max: ${count}`);

let sockets = [];
let callcount = 0;
let opened = 0;
let rate = 0;
let lastrate = 0;
let msgcount = 0;

let stats = {};
let lastdate = Date.now()
let lastuuid = 0;

while (currentConnections < count) {
    currentConnections++;
    const ws = new
    WebSocket(`ws://${host}`);
    sockets.push(ws);

    ws.on('open', function open() {
        opened++;
    });

    ws.on('message', function incoming(data) {
      let buf = Buffer.from(data);
      let connid = buf.readUInt32LE(0);
      let seqid = buf.readUInt32LE(4);
      let uuid = buf.readUInt32LE(8);
      lastuuid = uuid;

      if (stats[connid] && stats[connid] !== seqid - 1) {
        // console.log(`connid ${connid} ${stats[connid]} != seqid ${seqid - 1}`);
      }
      // console.log(`connid ${connid} ${stats[connid]} == seqid ${seqid - 1}`);
      stats[connid] = seqid;

      if (connid == 0 && seqid % 44 === 0) {
        printstats();
        // console.log(stats[connid]);
        lastdate = Date.now();
      }



      rate += buf.length;
      msgcount++;
    });
}


const printstats = () => {
  console.log('connections: ' + currentConnections + '/'
    + opened + ' rate: ' + rate * 8 / 1000000 + ' Mbps, msgcnt=' +
  msgcount + ' msgid=' + stats[sockets.length-1]
  + ' uuid=' + lastuuid, (Date.now() - lastdate).toString());
  rate = 0;
  msgcount = 0;
};


setInterval(() => {
  printstats();
  lastdate = Date.now();
}, 1000);