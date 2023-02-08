import { Area } from "./area";
import { Board } from "./board";
import { BoardModification } from "./board_modification";
import { SENSIBILITY } from "./graph";
import { Link } from "./link";
import { Representation } from "./representations/representation";
import { Stroke } from "./stroke";
import { TextZone } from "./text_zone";
import { Vertex } from "./vertex";

export class HistBoard<V extends Vertex,L extends Link, S extends Stroke, A extends Area, T extends TextZone, R extends Representation> extends Board<V,L,S,A,T,R> {
    modifications_stack: Array<BoardModification<V,L,S,A,T,R>> = new Array();
    modifications_canceled: Array<BoardModification<V,L,S,A,T,R>> = new Array();

    constructor() {
        super();
    }

    append_modification_already_implemented(modif: BoardModification<V,L,S,A,T,R>){
        this.modifications_stack.push(modif);
        this.modifications_canceled.length = 0;
    }

    try_push_new_modification(modif: BoardModification<V,L,S,A,T,R>): Set<SENSIBILITY> | string{
        const r = modif.try_implement(this);
        if ( typeof r === "string"){
            console.log("ERROR: try to implement but failed: " , r);
        }else {
            this.modifications_stack.push(modif);
            this.modifications_canceled.length = 0;
        }
        return r;
    }

    cancel_last_modification(): BoardModification<V,L,S,A,T,R> | string{
        if (this.modifications_stack.length > 0) {
            const last_modif = this.modifications_stack.pop();
            const s = last_modif.deimplement(this);
            this.modifications_canceled.push(last_modif);
            return last_modif;
        } else {
            return "no modification in stack";
        }
    }

    redo(): BoardModification<V,L,S,A,T,R> | string {
        if (this.modifications_canceled.length > 0) {
            const modif = this.modifications_canceled.pop();
            const r = modif.try_implement(this);
            if ( typeof r === "string"){
                console.log("ERROR: try to implement but failed: " , r);
            }else {
                this.modifications_stack.push(modif);
            }
            return modif;
        }
        return "REMARK: no canceled modifcation to redo";
    }
    
}