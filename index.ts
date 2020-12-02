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
import Draw from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import LineString from 'ol/geom/LineString';
import Circle from 'ol/style/Circle';

proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);

var vector = new VectorSource({ wrapX: false });
var loesung = new VectorSource({ wrapX: false });
var vorschlag = new VectorSource({ wrapX: false });



let layer = [
  new TileLayer({
    visible: false,
    source: new TileWMS({
      url: 'http://geodienste.hamburg.de/HH_WMS_DOP',
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

let draw = new Draw({
  source: vorschlag,
  type: GeometryType.POINT,
});
map2.addInteraction(draw);

draw.on('drawend',

  () => {
    if (vorschlag.getFeatures().length < 1) return;
    let ps = vorschlag.getFeatures();
    let p = (<Point>ps.pop().getGeometry()).getCoordinates();
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/" + nutzer + '?' + p[0] + '&' + p[1], true);
    xhttp.send();
  }

)

view2.fit([548365, 5916918, 588010, 5955161]);

var countdown = document.createElement('div');
document.body.appendChild(countdown);
countdown.style.position = 'absolute';
countdown.style.top = '50px';
countdown.style.left = '0';
countdown.style.width = '50%';
countdown.style.textAlign = 'center';
countdown.style.fontFamily = 'Arial sans-serif';
countdown.style.fontSize = '30pt';
countdown.style.textShadow = '0px 0px 10px red';

let nutzer = window.prompt("Nutzername:");

let first = true;

setInterval(() => {
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
          if (fromExtent(box).intersectsCoordinate(p.getCoordinates()))
            alert("Treffer!");
          else {
            let line = new LineString([fromExtent(box).getClosestPoint(p.getCoordinates()), p.getCoordinates()])
            let fline = new Feature(line);
            fline.setStyle(new Style({
              stroke: new Stroke({ color: '#ff0000', width: 2 }),
              text: new Text({ text: Math.round(line.getLength()) + ' m', placement: 'line' })
            }))
            loesung.addFeature(new Feature(line));
            alert(line.getLength())
          }
        } else {
          alert("nicht mitgemacht")
        }
        console.log(response)
        for (let name in response.vorschlaege) {
          console.log(name);
          let f = new Feature(new Point(response.vorschlaege[name]));
          f.setStyle(new Style({
            image: new Circle({
              fill: new Fill({ color: '#666666' }),
              stroke: new Stroke({ color: '#222222', width: 2 }),,
              radius: 5
            })
          }))
          loesung.addFeature(f);
        }
      } else {
        if (first) return;
        first = true;
        loesung.clear();
        vorschlag.clear();
      }
    }
  };
  xhttp.open("GET", "/" + nutzer, true);
  xhttp.send();

}, 1000);