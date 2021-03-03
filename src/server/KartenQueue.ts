import { BoxCreator } from "./BoxCreator";
import { layer as layerList } from '../layer';
import request = require("request");
import fs = require("fs");
import { Server as SocketServer } from 'socket.io';

export class KartenQueue {
    private akt_id = 0;
    private queue: { id: number, box: number, coord: [number, number], layer: number, image: string }[] = [];
    private boxCreator: BoxCreator;
    private io: SocketServer;

    public imgPath = './images/'

    public constructor(io: SocketServer) {
        this.io = io;
        try {
            if (fs.existsSync(this.imgPath))
                fs.rmdirSync(this.imgPath, { recursive: true });
            fs.mkdirSync(this.imgPath);
        } catch (error) {

        }

        this.boxCreator = new BoxCreator();
        setInterval(this.checkQueue.bind(this), 2000);
    }

    public async checkQueue() {
        while (this.queue.length <= 2) {
            let layer = this.boxCreator.layer_random();
            let box = this.boxCreator.box_random();
            let coord = this.boxCreator.point_random();
            await this.addVorschlag(box, coord, layer)
        }
    }

    public async addVorschlag(box: number, coord: [number, number], layer: number) {
        let id = this.akt_id++;
        let img = await this.downloadImage(id, box, coord, layer);
        this.queue.push({ id: id, box: box, coord: coord, layer: layer, image: img });
        return id;
    }

    private downloadImage(id: number, box: number, coord: [number, number], layer: number): Promise<string> {
        let url = layerList[layer] + "&WIDTH=1000&HEIGHT=1000&CRS=EPSG%3A25832&BBOX=";
        url += (coord[0] - box) + ',' + (coord[1] - box) + ',' + (coord[0] + box) + ',' + (coord[1] + box);
        let path = this.imgPath + 'bild' + id + '.png';
        //console.log(url);
        return new Promise(function (resolve, reject) {
            try {
                request(url)
                    .pipe(fs.createWriteStream(path)
                        .on('close', () => {
                            resolve(path);
                        }));
            } catch (e) {
                reject();
            }
        });

    }

    public nextImage() {
        let deleteImg = this.queue[0].image;
        fs.unlink(deleteImg, () => { })
        return this.queue.shift();
    }

    public naechstesBild(): string {
        return this.queue[1].image;
    }

    public aktuellesBild(): string {
        return this.queue[0].image;
    }

    public aktuelleBox(): number {
        return this.queue[0].box;
    }

    public aktuelleKoord(): [number, number] {
        return this.queue[0].coord;
    }
}