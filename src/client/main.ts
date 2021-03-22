
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import * as io from 'socket.io-client';
import { RightMap } from './RightMap';
import "./import_jquery.js";
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';
import './index.css';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import { fromExtent } from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';

function main() {
  const socket: SocketIOClient.Socket = io();
  let countdown: number = 0;
  let bildUrl = '';
  let prefetch: HTMLImageElement;
  let prefetchUrl = '';

  let setCountdownImages = function (show: string, preload: string, countdown_neu: number) {
    countdown = countdown_neu;
    if (prefetchUrl == show) {
      (<HTMLImageElement>document.getElementById('image')).src = prefetch.src
    } else {
      (<HTMLImageElement>document.getElementById('image')).src = show;
    }
   
    prefetch = new Image()
    prefetch.src = preload;
    prefetchUrl = preload;

    bildUrl = show;
    map.getVorschlag().clear();
    map.getLoesung().clear();
    $('#nachricht').hide();
  }

  $.getJSON("status.json", function (data: { countdown: number, bild: string, naechstes: string }) {
    setCountdownImages(data.bild, data.naechstes, data.countdown);
  });

  let nutzer: string = null;

  let submitForm = function () {
    nutzer = (<HTMLInputElement>document.getElementById('name')).value;
    if (nutzer.length > 1) dialog.dialog("close");
    $('#nachricht').hide();
    socket.emit("neuerNutzer", nutzer)
  }

  document.getElementById('form').addEventListener("submit", (e) => {
    e.preventDefault();
    submitForm()
  })

  let dialog = $('#dialog-form').dialog({
    height: 400,
    width: 350,
    modal: true,
    buttons: {
      "Los gehts": submitForm
    }
  });

  window.addEventListener("beforeunload", () => { socket.emit("Ende", nutzer) })

  let map = new RightMap('map2');
  map.on('click', (e) => {
    if (countdown <= 0) return;

    let coord = e.coordinate;
    map.getVorschlag().clear();
    map.getVorschlag().addFeature(new Feature(new Point(coord)));
    socket.emit('tipp', { 'nutzer': nutzer, bild: bildUrl, coord: coord });
  })

  // Empfang
  socket.on('nachricht', (data: string) => {
    document.getElementById("box").innerHTML += data + '<p />';
  })

  socket.on('countdown', (countdown_new: number) => {
    countdown = countdown_new;
    document.getElementById("countdown").innerHTML = countdown + '<p />';
  })

  socket.on('naechstes', (data: { show: string, preload: string, countdown: number }) => {
    setCountdownImages(data.show, data.preload, data.countdown);
  })

  socket.on('loesung', (data: { loesung: [number, number], box: number, tipps: [string, number, number, [number, number]][], bestenliste: [] }) => {
    map.getLoesung().clear()
    
    let box = fromExtent([data.loesung[0] - data.box, data.loesung[1] - data.box, data.loesung[0] + data.box, data.loesung[1] + data.box])
    map.getLoesung().addFeature(new Feature(box));
    map.getView().fit([548365, 5916918, 588010, 5955161]);
    if (map.getVorschlag().getFeatures().length > 0) {
      let p = <Point>map.getVorschlag().getFeatures().pop().getGeometry()
      if (box.intersectsCoordinate(p.getCoordinates())) {
        $('#nachricht').html("Treffer!");
        $('#nachricht').show();

      } else {
        let line = new LineString([box.getClosestPoint(p.getCoordinates()), p.getCoordinates()])
        let fline = new Feature(line);
        fline.setStyle(new Style({
          stroke: new Stroke({ color: '#ff0000', width: 2 }),
          text: new Text({ text: Math.round(line.getLength()) + ' m', placement: 'line' })
        }))
        map.getLoesung().addFeature(new Feature(line));
        let entf = line.getLength();
        let text = "Nur "
        if (entf > 0.8) {
          text += Math.round(entf / 100) / 10 + ' km'
        } else {
          text += Math.round(entf) + ' m'
        }
        $('#nachricht').html(text + " entfernt!");
        $('#nachricht').show();
      }
    } else {
      $('#nachricht').html("nicht mitgespielt");
      $('#nachricht').show();
    }  

    document.getElementById('runde').innerText = '';
    let tabR = document.createElement("table");
    for (let e in data.tipps) {
      let name = data.tipps[e][0];
      if (name != nutzer) {
        let f = new Feature(new Point([data.tipps[e][3][0], data.tipps[e][3][1]]));
        f.setStyle(new Style({
          image: new Circle({
            fill: new Fill({ color: '#666666' }),
            stroke: new Stroke({ color: '#2222ff', width: 2 }),
            radius: 5
          }),
          text: new Text({
            text: name,
            offsetX: 9,
            offsetY: 0,
            textAlign: 'left'
          })
        }))
        map.getLoesung().addFeature(f);
      }

      let tr = document.createElement("tr");
      if (name == nutzer) tr.style.textDecoration = 'underline';
      tabR.appendChild(tr);
      let tdn = document.createElement("td")
      tdn.innerText = data.tipps[e][0];
      let tde = document.createElement("td")
      tde.innerText = data.tipps[e][1] + ' km';
      tde.style.borderLeft = '1px solid black';
      tde.style.textAlign = 'right';
      let tda = document.createElement("td")
      tda.innerText = String(data.tipps[e][2]);
      tda.style.borderLeft = '1px solid black';
      tda.style.textAlign = 'right';
      if (data.tipps[e][2] > 0) tda.style.color = '#3FBF7F'
      else tda.style.color = '#BF3F3F'
      tr.appendChild(tdn);
      tr.appendChild(tde);
      tr.appendChild(tda);
      document.getElementById('runde').appendChild(tabR);
    }

    // Bestenliste
    document.getElementById('teilnehmer').innerText = '';
    let tabT = document.createElement("table");
    for (let e in data.bestenliste) {
      let tr = document.createElement("tr");
      tabT.appendChild(tr);
      let tdn = document.createElement("td")
      tdn.innerText = String(data.bestenliste[e][0]);
      let tde = document.createElement("td")
      tde.innerText = String(data.bestenliste[e][1]);
      tde.style.borderLeft = '1px solid black';
      tde.style.textAlign = 'right';
      tr.appendChild(tdn);
      tr.appendChild(tde);
      document.getElementById('teilnehmer').appendChild(tabT);
    }
  })

  setInterval(() => {
    countdown--;
    document.getElementById("countdown").innerHTML = countdown + '<p />';
  }, 1000);
}

main();

