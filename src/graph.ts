
import { Link, ORIENTATION } from './link';
import { Vertex } from './vertex';

import { Coord, middle, Vect } from './coord';
import { Stroke } from './stroke';
import { Area } from './area';
import { AddArea, AddLink, AddStroke, AddVertex, AreaMoveCorner, AreaMoveSide, DeleteElements, ELEMENT_TYPE, GraphPaste, Modification, TranslateAreas, TranslateControlPoints, TranslateStrokes, TranslateVertices, UpdateColors, UpdateSeveralVertexPos, UpdateWeight, VerticesMerge } from './modifications';
import { eqSet } from './utils';


export enum SENSIBILITY {
    GEOMETRIC = "GEOMETRIC", // Move of vertex/link
    COLOR = "COLOR", // Change of color for vertices/links
    ELEMENT = "ELEMENT", // Create/delete vertex/link
    WEIGHT = "WEIGHT"
}




export class Graph<V extends Vertex,L extends Link, S extends Stroke, A extends Area> {
    vertices: Map<number, V>;
    links: Map<number, L>;
    strokes: Map<number, S>;
    areas: Map<number, A>;
    modifications_heap: Array<Modification> = new Array();
    modifications_undoed: Array<Modification> = new Array();


    constructor() {
        this.vertices = new Map();
        this.links = new Map();
        this.strokes = new Map();
        this.areas = new Map();
    }

    // create an Graph<V,L,S,A> which is undirected from a list of edges
    // vertex_default and edge_default are constructors of V and L
    static from_list_default<V extends Vertex,L extends Link, S extends Stroke, A extends Area>(l: Array<[number,number, string]>, vertex_default: ()=> V, edge_default: (x: number, y: number, weight: string) => L ): Graph<V,L,S,A>{
        const g = new Graph<V,L,S,A>();
        const indices = new Set<number>();
        for ( const [x,y,w] of l.values()){
            if (indices.has(x) == false){
                indices.add(x);
                g.set_vertex(x,vertex_default());
            }
            if (indices.has(y) == false){
                indices.add(y);
                g.set_vertex(y,vertex_default());
            }
            const link = edge_default(x,y,w);
            g.add_link(link);
        }
        return g;
    }

    // create an Undirected Graph from a list of edges represented by couples of number
    // weight is set to ""
    static from_list(l: Array<[number,number]>): Graph<Vertex,Link,Stroke,Area>{
        const l2 = new Array();
        for (const [x,y] of l){
            l2.push([x,y,""]);
        }
        const g = Graph.from_list_default(l2, Vertex.default, Link.default_edge );
        return g;
    }

    // create a Weighted Undirected Graph from a list of weighted edges represented by couples of number with the weight in third
    static from_weighted_list(l: Array<[number,number,string]>): Graph<Vertex,Link,Stroke,Area>{
        const g = Graph.from_list_default(l, Vertex.default, Link.default_edge );
        return g;
    }
	
     static directed_from_list(l: Array<[number,number]>): Graph<Vertex,Link,Stroke,Area>{
        const g = Graph.directed_from_list_default(l, Vertex.default, Link.default_arc );
        return g;
    }

    static directed_from_list_default<V extends Vertex,L extends Link, S extends Stroke, A extends Area>(l: Array<[number,number]>, vertex_default: ()=> V, arc_default: (x: number, y: number, weight: string) => L ): Graph<V,L,S,A>{
        const g = new Graph<V,L,S,A>();
        const indices = new Set<number>();
        for ( const [x,y] of l.values()){
            if (indices.has(x) == false){
                indices.add(x);
                g.set_vertex(x,vertex_default());
            }
            if (indices.has(y) == false){
                indices.add(y);
                g.set_vertex(y,vertex_default());
            }
            const link = arc_default(x,y,"");
            g.add_link(link);
        }

        
        return g;
    }

    add_modification(modif: Modification) {
        //console.log("add_mofication");
        const length = this.modifications_heap.length;
        if (length > 0) {
            const last_modif = this.modifications_heap[length - 1];
            if (last_modif.constructor == TranslateVertices && modif.constructor == TranslateVertices) {
                if (eqSet((<TranslateVertices>modif).indices, (<TranslateVertices>last_modif).indices)) {
                    this.modifications_heap.pop();
                    (<TranslateVertices>modif).shift.translate((<TranslateVertices>last_modif).shift);
                }
            }
            if (last_modif.constructor == TranslateControlPoints && modif.constructor == TranslateControlPoints) {
                if (eqSet((<TranslateControlPoints>modif).indices, (<TranslateControlPoints>last_modif).indices)) {
                    this.modifications_heap.pop();
                    (<TranslateControlPoints>modif).shift.translate((<TranslateControlPoints>last_modif).shift);
                }
            }
        }



        this.modifications_heap.push(modif);
        //console.log(this.modifications_heap);
    }

    try_implement_modification(modif: Modification): Set<SENSIBILITY> {
        switch (modif.constructor) {
            case AddVertex: {
                this.set_vertex((<AddVertex<V>>modif).index, (<AddVertex<V>>modif).vertex);
                this.add_modification(modif);
                return new Set([SENSIBILITY.ELEMENT]);
            }
            case AddLink: {
                this.set_link((<AddLink<L>>modif).index, (<AddLink<L>>modif).link)
                this.add_modification(modif);
                return new Set([SENSIBILITY.ELEMENT]);
            }
            case UpdateWeight: {
                this.update_element_weight((<UpdateWeight>modif).element_type,(<UpdateWeight>modif).index , (<UpdateWeight>modif).new_weight);
                this.add_modification(modif);
                return new Set([SENSIBILITY.WEIGHT]);
            }
            case TranslateVertices: {
                this.translate_vertices((<TranslateVertices>modif).indices, (<TranslateVertices>modif).shift);
                this.add_modification(modif);
                return new Set([SENSIBILITY.GEOMETRIC]);
            }
            case TranslateControlPoints: {
                for (const index of (<TranslateControlPoints>modif).indices) {
                    if (this.links.has(index)) {
                        const link = this.links.get(index);
                        link.cp.translate((<TranslateControlPoints>modif).shift);
                    }
                }
                this.add_modification(modif);
                return new Set([SENSIBILITY.GEOMETRIC]);
            }
            case TranslateStrokes: {
                for (const index of (<TranslateStrokes>modif).indices) {
                    if (this.strokes.has(index)) {
                        const stroke = this.strokes.get(index);
                        stroke.translate((<TranslateStrokes>modif).shift);
                    }
                }
                this.add_modification(modif);
                return new Set([]);
            }
            case TranslateAreas: {
                this.translate_areas((<TranslateAreas>modif).indices, (<TranslateAreas>modif).shift)
                this.add_modification(modif);
                return new Set([SENSIBILITY.GEOMETRIC]);
            }
            case UpdateColors: {
                for (const color_modif of (<UpdateColors>modif).data) {
                    switch (color_modif.type) {
                        case "vertex":
                            if (this.vertices.has(color_modif.index)) {
                                this.vertices.get(color_modif.index).color = color_modif.new_color;
                            }
                            break;
                        case "link":
                            if (this.links.has(color_modif.index)) {
                                this.links.get(color_modif.index).color = color_modif.new_color;
                            }
                            break;
                        case "stroke":
                            if (this.strokes.has(color_modif.index)) {
                                this.strokes.get(color_modif.index).color = color_modif.new_color;
                            }
                            break;
                    }
                }
                this.add_modification(modif);
                return new Set([SENSIBILITY.COLOR]);
            }
            case AddStroke: {
                this.strokes.set((<AddStroke<S>>modif).index, (<AddStroke<S>>modif).stroke);
                this.add_modification(modif);
                return new Set([]);
            }
            case AddArea: {
                this.areas.set((<AddArea<A>>modif).index, (<AddArea<A>>modif).area);
                this.add_modification(modif);
                return new Set([]);
            }
            case AreaMoveSide: {
                const area = this.areas.get((<AreaMoveSide>modif).index);
                area.c1 = (<AreaMoveSide>modif).new_c1;
                area.c2 = (<AreaMoveSide>modif).new_c2;
                this.add_modification(modif);
                return new Set([]);
            }
            case AreaMoveCorner: {
                const area = this.areas.get((<AreaMoveCorner>modif).index);
                area.c1 = (<AreaMoveCorner>modif).new_c1;
                area.c2 = (<AreaMoveCorner>modif).new_c2;
                this.add_modification(modif);
                return new Set([]);
            }
            case DeleteElements: {
                for (const index of (<DeleteElements<V,L,S,A>>modif).vertices.keys()) {
                    this.delete_vertex(index);
                }
                for (const index of (<DeleteElements<V,L,S,A>>modif).links.keys()) {
                    this.delete_link(index);
                }
                for (const index of (<DeleteElements<V,L,S,A>>modif).strokes.keys()) {
                    this.delete_stroke(index);
                }
                for (const index of (<DeleteElements<V,L,S,A>>modif).areas.keys()) {
                    this.delete_area(index);
                }
                this.add_modification(modif);
                return new Set([SENSIBILITY.ELEMENT, SENSIBILITY.COLOR, SENSIBILITY.GEOMETRIC, SENSIBILITY.WEIGHT])
            }
            case VerticesMerge: {
                const modifc =  <VerticesMerge<V,L>>modif;
                const v_fixed = this.vertices.get(modifc.index_vertex_fixed);

                for (const link_index of modifc.deleted_links.keys()){
                    this.links.delete(link_index);
                }
                for (const link_index of modifc.modified_links_indices.values()){
                    if (this.links.has(link_index)){
                        const link = this.links.get(link_index);
                        if ( link.start_vertex == modifc.index_vertex_to_remove){
                            link.start_vertex = modifc.index_vertex_fixed;
                            const fixed_end = this.vertices.get(link.end_vertex);
                            link.transform_cp(v_fixed.pos, modifc.vertex_to_remove.pos, fixed_end.pos);
                        } else if ( link.end_vertex == modifc.index_vertex_to_remove){
                            link.end_vertex = modifc.index_vertex_fixed;
                            const fixed_end = this.vertices.get(link.start_vertex);
                            link.transform_cp(v_fixed.pos, modifc.vertex_to_remove.pos, fixed_end.pos);
                        }
                    }
                }

                this.delete_vertex(modifc.index_vertex_to_remove);
                this.add_modification(modif);
                return new Set([SENSIBILITY.ELEMENT, SENSIBILITY.COLOR, SENSIBILITY.GEOMETRIC, SENSIBILITY.WEIGHT])
            }
            case GraphPaste: {
                for ( const [vertex_index, vertex] of (<GraphPaste<V,L>>modif).added_vertices.entries()){
                    this.vertices.set(vertex_index, vertex);
                }
                for ( const [link_index, link] of (<GraphPaste<V,L>>modif).added_links.entries()){
                    this.links.set(link_index, link);
                }
                this.add_modification(modif);
                return new Set([SENSIBILITY.ELEMENT]);
            }
        }
        console.log("try_implement_modififcation: no method found for ", modif.constructor);
        return new Set([]);
    }

    try_implement_new_modification(modif: Modification): Set<SENSIBILITY> {
        const sensibilities = this.try_implement_modification(modif);
        this.modifications_undoed.length = 0;
        return sensibilities;
    }

    reverse_last_modification(): Set<SENSIBILITY> {
        if (this.modifications_heap.length > 0) {
            const last_modif = this.modifications_heap.pop();
            switch (last_modif.constructor) {
                case AddVertex:
                    this.delete_vertex((<AddVertex<V>>last_modif).index);
                    this.modifications_undoed.push(last_modif);
                    return new Set([SENSIBILITY.ELEMENT]);
                case AddLink:
                    this.delete_link((<AddLink<L>>last_modif).index);
                    this.modifications_undoed.push(last_modif);
                    return new Set([SENSIBILITY.ELEMENT]);
                case UpdateWeight:
                    this.update_element_weight((<UpdateWeight>last_modif).element_type,(<UpdateWeight>last_modif).index , (<UpdateWeight>last_modif).previous_weight);
                    this.modifications_undoed.push(last_modif);
                    return new Set([SENSIBILITY.WEIGHT]);
                case UpdateSeveralVertexPos:
                    const previous_positions = (<UpdateSeveralVertexPos>last_modif).previous_positions;
                    for (const [vertex_index, previous_pos] of previous_positions.entries()) {
                        this.update_vertex_pos(vertex_index, previous_pos);
                    }
                    this.modifications_undoed.push(last_modif);
                    return new Set([SENSIBILITY.GEOMETRIC]);
                case TranslateVertices:
                    this.translate_vertices((<TranslateVertices>last_modif).indices, (<TranslateVertices>last_modif).shift.opposite());
                    this.modifications_undoed.push(last_modif);
                    return new Set([SENSIBILITY.GEOMETRIC]);
                case TranslateAreas:
                    this.translate_areas((<TranslateAreas>last_modif).indices, (<TranslateAreas>last_modif).shift.opposite());
                    this.modifications_undoed.push(last_modif);
                    return new Set([SENSIBILITY.GEOMETRIC]);
                case TranslateControlPoints:
                    for (const index of (<TranslateControlPoints>last_modif).indices) {
                        if (this.links.has(index)) {
                            const link = this.links.get(index);
                            link.cp.rtranslate((<TranslateControlPoints>last_modif).shift);
                        }
                    }
                    this.modifications_undoed.push(last_modif);
                    return new Set([SENSIBILITY.GEOMETRIC]);
                case TranslateStrokes:
                    for (const index of (<TranslateControlPoints>last_modif).indices) {
                        if (this.strokes.has(index)) {
                            const stroke = this.strokes.get(index);
                            stroke.rtranslate((<TranslateControlPoints>last_modif).shift);
                        }
                    }
                    this.modifications_undoed.push(last_modif);
                    return new Set([]);
                case UpdateColors:
                    for (const color_modif of (<UpdateColors>last_modif).data) {
                        switch (color_modif.type) {
                            case "vertex":
                                if (this.vertices.has(color_modif.index)) {
                                    this.vertices.get(color_modif.index).color = color_modif.previous_color;
                                }
                                break;
                            case "link":
                                if (this.links.has(color_modif.index)) {
                                    this.links.get(color_modif.index).color = color_modif.previous_color;
                                }
                                break;
                            case "stroke":
                                if (this.strokes.has(color_modif.index)) {
                                    this.strokes.get(color_modif.index).color = color_modif.previous_color;
                                }
                                break;
                        }
                        this.modifications_undoed.push(last_modif);
                        return new Set([SENSIBILITY.COLOR]);
                    }
                case AddStroke:
                    this.delete_stroke((<AddStroke<S>>last_modif).index);
                    this.modifications_undoed.push(last_modif);
                    return new Set([]);
                case AddArea:
                    this.delete_area((<AddArea<A>>last_modif).index);
                    this.modifications_undoed.push(last_modif);
                    return new Set([]);
                case AreaMoveSide:
                    const area = this.areas.get((<AreaMoveSide>last_modif).index);
                    area.c1 = (<AreaMoveSide>last_modif).previous_c1;
                    area.c2 = (<AreaMoveSide>last_modif).previous_c2;
                    this.modifications_undoed.push(last_modif);
                    return new Set([]);
                case AreaMoveCorner: {
                    const area = this.areas.get((<AreaMoveCorner>last_modif).index);
                    area.c1 = (<AreaMoveCorner>last_modif).previous_c1;
                    area.c2 = (<AreaMoveCorner>last_modif).previous_c2;
                    this.modifications_undoed.push(last_modif);
                    return new Set([]);
                }
                case DeleteElements: {
                    for (const [index, vertex] of (<DeleteElements<V,L,S,A>>last_modif).vertices.entries()) {
                        this.vertices.set(index, vertex);
                    }
                    for (const [index, link] of (<DeleteElements<V,L,S,A>>last_modif).links.entries()) {
                        this.links.set(index, link);
                    }
                    for (const [index, stroke] of (<DeleteElements<V,L,S,A>>last_modif).strokes.entries()) {
                        this.strokes.set(index, stroke);
                    }
                    for (const [index, area] of (<DeleteElements<V,L,S,A>>last_modif).areas.entries()) {
                        this.areas.set(index, area);
                    }
                    this.modifications_undoed.push(last_modif);
                    return new Set([]);
                }
                case VerticesMerge: {
                    const vertices_merge_modif = last_modif as VerticesMerge<V,L>;
                    const v_fixed = this.vertices.get(vertices_merge_modif.index_vertex_fixed);

                    this.vertices.set(vertices_merge_modif.index_vertex_to_remove, vertices_merge_modif.vertex_to_remove);
                    for (const [link_index, link] of vertices_merge_modif.deleted_links.entries()) {
                        this.links.set(link_index, link);
                    }
                    for (const link_index of vertices_merge_modif.modified_links_indices.values()) {
                        if ( this.links.has(link_index)){
                            const link = this.links.get(link_index);
                            if (link.start_vertex == vertices_merge_modif.index_vertex_fixed){
                                link.start_vertex = vertices_merge_modif.index_vertex_to_remove;
                                const fixed_end = this.vertices.get(link.end_vertex);
                                link.transform_cp(vertices_merge_modif.vertex_to_remove.pos, v_fixed.pos, fixed_end.pos);
                            } else if (link.end_vertex == vertices_merge_modif.index_vertex_fixed ){
                                link.end_vertex = vertices_merge_modif.index_vertex_to_remove;
                                const fixed_end = this.vertices.get(link.start_vertex);
                                link.transform_cp(vertices_merge_modif.vertex_to_remove.pos, v_fixed.pos, fixed_end.pos);
                            }
                        }
                    }

                    this.modifications_undoed.push(last_modif);
                    return new Set([]);
                }
                case GraphPaste: {
                    for ( const vertex_index of (<GraphPaste<V,L>>last_modif).added_vertices.keys()){
                        this.vertices.delete(vertex_index);
                    }
                    for ( const link_index of (<GraphPaste<V,L>>last_modif).added_links.keys()){
                        this.links.delete(link_index);
                    }
                    this.modifications_undoed.push(last_modif);
                    return new Set([SENSIBILITY.ELEMENT]);
                }

            }
            console.log("reverse_modification: no method found for ", last_modif.constructor);
            return new Set([]);
        } else {
            return new Set([]);
        }
    }

    redo(): Set<SENSIBILITY> {
        if (this.modifications_undoed.length > 0) {
            const modif = this.modifications_undoed.pop();
            return this.try_implement_modification(modif);
        }
        return new Set();
    }

    update_element_weight(element_type: ELEMENT_TYPE, index: number, new_weight: string){
        if ( element_type == ELEMENT_TYPE.LINK && this.links.has(index)){
            this.links.get(index).weight = new_weight;
        }else if ( element_type == ELEMENT_TYPE.VERTEX && this.vertices.has(index)){
            this.vertices.get(index).weight = new_weight;
        }
    }


    update_vertex_pos(vertex_index: number, new_pos: Coord) {
        this.vertices.get(vertex_index).pos = new_pos;
    }

    update_control_point(link_index: number, new_pos: Coord) {
        this.links.get(link_index).cp = new_pos;
    }


    get_next_available_index() {
        let index = 0;
        while (this.vertices.has(index)) {
            index += 1;
        }
        return index;
    }

    get_next_n_available_vertex_indices(n: number): Array<number> {
        let index = 0;
        const indices = new Array<number>();
        while (indices.length < n) {
            if (this.vertices.has(index) == false) {
                indices.push(index);
            }
            index += 1;
        }
        return indices;
    }

    get_next_available_index_links() {
        let index = 0;
        while (this.links.has(index)) {
            index += 1;
        }
        return index;
    }

    get_next_n_available_link_indices(n: number): Array<number> {
        let index = 0;
        const indices = new Array<number>();
        while (indices.length < n) {
            if (this.links.has(index) == false) {
                indices.push(index);
            }
            index += 1;
        }
        return indices;
    }

    get_next_available_index_strokes() {
        let index = 0;
        while (this.strokes.has(index)) {
            index += 1;
        }
        return index;
    }

    get_next_available_index_area() {
        let index = 0;
        while (this.areas.has(index)) {
            index += 1;
        }
        return index;
    }


    get_index(v: Vertex) {
        for (let [index, vertex] of this.vertices.entries()) {
            if (vertex === v) {
                return index;
            }
        }
        return;
    }



    add_vertex(vertex: V) {
        let index = this.get_next_available_index();
        this.vertices.set(index, vertex);
        return index;
    }

    set_vertex(index: number, vertex: V) {
        this.vertices.set(index, vertex );
    }

    check_link(link: L): boolean {
        const i = link.start_vertex;
        const j = link.end_vertex;
        const orientation = link.orientation;
        // do not add link if it is a loop (NO LOOP)
        if (i == j) {
            return false;
        }

        // do not add link if it was already existing (NO MULTIEDGE)
        for (const link of this.links.values()) {
            if (link.orientation == orientation) {
                if (orientation == ORIENTATION.UNDIRECTED) {
                    if ((link.start_vertex == i && link.end_vertex == j) || (link.start_vertex == j && link.end_vertex == i)) {
                        return false;
                    }
                }
                else if (orientation == ORIENTATION.DIRECTED) {
                    if (link.start_vertex == i && link.end_vertex == j) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    add_link(link: L) {
        if (this.check_link(link) == false) {
            return;
        }
        const index = this.get_next_available_index_links();
        this.links.set(index, link);
        return index;
    }

    set_link(link_index: number, link: L) {
        if (this.check_link(link) == false) {
            return;
        }
        this.links.set(link_index, link);
    }




/*
    add_stroke(positions_data: any, color: string, width: number, top_left_data: any, bot_right_data: any) {
        // console.log(positions_data, old_pos_data, color, width, top_left_data, bot_right_data);
        const index = this.get_next_available_index_strokes();
        const positions = [];
        positions_data.forEach(e => {
            // console.log(e);
            positions.push(new Coord(e[1].x, e[1].y));
        });
        const top_left = new Coord(top_left_data.x, top_left_data.y);
        const bot_right = new Coord(bot_right_data.x, bot_right_data.y);

        this.strokes.set(index, new Stroke(positions, color, width, top_left, bot_right));
    }
*/


    get_neighbors_list(i: number) {
        let neighbors = new Array<number>();
        for (let e of this.links.values()) {
            if (e.orientation == ORIENTATION.UNDIRECTED) {
                if (e.start_vertex == i) {
                    neighbors.push(e.end_vertex);
                } else if (e.end_vertex == i) {
                    neighbors.push(e.start_vertex);
                }
            }
        }
        return neighbors;
    }

    get_neighbors_list_excluding_links(i: number, excluded: Set<number>): Array<number> {
        const neighbors = new Array<number>();
        for (const [link_index, link] of this.links.entries()) {
            if (excluded.has(link_index) == false && link.orientation == ORIENTATION.UNDIRECTED) {
                if (link.start_vertex == i) {
                    neighbors.push(link.end_vertex);
                } else if (link.end_vertex == i) {
                    neighbors.push(link.start_vertex);
                }
            }
        }
        return neighbors;
    }

    get_out_neighbors_list(i: number) {
        let neighbors = new Array<number>();
        for (let e of this.links.values()) {
            if (e.orientation == ORIENTATION.DIRECTED) {
                if (e.start_vertex == i) {
                    neighbors.push(e.end_vertex);
                }
            }
        }
        return neighbors;
    }

    get_in_neighbors_list(i: number) {
        let neighbors = new Array<number>();
        for (let e of this.links.values()) {
            if (e.orientation == ORIENTATION.DIRECTED) {
                if (e.end_vertex == i) {
                    neighbors.push(e.start_vertex);
                }
            }
        }
        return neighbors;
    }

    delete_vertex(vertex_index: number) {
        this.vertices.delete(vertex_index);

        this.links.forEach((link, link_index) => {
            if (link.end_vertex === vertex_index || link.start_vertex === vertex_index) {
                this.links.delete(link_index);
            }
        })
    }

    delete_link(link_index: number) {
        this.links.delete(link_index);
    }


    delete_stroke(stroke_index: number) {
        this.strokes.delete(stroke_index);
    }

    delete_area(area_index: number) {
        this.areas.delete(area_index);
    }

    clear() {
        this.vertices.clear();
        this.links.clear();
    }


    

    // does not modify the graph
    // any link between fixed and remove are deleted
    // any link such that one of its endpoints is "remove", is either deleted either modified
    create_vertices_merge_modif(vertex_index_fixed: number, vertex_index_to_remove: number ): VerticesMerge<V,L>{
        const v_to_remove = this.vertices.get(vertex_index_to_remove);
        const deleted_links = new Map();
        const modified_links_indices = new Array();

        for ( const [link_index, link] of this.links.entries()) {
            const endpoints = new Set([link.start_vertex, link.end_vertex]);
            if ( eqSet(endpoints, new Set([vertex_index_fixed, vertex_index_to_remove])) ){
                deleted_links.set(link_index, link);
            } else if (link.end_vertex == vertex_index_to_remove) {
                let is_deleted = false;
                for (const [index2, link2] of this.links.entries()) {
                    if ( index2 != link_index && link2.signature_equals(link.start_vertex, vertex_index_fixed, link.orientation )){
                        deleted_links.set(link_index, link);
                        is_deleted = true;
                        break;
                    }
                }
                if ( is_deleted == false ){
                    modified_links_indices.push(link_index);
                }
            } else if (link.start_vertex == vertex_index_to_remove) {
                let is_deleted = false;
                for (const [index2, link2] of this.links.entries()) {
                    if ( index2 != link_index && link2.signature_equals(vertex_index_fixed, link.end_vertex, link.orientation)){
                        deleted_links.set(link_index, link);
                        is_deleted = true;
                        break;
                    }
                }
                if ( is_deleted == false ){
                    modified_links_indices.push(link_index);
                }
            }
        }

        return new VerticesMerge(vertex_index_fixed, vertex_index_to_remove, v_to_remove, deleted_links, modified_links_indices);
    }

    translate_areas(indices: Set<number>, shift: Vect) {
        const contained_vertices = new Set<number>();
        for (const area_index of indices.values()) {
            const area = this.areas.get(area_index);
            for (const [vertex_index, vertex] of this.vertices.entries()) {
                if (area.is_containing(vertex)) {
                    contained_vertices.add(vertex_index);
                }
            }
            area.translate(shift);
        }
        this.translate_vertices(contained_vertices, shift);
    }

    translate_vertices(indices: Set<number>, shift: Vect) {
        for (const index of indices) {
            if (this.vertices.has(index)) {
                const vertex = this.vertices.get(index);
                const previous_pos = vertex.pos.copy();
                vertex.pos.translate(shift);
                const new_pos = vertex.pos.copy();

                for (const [link_index, link] of this.links.entries()) {
                    if (link.start_vertex == index) {
                        const end_vertex_pos = this.vertices.get(link.end_vertex).pos;
                        link.transform_cp(new_pos, previous_pos, end_vertex_pos);
                    } else if (link.end_vertex == index) {
                        const start_vertex_pos = this.vertices.get(link.start_vertex).pos;
                        link.transform_cp(new_pos, previous_pos, start_vertex_pos);
                    }
                }
            }
        }
    }

    get_subgraph_from_area(area_index: number): Graph<V,L,S,A>{
        const area = this.areas.get(area_index);
        const subgraph = new Graph<V,L,S,A>();

         for (const [index, v] of this.vertices.entries()) {
            if(area.is_containing(v)){
                subgraph.vertices.set(index, v);
            }
        }

        for (const [index, link] of this.links.entries()){
            const u = this.vertices.get(link.start_vertex);
            const v = this.vertices.get(link.end_vertex);

            if( area.is_containing(u) && area.is_containing(v)){
                subgraph.links.set(index, link);
            }
        }
        return subgraph;
    }

    vertices_contained_by_area(area: A): Set<number>{
        const set = new Set<number>();
        this.vertices.forEach((vertex,vertex_index)=> {
            if (area.is_containing(vertex)){
                set.add(vertex_index);
            }
        })
        return set;
    }


    Floyd_Warhall( weighted: boolean) {
        const dist = new Map<number, Map<number, number>>();
        const next = new Map<number, Map<number, number>>();

        for (const v_index of this.vertices.keys()) {
            dist.set(v_index, new Map<number, number>());
            next.set(v_index, new Map<number, number>());

            for (const u_index of this.vertices.keys()) {
                if (v_index === u_index) {
                    dist.get(v_index).set(v_index, 0);
                    next.get(v_index).set(v_index, v_index);
                }
                else {
                    dist.get(v_index).set(u_index, Infinity);
                    next.get(v_index).set(u_index, Infinity);
                }
            }
        }

        for (const e_index of this.links.keys()) {
            const e = this.links.get(e_index);
            // TODO: Oriented Case
            let weight = 1;
            if (weighted) {
                weight = parseFloat(e.weight);
            }
            dist.get(e.start_vertex).set(e.end_vertex, weight);
            dist.get(e.end_vertex).set(e.start_vertex, weight);

            next.get(e.start_vertex).set(e.end_vertex, e.start_vertex);
            next.get(e.end_vertex).set(e.start_vertex, e.end_vertex);
        }

        for (const k_index of this.vertices.keys()) {
            for (const i_index of this.vertices.keys()) {
                for (const j_index of this.vertices.keys()) {
                    const direct = dist.get(i_index).get(j_index);
                    const shortcut_part_1 = dist.get(i_index).get(k_index);
                    const shortcut_part_2 = dist.get(k_index).get(j_index);

                    if (direct > shortcut_part_1 + shortcut_part_2) {
                        dist.get(i_index).set(j_index, shortcut_part_1 + shortcut_part_2);
                        next.get(i_index).set(j_index, next.get(i_index).get(k_index));
                    }
                }
            }
        }

        return { distances: dist, next: next };

    }

    get_degrees_data() {
        if (this.vertices.size == 0) {
            return { min_value: 0, min_vertices: null, max_value: 0, max_vertices: null, avg: 0 };
        }

        const index_first = this.vertices.keys().next().value;
        let min_indices = new Set([index_first]);
        let min_degree = this.get_neighbors_list(index_first).length;
        let max_indices = new Set([index_first]);
        let max_degree = this.get_neighbors_list(index_first).length;
        let average = 0.0;

        for (const v_index of this.vertices.keys()) {
            const neighbors = this.get_neighbors_list(v_index);
            if (min_degree > neighbors.length) {
                min_degree = neighbors.length;
                min_indices = new Set([v_index]);
            }
            if (min_degree === neighbors.length) {
                min_indices.add(v_index);
            }

            if (max_degree < neighbors.length) {
                max_degree = neighbors.length;
                max_indices = new Set([v_index]);
            }
            if (max_degree === neighbors.length) {
                max_indices.add(v_index);
            }

            average += neighbors.length;
        }

        average = average / this.vertices.size;

        return { min_value: min_degree, min_vertices: min_indices, max_value: max_degree, max_vertices: max_indices, avg: average };
    }

    // return maximum (undirected) degree of the graph
    // return -1 if there is no vertex
    max_degree(): number{
        let record = -1;
        for ( const v_index of this.vertices.keys()){
            let degree = this.get_neighbors_list(v_index).length;
            if ( degree > record ){
                record = degree;
            }
        }
        return record;
    }


     DFS_recursive( v_index: number, visited: Map<number, boolean>) {
        visited.set(v_index, true);
        const neighbors = this.get_neighbors_list(v_index);

        for (const u_index of neighbors) {
            if (visited.has(u_index) && !visited.get(u_index)) {
                this.DFS_recursive( u_index, visited);
            }
        }
    }

    DFS_iterative( v_index: number) {
        const visited = new Map();
        for (const index of this.vertices.keys()) {
            visited.set(index, false);
        }
        console.log(visited);

        const S = Array();
        S.push(v_index);

        while (S.length !== 0) {
            const u_index = S.pop();
            if (!visited.get(u_index)) {
                visited.set(u_index, true);
                const neighbors = this.get_neighbors_list(u_index);
                for (const n_index of neighbors) {
                    S.push(n_index);
                }
            }
        }

        return visited;
    }

    has_cycle(): boolean {
        let ok_list = new Set();
        let g = this;

        function _has_cycle(d: number, origin: number, s: Array<number>): boolean {
            for (const v of g.get_neighbors_list(d)) {
                if (v == origin || ok_list.has(v)) {
                    continue;
                }
                if (s.indexOf(v) > -1) {
                    return true;
                }
                s.push(v);
                let b = _has_cycle(v,d, s)
                if (b) {return true}
                ok_list.add(v);
                s.pop();
            }
            return false;
        }
        for (const v of this.vertices.keys()) {
            if (ok_list.has(v)) {
                continue;
            }
            if (_has_cycle(v,-1, [v])) {
                return true;
            }
        }
        return false;
    }

    // iterative version of has_cycle
    // seems better on trees
    has_cycle2(): boolean {
        let visited = new Set();
        for (const v of this.vertices.keys()) {
            if ( visited.has(v) == false){
                let stack = new Array();
                stack.push(v);
                let last = -1;
                while (stack.length > 0){
                    const u_index = stack.pop();
                    if (visited.has(u_index)){
                        return true;
                    }
                    visited.add(u_index);
                    
                    const neighbors = this.get_neighbors_list(u_index);
                    for (const n_index of neighbors) {
                        if ( n_index != last ){
                            stack.push(n_index);
                            last = u_index;
                        }
                    }
                }
            }
        }
        return false;
    }

    has_directed_cycle():boolean {
        let ok_list = new Set();
        let g = this;
        
        function _has_directed_cycle(d: number, s: Array<number>): boolean {
            for (const v of g.get_out_neighbors_list(d)) {
                if (s.indexOf(v) > -1) {
                    return true;
                }
                s.push(v);
                let b = _has_directed_cycle(v, s)
                if (b) {return true}
                ok_list.add(v);
                s.pop();
            }
            return false;
        }
        for (const v of this.vertices.keys()) {
            if (ok_list.has(v)) {
                continue;
            }
            if (_has_directed_cycle(v, [v])) {
                return true;
            }
        }
        return false;
    }


    // compute the size of the connected component of vertex of index "vindex"
    // return 0 if vindex is not a vertex index
    size_connected_component_of(vindex: number): number {
        if (this.vertices.has(vindex) == false){
            return 0;
        }
        let counter = 0;
        const visited = new Set();
        const stack = Array();
        stack.push(vindex);

        while (stack.length > 0) {
            const u_index = stack.pop();
            if (!visited.has(u_index)) {
                counter += 1;
                visited.add(u_index);
                const neighbors = this.get_neighbors_list(u_index);
                for (const n_index of neighbors) {
                    
                    stack.push(n_index);
                }
            }
        }
    
        return counter;
    }


    size_connected_component_excluding_links(vindex: number, excluded: Set<number>): number {
        if (this.vertices.has(vindex) == false){
            return 0;
        }
        let counter = 0;
        const visited = new Set();
        const stack = Array();
        stack.push(vindex);

        while (stack.length > 0) {
            const u_index = stack.pop();
            if (!visited.has(u_index)) {
                counter += 1;
                visited.add(u_index);
                const neighbors = this.get_neighbors_list_excluding_links(u_index, excluded);
                for (const n_index of neighbors) {
                    stack.push(n_index);
                }
            }
        }
    
        return counter;
    }

    // compute the size of the connected component of vertex of index "vindex"
    // return 0 if vindex is not a vertex index
    get_connected_component_of(vindex: number): Graph<V,L,S,A> {
        const g = new Graph<V,L,S,A>();
        if (this.vertices.has(vindex) == false){
            return g;
        }
        const visited = new Set();
        const stack = Array();
        stack.push(vindex);

        while (stack.length > 0) {
            const u_index = stack.pop();
            const u = this.vertices.get(u_index);
            g.set_vertex(u_index, u);
            if (!visited.has(u_index)) {
                visited.add(u_index);
                for (const [link_index, link] of this.links.entries()){
                    if ( link.orientation == ORIENTATION.UNDIRECTED){
                        if ( link.start_vertex == u_index){
                            stack.push(link.end_vertex);
                            g.links.set(link_index, link);
                        } else if ( link.end_vertex == u_index){
                            stack.push(link.start_vertex);
                            g.links.set(link_index, link);
                        }
                    }
                }
            }
        }
    
        return g;
    }

    // return a cut edge which maximizes the minimum of the size of the connected components of its endvertices
    // return -1 if there is no cut edge 
    max_cut_edge(){
        const n = this.vertices.size;
        let record = 0;
        let record_link_index = -1;
        for ( const [link_index, link] of this.links.entries()){

            const n1 = this.size_connected_component_excluding_links(link.start_vertex, new Set([link_index]));
            if (n1 < n ){
                const n2 = this.size_connected_component_excluding_links(link.end_vertex, new Set([link_index]));
                const m = Math.min(n1,n2);
                if ( m > record){
                    record = m;
                    record_link_index = link_index;
                }
            }
        }
        return record_link_index;
    }
    

    is_connected(): boolean {
        if (this.vertices.size < 2) {
            return true;
        }
    
        const indices = Array.from(this.vertices.keys());
        const visited = new Map();
        for (const index of this.vertices.keys()) {
            visited.set(index, false);
        }
    
        this.DFS_recursive( indices[0], visited);
    
        for (const is_visited of visited.values()) {
            if (!is_visited) {
                return false;
            }
        }
        return true;
    }

    // Compute a minimum spanning tree using Kruskal algorithm
    // https://en.wikipedia.org/wiki/Kruskal%27s_algorithm
    // edges in the tree are colored red
    // other edges are colored black
    // return the weight of the spanning tree
    minimum_spanning_tree(): number {
        const edges = new Array<[L,number]>();
        for (const link of this.links.values()){
            if (link.orientation == ORIENTATION.UNDIRECTED){
                edges.push([link, parseFloat(link.weight)]);
                
            }
        }
        edges.sort(([e,w],[e2,w2]) => w-w2);

        const component = new Map<number,number>();
        for (const index of this.vertices.keys()){
            component.set(index, index);
        }

        let tree_weight = 0;
        for (const edge of edges){
            const c1 = component.get(edge[0].start_vertex);
            const c2 = component.get(edge[0].end_vertex);
            if ( c1 != c2 ){
                edge[0].color = "red";
                tree_weight += edge[1];
                for (const [vindex, c] of component.entries()){
                    if (c == c1){
                        component.set(vindex, c2);
                    }
                }
            }else {
                edge[0].color = "black";
            }
        }
        return tree_weight;
    }

    
    // Kosaraju's algorithm: https://en.wikipedia.org/wiki/Kosaraju's_algorithm
    strongly_connected_components(): Array<Array<number>> {
	    const graph = this;
	    let scc: Array<Array<number>> = Array(); // Strongly Connected Components
	    var stack = Array();
	    var visited = new Set();

	    const visit_fn = function (cur: number) {
		if (visited.has(cur)) return;
		visited.add(cur);
		for (const neigh of graph.get_out_neighbors_list(cur)) {
			visit_fn(neigh);
		}
		stack.push(cur);
	    }

	    for (const key of this.vertices.keys()) {
		    visit_fn(key);
	    } // O(n) due to caching

            let assigned = new Set();
	    
	    const assign_fn = function (cur: number) {
		if (!assigned.has(cur)) {
		    assigned.add(cur);
		    let root_stack = scc.pop();
		    root_stack.push(cur);
		    scc.push(root_stack);
		    for (const neigh of graph.get_in_neighbors_list(cur)) {
		        assign_fn(neigh);
		    }
		}

	    }

	    while (stack.length != 0) {
		    let stack_head = stack.pop();
	            if (!assigned.has(stack_head)) {
			scc.push([]); // The array to stock the new component
			assign_fn(stack_head);
		    }
	    }

	    return scc; 
    }
}


