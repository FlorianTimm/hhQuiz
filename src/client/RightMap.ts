import 'ol/ol.css';
import { Map, View } from 'ol';
import { register } from 'ol/proj/proj4';
import { TileWMS as TileWMS } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
import proj4 from 'proj4';
import Tile from 'ol/layer/Tile';

proj4.defs('WGS84')

export class RightMap extends Map {
  private loesung: VectorSource;
  private vorschlag: VectorSource;

  constructor(target: string) {
    super({
      target: target
    })
    this.loesung = new VectorSource({ wrapX: false });
    this.vorschlag = new VectorSource({ wrapX: false });

    proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    register(proj4);

    this.createMap();
  }

  private createMap() {
    this.setView(new View({
      projection: "EPSG:25832",
      center: fromLonLat([10.0045, 53.4975], "EPSG:25832"),
      zoom: 12
    }))
    this.getView().fit([548365, 5916918, 588010, 5955161]);
    this.createLayer();
  }

  private createLayer() {
    let source = new TileWMS({
      url: 'https://geodienste.hamburg.de/HH_WMS_Geobasiskarten?',
      //url: 'https://geodienste.hamburg.de/HH_WMS_Cache?',
      params: {
        'LAYERS': 'M100000_farbig,M60000_farbig,M20000_farbig,M5000_farbig,M40000_farbig,M125000_farbig,M10000_farbig,M2500_farbig',
        //'LAYERS' : 'stadtplan',
        'FORMAT': 'image/png'
      },
      cacheSize: 300,
      attributions: ['Freie und Hansestadt Hamburg, LGV 2019']
    });

    this.addLayer(new Tile({
      source: source
    }));

    this.addLayer(new VectorLayer({
      source: this.loesung,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255,150,150,0.5)'
        }),
        stroke: new Stroke({
          color: '#ff0000',
          width: 2
        })
      })
    }));

    this.addLayer(new VectorLayer({
      source: this.vorschlag,
      style: new Style({
        image: new Circle({
          fill: new Fill({ color: 'rgba(255,150,150,0.5)' }),
          stroke: new Stroke({ color: '#ff0000', width: 2 }),
          radius: 5
        }),
      })
    }));
  }

  public getVorschlag() {
    return this.vorschlag;
  }

  public getLoesung() {
    return this.loesung;
  }
}