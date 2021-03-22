import * as io from 'socket.io-client';
import { RightMap } from './RightMap';
import "./import_jquery.js";
import './admin.css';

class Admin {
    private map: RightMap;
    private socket: SocketIOClient.Socket;
    constructor() {
        this.socket = io();
        this.map = new RightMap('map');
        $("#vorschlag").on("click", () => {
            let view = this.map.getView();
            let extent = view.calculateExtent();
            let vorschlag: { box: number; coord: [number, number]; layer: number; } = {
                'box': Math.round((extent[2] - extent[0])/2),
                'coord':[ view.getCenter()[0], view.getCenter()[1]],
                'layer': <number>$('#layer').val()
            };
            console.log(vorschlag)
            this.socket.emit("vorschlag", vorschlag)
        }
        )

        $('#stop').on("click", () => {this.socket.emit("stop")})
        $('#start').on("click", () => {this.socket.emit("start")})
        $('#reset').on("click", () => {this.socket.emit("reset")})
    }
}

new Admin();