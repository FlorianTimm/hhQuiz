
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import * as io from 'socket.io-client';
import { RightMap } from './RightMap';
import "./import_jquery.js";
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';
import './style.css';
import { count } from 'console';

function main() {
  const socket: SocketIOClient.Socket = io();
  const textbox = <HTMLInputElement>document.getElementById("textbox")
  let countdown: number;

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

  let map = new RightMap();
  map.on('click', (e) => {
    if (countdown <= 0) return;

    let coord = e.coordinate;
    map.getVorschlag().clear();
    map.getVorschlag().addFeature(new Feature(new Point(coord)));
    socket.emit('tipp', { 'nutzer': nutzer, coord: coord });
  })

  // Empfang
  socket.on('nachricht', (data: string) => {
    document.getElementById("box").innerHTML += data + '<p />';
  })

  socket.on('countdown', (countdown_new: number) => {
    document.getElementById("countdown").innerHTML = countdown_new + '<p />';
    countdown = countdown_new;
  })

}

main();

