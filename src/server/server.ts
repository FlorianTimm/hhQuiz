const PORT = process.env.PORT || 3000

import * as express from 'express';
import { Server as HTTPServer } from 'http';
import * as path from 'path';
import { Server as SocketServer } from 'socket.io';

const app = express()
const server = new HTTPServer(app)

app.set('port', PORT)

app.use('/dist/client', express.static(path.join(__dirname, '../../dist/client')))

app.get('', (request, response) => {
  response.sendFile(path.join(__dirname, '../../dist/client/index.html'))
})

const io = new SocketServer(server);

io.on('connection', socket => {
  socket.on('nachricht', (data: string) => {
    console.log(data)
    io.emit('nachricht', data);
  })
  socket.on('tipp', (data: { nutzer: string, coord: [number, number] }) => {
    if (counter > 10) counter = 10;
    console.log(data)
  })

  socket.on('neuerNutzer', (nutzer: string) => {
    console.log(nutzer)
  })
  socket.on('Ende', (nutzer: string) => {
    console.log(nutzer)
  })
})

let counter = 0
setInterval(()=>{
  if (counter < -10) {
    counter = 30
  }
  io.emit('countdown', counter--)
}, 1000);

server.listen(PORT, () => {
  console.log(`Starting server on port ${PORT}`)
})
