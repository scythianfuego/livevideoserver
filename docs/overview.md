# Project overview

## Goals

The main goal of this project is to build a simple and modern system of live video stream delivery from specified source to browser using actual technology and providing some fallback for "non-standard" browsers (IOS Safari).
Second o


## Guidelines:

**What is part of this project:**
- Tasks: content delivery, statistics and playback
- Delivery: websockets, playback: Media Source Extensions
- Video restreaming server with minimum introduced delay possible. It should definitely exceed HLS or DASH.
- Streams should have ability to be synchronized between clients, video delay should be controlled.
- Lightweight MSE video player, buffering and video delay should be controlled.
- Custom stream control protocol with channels, time sync, realtime statistics and, possibly, adaptive bitrate
- Using ready-made solutions for side jobs (ex. uws as the most efficient websocket implementation available, nginx-rtmp etc)
- Being efficient and scalable (ex. internal stream transmuxing instead of spawning multiple ffmpeg processes)

**What is not part of this project**
- Non-live streaming (there should be no user controls on video player except volume bar), keeps player lightweight.
- IE11 support and non-mainstream browsers
- Creating own websocket library/HLS/RTMP server etc.
- Creating own input format converters (use ffmpeg)
- Supporting exotic codecs (use h264/h265/vp9+aac/mp3 when possible)
- Creating HTTP caching solutions (use nginx or varnish)

Server is supposed to be written in typescript/nodejs (because of uws) and have decent test coverage. Avoid unnecesary memory copy/usage on distribution. Events (bus) or rx.js for communication.


## How restreaming works

There are three main type of video frames :
- Confuguration frames (headers) are used to set decoder parameters and resolution,
- I frames or key frames behave like instant images snapshots, h264 encoded vidoe can be started from special type of I frame - IDR frame. h264 key frames are usually IDR
- P and B frames contain predicted movement

When a client connects to a live stream, server sends decoder configuration and starts streaming from the next I frame

![restreaming diagram](./restreaming.png?raw=true)

## Current state

RTMP is a stream control protocol on top of FLV video container. RTMP allows to select streams, provides time synchronization and bandwidth control. FLV is one of the simplest video containers. FLV stream contains used codecs information (h264 avc video/aac or mp3 audio are the most common) as well as raw video and audio frames.

Both formats are open with specifications available from Adobe website:
- RMTP http://wwwimages.adobe.com/content/dam/Adobe/en/devnet/rtmp/pdf/rtmp_specification_1.0.pdf
- FLV http://download.macromedia.com/f4v/video_file_format_spec_v10_1.pdf


RTMP streams are converted to FLV live stream using rtmpdump utility. FLV decoder processes frames and pipes them to uws. When client is connected it gets stream headers and receives frames starting to next I frame. Clients are processes one by one.
FLV frames are converted to ISO BMFF and played clientside using FLV.js

### Current architecture
![current architecture](./arch_current.png?raw=true)

## Targets
- ISO BMFF conversion moved clientside
- Clients are grouped into uws broadcast group according to the data they should get. New clients are moved to one of the groups after receiving headers.
- Video is wrapped by custom protocol. Should have minimal overhead on actual video frames.
- Custom player is made clientside, providing feeedback for stream control, server changes groups/channels for slower players (adaptive streaming)
- Statistics displayed realtime: who is watching what, connection speed, delays (min/max/avg)
- ISO BMFF converted to HLS chunks and served via http module
- (?) additional delivery format - webrtc

### Target architecture
![architecture](./architecture.png?raw=true)

## Useful information

See [links.md](./links.md) for a subset of links, clarifying video concepts.