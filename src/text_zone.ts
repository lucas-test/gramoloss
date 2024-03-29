import { Coord } from "./coord";

export class TextZone {
    pos: Coord;
    width: number;
    text: string;
    index: number;

    constructor(pos: Coord, width: number, text: string, index: number){
        this.pos = pos.copy();
        this.width = width;
        this.text = text;
        this.index = index;
    }

    getValue(param: string): any{
        if (param == "width"){
            return this.width;
        }
        if (param == "text"){
            return this.text;
        }
        return undefined;
    }
}