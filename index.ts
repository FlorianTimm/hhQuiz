import 'ol/ol.css';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { register } from 'ol/proj/proj4';
import { TileWMS as TileWMS } from 'ol/source';
import proj4 from 'proj4';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Point from 'ol/geom/Point';
import { buffer } from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import LineString from 'ol/geom/LineString';
import Circle from 'ol/style/Circle';
import "./import_jquery.js";
import 'jquery-ui-bundle';
import 'jquery-ui-bundle/jquery-ui.css';

proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);

var vector = new VectorSource({ wrapX: false });
var loesung = new VectorSource({ wrapX: false });
var vorschlag = new VectorSource({ wrapX: false });



let layer = [
  new TileLayer({
    visible: false,
    source: new TileWMS({
      url: 'https://geodienste.hamburg.de/HH_WMS_DOP',
      params: {
        'LAYERS': '1',
        'FORMAT': 'image/png'
      },
      attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
    })
  }),
  new TileLayer({
    visible: false,
    source: new TileWMS({
      url: 'https://geodienste.hamburg.de/HH_WMS_ALKIS_Basiskarte?',
      params: {
        'LAYERS': '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,24,26,27,29,30,32,33,35,36',
        'FORMAT': 'image/png'
      },
      attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
    })
  }),
  new VectorLayer({
    source: vector,
    style: new Style({
      fill: new Fill({
        color: '#ffffff'
      }),
      stroke: new Stroke({
        color: '#555555',
        width: 1
      })
    })
  })];

let view1 = new View({
  projection: "EPSG:25832",
  center: fromLonLat([10.0045, 53.4975], "EPSG:25832"),
  zoom: 20
});

var layer2 = [new TileLayer({
  source: new TileWMS({
    url: 'https://geodienste.hamburg.de/HH_WMS_Geobasiskarten?',
    params: {
      'LAYERS': '6,10,18,26,14,2,22,30',
      'FORMAT': 'image/png'
    },
    attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
  })
}),
new VectorLayer({
  source: loesung,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255,150,150,0.5)'
    }),
    stroke: new Stroke({
      color: '#ff0000',
      width: 2
    })
  })
}),
new VectorLayer({
  source: vorschlag,
  style: new Style({
    image: new Circle({
      fill: new Fill({ color: 'rgba(255,150,150,0.5)' }),
      stroke: new Stroke({ color: '#ff0000', width: 2 }),
      radius: 5
    }),
  })
})];

const map1 = new Map({
  target: 'map1',
  layers: layer,
  view: view1,
  controls: [],
  interactions: []
});

let view2 = new View({
  projection: "EPSG:25832",
  center: fromLonLat([10.0045, 53.4975], "EPSG:25832"),
  zoom: 12
});

const map2 = new Map({
  target: 'map2',
  layers: layer2,
  view: view2
});

map2.on('click', (e) => {
  let coord = e.coordinate;
  vorschlag.clear();
  vorschlag.addFeature(new Feature(new Point(coord)));
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/" + nutzer + '?' + coord[0] + '&' + coord[1], true);
  xhttp.send();
})

view2.fit([548365, 5916918, 588010, 5955161]);

var countdown = document.getElementById('countdown');

function submitForm() {
  nutzer = (<HTMLInputElement>document.getElementById('name')).value;
  setInterval(interval, 1000);
  if (nutzer.length > 1) dialog.dialog("close");
  return false;
}

//document.getElementById("form").addEventListener("submit", submitForm);
document.getElementById('name').addEventListener('submit', submitForm);

let nutzer = null;
let dialog = $('#dialog-form').dialog({
  height: 400,
  width: 350,
  modal: true,
  buttons: {
    "Los gehts": submitForm
  }
});

let first = true;

$('#nachricht').hide();

function interval() {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let response = JSON.parse(this.responseText);
      layer.forEach(element => {
        element.setVisible(false);
      });
      layer[response.layer].setVisible(true);
      layer[2].setVisible(true);
      vector.clear();
      let coord = response.coord;
      let box = buffer((new Point(coord)).getExtent(), response.box);
      var inner = fromExtent(box).getLinearRing(0);
      var poly = fromExtent(buffer(box, 2000));
      poly.appendLinearRing(inner);
      vector.addFeature(new Feature(poly));
      view1.fit(box);

      countdown.innerText = response.countdown;

      if (response.countdown < 0) {
        if (!first) return;
        first = false;
        loesung.clear()
        loesung.addFeature(new Feature(fromExtent(box)));
        view2.fit([548365, 5916918, 588010, 5955161]);
        if (vorschlag.getFeatures().length > 0) {
          let p = <Point>vorschlag.getFeatures().pop().getGeometry()
          if (fromExtent(box).intersectsCoordinate(p.getCoordinates())) {
            $('#nachricht').html("Treffer!");
            $('#nachricht').show();

          } else {
            let line = new LineString([fromExtent(box).getClosestPoint(p.getCoordinates()), p.getCoordinates()])
            let fline = new Feature(line);
            fline.setStyle(new Style({
              stroke: new Stroke({ color: '#ff0000', width: 2 }),
              text: new Text({ text: Math.round(line.getLength()) + ' m', placement: 'line' })
            }))
            loesung.addFeature(new Feature(line));
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
        console.log(response)
        let tabR = document.createElement("table");
        let tabT = document.createElement("table");
        let liste = [];
        for (let name in response.vorschlaege) {
          console.log(name);
          if (name != nutzer) {
            let f = new Feature(new Point([response.vorschlaege[name][0], response.vorschlaege[name][1]]));
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
            loesung.addFeature(f);
          }
          liste.push([name, response.vorschlaege[name][2], response.vorschlaege[name][3]]);
        }
        console.log(liste)

        // Letzte Runde
        liste.sort((a, b) => { return a[1] - b[1] });
        for (let e in liste) {

          document.getElementById('runde').innerText = '';
          let tr = document.createElement("tr");
          tabR.appendChild(tr);
          let tdn = document.createElement("td")
          tdn.innerText = liste[e][0];
          let tde = document.createElement("td")
          tde.innerText = liste[e][1] + ' km';
          tde.style.borderLeft = '1px solid black';
          tde.style.textAlign = 'right';
          let tda = document.createElement("td")
          tda.innerText = liste[e][2];
          tda.style.borderLeft = '1px solid black';
          tda.style.textAlign = 'right';
          if (liste[e][2] > 0) tda.style.color = '#3FBF7F'
          else tda.style.color = '#BF3F3F'
          tr.appendChild(tdn);
          tr.appendChild(tde);
          tr.appendChild(tda);
          document.getElementById('runde').appendChild(tabR);
        }


        // Bestenliste
        let bestenliste = [];
        for (let name in response.bestenliste) {
          bestenliste.push([name, response.bestenliste[name]]);
        }
        bestenliste.sort((a, b) => { return b[1] - a[1] });
        for (let e in bestenliste) {

          document.getElementById('teilnehmer').innerText = '';
          let tr = document.createElement("tr");
          tabT.appendChild(tr);
          let tdn = document.createElement("td")
          tdn.innerText = bestenliste[e][0];
          let tde = document.createElement("td")
          tde.innerText = bestenliste[e][1];
          tde.style.borderLeft = '1px solid black';
          tde.style.textAlign = 'right';
          tr.appendChild(tdn);
          tr.appendChild(tde);
          document.getElementById('teilnehmer').appendChild(tabT);
        }
      } else {
        if (first) return;
        first = true;
        $('#nachricht').hide();
        loesung.clear();
        vorschlag.clear();
      }
    }
  };
  xhttp.open("GET", "/" + nutzer, true);
  xhttp.send();

}