const PORT = process.env.PORT || 3000

import * as express from 'express';
import { Server as HTTPServer } from 'http';
import * as path from 'path';
import { Server as SocketServer } from 'socket.io';
import { KartenQueue } from './KartenQueue';


const INTERVAL = 10000;
class Server {
  private io: SocketServer;
  private server: HTTPServer;
  private app: express.Application;
  private karten_queue: KartenQueue;
  private counter: number = 30;
  private tipps: { [nutzer: string]: { tipp: [number, number], entfernung: number, punkte: number } } = {};
  private bestenliste: { [nutzer: string]: number } = {}
  private interval: NodeJS.Timeout;

  public constructor() {
    this.app = express()
    this.server = new HTTPServer(this.app)
    this.io = new SocketServer(this.server);
    this.karten_queue = new KartenQueue(this.io);
  }

  public async main() {
    this.expressApp();
    await this.socketIO();
  };

  private async socketIO() {
    this.io.on('connection', (socket) => {
      socket.on('nachricht', (data: string) => {
        console.log(data);
        this.io.emit('nachricht', data);
      });
      socket.on('tipp', (data: { nutzer: string; bild: string, coord: [number, number]; }) => {
        // Falsches Bild
        this.tippAbgegeben(data);
      });

      socket.on('neuerNutzer', (nutzer: string) => {
        console.log(nutzer);
      });
      socket.on('Ende', (nutzer: string) => {
        console.log(nutzer);
      });

      socket.on('vorschlag', (data: { box: number; coord: [number, number]; layer: number; }) => {
        this.karten_queue.addVorschlag(data.box, data.coord, data.layer);
      });
    });

    await this.karten_queue.checkQueue();
    this.interval = setInterval(() => { this.intervalTick() }, INTERVAL);
  }

  private intervalTick() {
    this.counter -= 10;

    if (this.counter <= -10) {
      this.naechstesBild();
    } else if (this.counter <= 0) {
      this.aufloesen();
    }
    //this.io.emit('countdown', );
    this.io.emit('countdown', this.counter);
    console.log(this.counter);
  }

  private tippAbgegeben(data: { nutzer: string; bild: string; coord: [number, number]; }) {
    console.log(data);
    if (this.karten_queue.aktuellesBild() != data.bild || this.counter <= 0) return;
    if (this.counter > 10) {
      this.counter = 10;
      clearTimeout(this.interval);
      this.interval = setInterval(() => { this.intervalTick() }, INTERVAL);
      this.io.emit('countdown', this.counter);
    }

    let distance = this.distance(data.coord, this.karten_queue.aktuelleKoord(), this.karten_queue.aktuelleBox());
    this.tipps[data.nutzer] = { tipp: data.coord, entfernung: distance, punkte: 0 };
  }

  private distance(tipp: [number, number], loesung: [number, number], box: number) {
    if (tipp[0] > (loesung[0] - box) && tipp[0] < (loesung[0] + box)) {
      if (tipp[1] > loesung[1] + box)
        return tipp[1] - loesung[1] - box;
      if (tipp[1] < loesung[1] - box)
        return loesung[1] - tipp[1] - box;
      else
        return 0
    } else if (tipp[1] > (loesung[1] - box) && tipp[1] < (loesung[1] + box)) {
      if (tipp[0] > loesung[0] + box)
        return tipp[0] - loesung[0] - box;
      if (tipp[0] < loesung[0] - box)
        return loesung[0] - tipp[0] - box;
      else
        return 0
    }

    return Math.min(this.simple_distance(tipp, [loesung[0] + box, loesung[1] + box]),
      this.simple_distance(tipp, [loesung[0] - box, loesung[1] + box]),
      this.simple_distance(tipp, [loesung[0] - box, loesung[1] - box]),
      this.simple_distance(tipp, [loesung[0] + box, loesung[1] - box])) / 1000;
  }

  private simple_distance(punktA: [number, number], punktB: [number, number]) {
    return Math.round(Math.sqrt(Math.pow((punktB[0] - punktA[0]), 2) + Math.pow((punktB[1] - punktA[1]), 2)));
  }

  private aufloesen() {
    this.stabw2();

    let liste: [string, number, number, [number, number]][] = [];
    for (let name in this.tipps) {
      liste.push([name, this.tipps[name].entfernung, this.tipps[name].punkte, this.tipps[name].tipp]);
    }
    // Letzte Runde
    liste.sort((a, b) => { return a[1] - b[1] });

    let bestenliste: [string, number][] = [];
    for (let name in this.bestenliste) {
      bestenliste.push([name, this.bestenliste[name]]);
    }
    bestenliste.sort((a, b) => { return b[1] - a[1] });

    this.io.emit("loesung", {
      loesung: this.karten_queue.aktuelleKoord(),
      box: this.karten_queue.aktuelleBox(),
      tipps: liste,
      bestenliste: bestenliste
    });
    this.tipps = {};

  }


  private stabw2() {
    let counter = 0;
    let summe = 0;
    for (let name in this.tipps) {
      counter++;
      summe += this.tipps[name].entfernung
    }
    console.log(summe);
    let qsum = 0;
    if (counter > 1) {
      let durchschnitt = summe / counter;
      for (let name in this.tipps) {
        this.tipps[name].punkte = this.tipps[name].entfernung - durchschnitt;
        qsum += Math.pow(this.tipps[name].punkte, 2);
      }

      let stabw = (counter <= 0) ? 0 : Math.sqrt(qsum / counter);
      if (stabw > 0) {
        for (let name in this.tipps) {
          this.tipps[name].punkte = Math.round(-this.tipps[name].punkte / stabw * 100) / 100;
        }
      }
    }
    for (let name in this.tipps) {
      if (this.tipps[name].entfernung < 0.02)
        this.tipps[name].punkte += 1;
      if (name in this.bestenliste && !isNaN(this.bestenliste[name]))
        this.bestenliste[name] = Math.round((this.bestenliste[name] + this.tipps[name].punkte) * 100) / 100;
      else
        this.bestenliste[name] = Math.round(this.tipps[name].punkte * 100) / 100;
    }

  }

  private naechstesBild() {
    this.counter = 30;
    this.karten_queue.nextImage();
    this.io.emit('naechstes', { show: this.karten_queue.aktuellesBild(), preload: this.karten_queue.naechstesBild(), countdown: this.counter });
  }

  private expressApp() {
    this.app.set('port', PORT);

    this.app.use('/dist/client', express.static(path.join(__dirname, '../../dist/client')));

    this.app.get('/now.png', (request, response) => {
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('Content-Type', 'image/png');
      response.sendFile(path.join(__dirname, '../../' + this.karten_queue.aktuellesBild()));
    });

    this.app.use('/images', express.static(path.join(__dirname, '../../images')));

    this.app.get('/status.json', (request, response) => {
      response.json({ countdown: this.counter, bild: this.karten_queue.aktuellesBild(), naechstes: this.karten_queue.naechstesBild() })
    })

    this.app.get('', (request, response) => {
      response.sendFile(path.join(__dirname, '../../dist/client/index.html'));
    });

    this.server.listen(PORT, () => {
      console.log(`Starting server on port ${PORT}`);
    });
  }
};

new Server().main();