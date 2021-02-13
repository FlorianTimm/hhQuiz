import { InHH } from "./InHH";

export class BoxCreator {

    private minx = 548365;
    private maxx = 588010;
    private miny = 5916918;
    private maxy = 5955161;

    private random_between(min: number, max: number) {
        return min + (max - min) * Math.random();
    }

    public point_random():[number, number] {
        var x = 0,
            y = 0;
        do {
            x = this.random_between(this.minx, this.maxx);
            y = this.random_between(this.miny, this.maxy);
        } while (!InHH.inside([x, y]))
        return [x, y]
    }

    public layer_random() {
        return Math.floor(this.random_between(0.001, 1.999));
    }

    public box_random() {
        return this.random_between(25, 1000);
    }
}