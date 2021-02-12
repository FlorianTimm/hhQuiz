import { InHH } from './InHH';

import * as socketio from "socket.io";
import * as path from "path";
import { Request, Response, Application } from 'express';
import express = require('express');

const app: Application = express();
app.set("port", process.env.PORT || 3000);

let http = require("http").Server(app);
let io = require("socket.io")(http);

app.get("/", (req: any, res: any) => {
    res.sendFile(path.resolve("dist/client/index.html"));
});
var htmlPath = path.resolve("dist/client/")

app.use(express.static(htmlPath));

// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
io.on("connection", function (socket: any) {
    console.log("a user connected");
});

const server = http.listen(3000, function () {
    console.log("listening on *:3000");
});
/*
var minx = 548365;
var maxx = 588010;
var miny = 5916918;
var maxy = 5955161;

var coord, box, layer, added, countdown;
var vorschlaege = {};
var bestenliste = {};
nextBox();

setInterval(() => {
    countdown--
    if (countdown <= -10) {
        nextBox();
    }

}, 1000);

function random_between(min, max) {
    return min + (max - min) * Math.random();
}

function point_random() {
    var x = 0,
        y = 0;
    do {
        x = random_between(minx, maxx);
        y = random_between(miny, maxy);
    } while (!InHH.inside([x, y]))
    return [x, y]
}

function layer_random() {
    return Math.floor(random_between(0.001, 1.999));
}

function box_random() {
    return random_between(25, 1000);
}

createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });


    if (req.url.length <= 1) {
        res.writeHead(302, {
            'Location': 'index.html'
            //add other headers here...
        });
        res.end();
        return
    }




    try {
        if (req.url.indexOf("?") > 0) {
            wert = req.url.substr(req.url.indexOf('?') + 1).split('&');
            if (wert.length == 2) {
                x = parseFloat(wert[0])
                y = parseFloat(wert[1])

                d = Math.round(distance([x, y], coord, box) / 10) / 100
                vorschlaege[req.url.substr(1, req.url.indexOf('?') - 1)] = [x, y, d, 0];
                if (countdown > 10) countdown = 10;
            }
        }
    } catch (e) {
        console.log("komische Werte")
    }


    obj = {
        countdown: countdown,
        layer: layer,
        box: box,
        coord: coord
    }
    if (countdown < 0) {
        obj['vorschlaege'] = vorschlaege;
        if (!added) {
            added = true;
            stabw2(vorschlaege);
        }
    }
    obj['bestenliste'] = bestenliste;
    let re = JSON.stringify(obj)
    console.log(re);
    res.end(re);
}).listen(8080);

function nextBox() {
    coord = point_random();
    layer = layer_random();
    box = box_random();
    vorschlaege = {};
    countdown = 30;
    added = false;
}

function downloadImage(layer, coord, box) {
    const http = require('http'); // or 'https' for https:// URLs
    const fs = require('fs');

    const file = fs.createWriteStream("file.jpg");
    //TODO
    let url = "https://geodienste.hamburg.de/HH_WMS_DOP?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&LAYERS=DOP&WIDTH=1000&HEIGHT=1000&CRS=EPSG%3A25832&STYLES=&BBOX=570498.1159893982%2C5929149.049153199%2C571108.927676753%2C5929759.860840554"
    const request = http.get(url, function (response) {
        response.pipe(file);
    });
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}



function stabw2(vorschlaege) {
    let counter = 0;
    let summe = 0;
    for (let name in vorschlaege) {
        counter++;
        summe += vorschlaege[name][2]
    }
    console.log(summe);
    if (counter <= 1) return
    let durchschnitt = summe / counter;
    let qsum = 0;
    for (let name in vorschlaege) {
        vorschlaege[name][3] = vorschlaege[name][2] - durchschnitt;
        qsum += Math.pow(vorschlaege[name][3], 2);
    }

    let stabw = Math.sqrt(qsum / counter)
    for (let name in vorschlaege) {
        vorschlaege[name][3] = Math.round(-vorschlaege[name][3] / stabw * 100) / 100;
        console.log(vorschlaege)
        if (vorschlaege[name][2] < 0.02)
            vorschlaege[name][3] += 1;
        if (name in bestenliste && !isNaN(bestenliste[name]))
            bestenliste[name] = Math.round((bestenliste[name] + vorschlaege[name][3]) * 100) / 100;
        else
            bestenliste[name] = Math.round(vorschlaege[name][3] * 100) / 100;

    }
}

function distance(v, l, box) {
    if (v[0] > (l[0] - box) && v[0] < (l[0] + box)) {
        if (v[1] > l[1] + box)
            return v[1] - l[1] - box;
        if (v[1] < l[1] - box)
            return l[1] - v[1] - box;
        else
            return 0
    } else if (v[1] > (l[1] - box) && v[1] < (l[1] + box)) {
        if (v[0] > l[0] + box)
            return v[0] - l[0] - box;
        if (v[0] < l[0] - box)
            return l[0] - v[0] - box;
        else
            return 0
    }

    return Math.min(simple_distance(v, [l[0] + box, l[1] + box]),
        simple_distance(v, [l[0] - box, l[1] + box]),
        simple_distance(v, [l[0] - box, l[1] - box]),
        simple_distance(v, [l[0] + box, l[1] - box]));
}

function simple_distance(a, b) {
    return Math.sqrt(Math.pow((b[0] - a[0]), 2) + Math.pow((b[1] - a[1]), 2));
}
*/