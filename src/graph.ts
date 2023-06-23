import { BasicLink, Link, ORIENTATION } from './link';
import { BasicVertex, Vertex } from './vertex';
import { Coord, Vect } from './coord';
import { Area } from './area';
import { det, is_quadratic_bezier_curves_intersection, is_segments_intersection } from './utils';

export enum ELEMENT_TYPE {
    VERTEX = "VERTEX",
    LINK = "LINK",
    STROKE = "STROKE",
    AREA = "AREA"
}






export class Graph<V extends Vertex<V>,L extends Link<L>> {
    vertices: Map<number, V>;
    links: Map<number, L>;

    constructor() {
        this.vertices = new Map();
        this.links = new Map();
    }


    /**
     * Returns an undirected Graph<V,L,S,A> given a list of vertices positions and weights and a list of edges.
     * @param listVertices the two numbers are the coordinates of the vertices, the string is the weight of the vertex
     * @param listEdges 
     * @param vertexConstructor is a constructor of V
     * @param edgeConstructor is a constructor of L
     */
    static fromList<V extends Vertex<V>,L extends Link<L>>(listVertices: Array<[number,number,string]>, listEdges: Array<[number,number, string]>, vertexConstructor: (x: number, y: number, weight: string, color: string) => V, edgeConstructor: (indexV1: number, indexV2: number, weight: string) => L ): Graph<V,L>{
        const g = new Graph<V,L>();
        for ( const [index, [x,y,w]] of listVertices.entries()){
            const new_vertex = vertexConstructor(x,y,w, "black");
            g.set_vertex(index, new_vertex );
        }
        for ( const [indexV1,indexV2,w] of listEdges.values()){
            if (indexV1 >= listVertices.length || indexV2 >= listVertices.length){
                console.log("Error: index given in listEdges is impossible: ", indexV1, " or ", indexV2);
                return g;
            }
            g.add_link(edgeConstructor(indexV1,indexV2,w));
        }
        return g;
    }

    /**
     * Returns an undirected Graph<Vertex,Link> (called basic) from a list of edges represented by couples of indices.
     * @param listVertices the two numbers are the coordinates of the vertices, the string is the weight of the vertex
     * @param listEdges 
     */
    static fromListBasic(listVertices: Array<[number,number,string]>, listEdges: Array<[number,number, string]>): Graph<BasicVertex,BasicLink>{
        return Graph.fromList(listVertices, listEdges, (x,y,w,c) => {return new BasicVertex(x,y,w,c)}, (x,y,w) => {return new BasicLink(x,y,"",ORIENTATION.UNDIRECTED, "black", w)});
    }
    

    /**
     * Returns an undirected Graph<V,L,S,A> from a list of edges.
     * @param vertex_default is a constructor of V
     * @param edge_default is a constructor of L
     */
    static from_list_default<V extends Vertex<V>,L extends Link<L>>(l: Array<[number,number, string]>, vertex_default: (index: number)=> V, edge_default: (x: number, y: number, weight: string) => L ): Graph<V,L>{
        const g = new Graph<V,L>();
        const indices = new Set<number>();
        for ( const [x,y,w] of l.values()){
            if (indices.has(x) == false){
                indices.add(x);
                g.set_vertex(x,vertex_default(x));
            }
            if (indices.has(y) == false){
                indices.add(y);
                g.set_vertex(y,vertex_default(y));
            }
            const link = edge_default(x,y,w);
            g.add_link(link);
        }
        return g;
    }

    /**
     * Returns an Undirected Graph from a list of edges represented by couples of indices.
     * Weights are set to "".
     */
    static from_list(l: Array<[number,number]>): Graph<BasicVertex,BasicLink>{
        const l2 = new Array();
        for (const [x,y] of l){
            l2.push([x,y,""]);
        }
        const g = Graph.from_list_default(l2, BasicVertex.default, BasicLink.default_edge );
        return g;
    }

    // create a Weighted Undirected Graph from a list of weighted edges represented by couples of number with the weight in third
    static from_weighted_list(l: Array<[number,number,string]>): Graph<BasicVertex,BasicLink>{
        const g = Graph.from_list_default(l, BasicVertex.default, BasicLink.default_edge );
        return g;
    }
	
     static directed_from_list(l: Array<[number,number]>): Graph<BasicVertex,BasicLink>{
        const g = Graph.directed_from_list_default(l, BasicVertex.default, BasicLink.default_arc );
        return g;
    }

    static directed_from_list_default<V extends Vertex<V>,L extends Link<L>>(l: Array<[number,number]>, vertex_default: (index: number)=> V, arc_default: (x: number, y: number, weight: string) => L ): Graph<V,L>{
        const g = new Graph<V,L>();
        const indices = new Set<number>();
        for ( const [x,y] of l.values()){
            if (indices.has(x) == false){
                indices.add(x);
                g.set_vertex(x,vertex_default(x));
            }
            if (indices.has(y) == false){
                indices.add(y);
                g.set_vertex(y,vertex_default(y));
            }
            const link = arc_default(x,y,"");
            g.add_link(link);
        }

        
        return g;
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



    

    /**
     * SHOULD BE REMOVED
     * index should be in the vertex
     */
    get_index(v: Vertex<V>) {
        for (let [index, vertex] of this.vertices.entries()) {
            if (vertex === v) {
                return index;
            }
        }
        return;
    }

    get_next_available_index_vertex() {
        let index = 0;
        while (this.vertices.has(index)) {
            index += 1;
        }
        return index;
    }

    /// Add a vertex to the graph.
    /// Returns the index of the added vertex.
    addVertex(vertex: V): number {
        let index = this.get_next_available_index_vertex();
        vertex.index = index;
        this.vertices.set(index, vertex);
        return index;
    }

    set_vertex(index: number, vertex: V) {
        vertex.index = index;
        this.vertices.set(index, vertex );
    }

    has_link(index_start: number,index_end: number, orientation: ORIENTATION): boolean{
        for (const link of this.links.values()){
            if (link.signature_equals(index_start, index_end, orientation)){
                return true;
            }
        }
        return false;
    }

    has_arc(index_start: number, index_end: number): boolean {
        return this.has_link(index_start, index_end, ORIENTATION.DIRECTED);
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



    clear() {
        this.vertices.clear();
        this.links.clear();
    }

    



    translate_vertices(indices: Iterable<number>, shift: Vect) {
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

    

    vertices_contained_by_area<A extends Area>(area: A): Set<number>{
        const set = new Set<number>();
        this.vertices.forEach((vertex,vertex_index)=> {
            if (area.is_containing(vertex)){
                set.add(vertex_index);
            }
        })
        return set;
    }


    /**
     * Returns the distances between each pair of vertices using only edges (undirected links).
     * It uses the algorithm of Floyd-Warshall.
     * @param weighted: if true then the distance between a pair of adjacent vertices is not 1 but e.weight.
     * TODO: oriented case 
     */
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

    // return minimum indegree of the graph
    // return "" if there is no vertex
    min_indegree(): number | string{
        let record: number | string = "";
        for ( const v_index of this.vertices.keys()){
            let indegree = this.get_in_neighbors_list(v_index).length;
            if (typeof record == "string"){
                record = indegree;
            } else if ( indegree < record ){
                record = indegree;
            }
        }
        return record;
    }

    // return minimum outdegree of the graph
    // return "" if there is no vertex
    min_outdegree(): number | string{
        let record: number | string = "";
        for ( const v_index of this.vertices.keys()){
            let indegree = this.get_out_neighbors_list(v_index).length;
            if (typeof record == "string"){
                record = indegree;
            } else if ( indegree < record ){
                record = indegree;
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
    get_connected_component_of(vindex: number): Graph<V,L> {
        const g = new Graph<V,L>();
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

    /// for every vertex of vertices_indices
    /// add arcs between these vertices according to their x-coordinate
    complete_subgraph_into_tournament(vertices_indices: Iterable<number>, arc_default: (x: number, y: number) => L){
        for (const index1 of vertices_indices){
            const v1 = this.vertices.get(index1);
            for (const index2 of vertices_indices){
                const v2 = this.vertices.get(index2);
                if (index1 < index2 ){
                    if ( v1.pos.x < v2.pos.x ){
                        if( this.has_arc(index1, index2) == false && this.has_arc(index2, index1) == false){
                            const new_link = arc_default(index1, index2);
                            this.add_link(new_link);
                        }
                    } else {
                        if( this.has_arc(index1, index2) == false && this.has_arc(index2, index1) == false){
                            const new_link = arc_default(index2, index1);
                            this.add_link(new_link);
                        }
                    }
                }
                
            }
        }
    }

    /**
     * Warning: UNTESTED
     * @param c1 a corner from the rectangle
     * @param c2 the opposite corner
     * @returns the subgraph of this formed by the vertices contained in the rectangle. The links between these vertices are kept.
     * These links could go out of the rectangle if they are bended.
     * Vertices and links are not copied, so any modification on these elements affect the original graph.
     */
    getSubgraphFromRectangle(c1: Coord, c2: Coord): Graph<V,L>{
        const newGraph = new Graph<V,L>();
    
        for (const [index,vertex] of this.vertices.entries()){
            if (vertex.isInRectangle(c1,c2)){
                newGraph.set_vertex(index,vertex);
            }
        }
        for (const [index,link] of this.links.entries()){
            if (newGraph.vertices.has(link.start_vertex) && newGraph.vertices.has(link.end_vertex)){
                newGraph.set_link(index, link);
            }
        }
        return newGraph;
    }

    /**
     * Paste other graph in this by cloning the vertices and links of the other graph.
     * It creates new indices for the vertices and links of the other graph.
     * Therefore if 0 was a vertex index of this and 0 also a vertex index of the other graph, then it creates index 1 (or another possible index).
     * 
     */
    pasteGraph(other: Graph<V,L>){
        const corresp = new Map<number,number>();
        for(const [oldIndex, vertex] of other.vertices){
            const newIndex = this.addVertex(vertex.clone());
            corresp.set(oldIndex, newIndex);
        }
        for (const link of other.links.values()){
            const newIndexV1 = corresp.get(link.start_vertex);
            const newIndexV2 = corresp.get(link.end_vertex);
            if (typeof newIndexV1 !== "undefined" && typeof newIndexV2 !== "undefined"){
                const newLink = link.clone();
                newLink.start_vertex = newIndexV1;
                newLink.end_vertex = newIndexV2;
                this.add_link(newLink);
            }
        }
    }

    /**
     * WARNING: UNTESTED
     * Clones the graph.
     */
    clone(): Graph<V,L> {
        const newGraph = new Graph<V,L>();
        for(const [index, vertex] of this.vertices){
            newGraph.set_vertex(index, vertex.clone());
        }
        for(const [index, link] of this.links){
            newGraph.set_link(index, link.clone());
        }
        return newGraph;
    }


    /**
     * WARNING: UNTESTED
     * Translate the graph.
     */
    translate(shift: Vect){
        for(const [index, vertex] of this.vertices){
            vertex.pos.translate(shift)
        }
        for(const [index, link] of this.links){
            if (typeof link.cp !== "string"){
                link.cp.translate(shift);
            }
        }
    }


    // TODO: optional parameter which starts the k
    // TODO: return a certificate that it is k-colorable
    // TODO: better algorithm than the backtract way
    /**
     * Returns the chromatic number of the graph.
     * The chromatic number is the minimum integer k such that there exists a proper coloring with k colors.
     * What happens with arcs? I dont know. TODO
     */
    chromatic_number() : number {
        let k = 1;
        const n = this.vertices.size;

        while (true){
            if (k >= 5){
                return -1;
            }
            const color = new Array();
            const indices = new Map();
            let j = 0;
            for ( const index of this.vertices.keys()){
                color.push(0);
                indices.set(index,j);
                j ++;
            }
            while (true){
                let i = n-1;
                while (i >= 0 && color[i] == k-1){
                    color[i] = 0;
                    i --;
                }
                if ( i == -1 ){ // every color was set to k-1
                    break;      // all assignements have been tried
                }
                color[i] ++;
                // else next color assignement
                // check it
                let is_proper_coloring = true;
                for (const link of this.links.values()){
                    if ( link.orientation == ORIENTATION.UNDIRECTED){
                        if( color[indices.get(link.start_vertex)] == color[indices.get(link.end_vertex)]){
                            is_proper_coloring = false;
                            break;
                        }
                    }
                }
                if (is_proper_coloring){
                    return k;
                }
            }
            k += 1;
        }
    }


    // Compute the vertex cover number of the graph.
    // It is the minimum integer k such that there exists a subset X of the vertices which is of size k and such that every edge is incident to at least one vertex of X.
    // TODO: optional parameter m: asserts that the result it at least m
    // TODO: return a certificate that it has a k-vertex-cover
    // TODO: better algorithm than the backtract way
    vertex_cover_number(): number {
        const n = this.vertices.size;
        let record = n;

        const selection = new Array<boolean>();
        const indices = new Map();
        let j = 0;
        for ( const index of this.vertices.keys()){
            selection.push(false);
            indices.set(index,j);
            j ++;
        }

        while (true){
            let i = n-1;
            while (i >= 0 && selection[i]){
                selection[i] = false;
                i --;
            }
            if ( i == -1 ){
                break;      // all assignements have been tried
            }
            selection[i] = true;
            // else next selection
            // check it
            let is_vertex_cover = true;
            for (const link of this.links.values()){
                if ( link.orientation == ORIENTATION.UNDIRECTED){
                    if( !selection[indices.get(link.start_vertex)] && !selection[indices.get(link.end_vertex)]){
                        is_vertex_cover = false;
                        break;
                    }
                }
            }
            if (is_vertex_cover){
                let count = 0;
                for (const v of selection){
                    if (v) {
                        count ++;
                    }
                }
                if (count < record){
                    record = count;
                }
            }
        }

        return record;
    }
        
    // Compute the clique number of the graph.
    // It is the minimum integer k such that there exists a subset X of the vertices which is a clique.
    // TODO: optional parameter m: asserts that the result it at least m
    // TODO: return a certificate that it has a k-vertex-cover
    // TODO: better algorithm than the backtract way
    clique_number(): number {
        const n = this.vertices.size;
        let record = 0;

        const selection = new Array<boolean>();
        const indices = new Map();
        const reverse_indices = new Map<number, number>();
        let j = 0;
        for ( const index of this.vertices.keys()){
            selection.push(false);
            indices.set(index,j);
            reverse_indices.set(j,index);
            j ++;
        }

        while (true){
            let i = n-1;
            while (i >= 0 && selection[i]){
                selection[i] = false;
                i --;
            }
            if ( i == -1 ){
                break;      // all assignements have been tried
            }
            selection[i] = true;
            // else next selection
            // check it
            let is_clique = true;
            let selected_indices = new Set<number>();
            for (const [key,is_selected] of selection.entries()){
                 if (is_selected){
                    const index = reverse_indices.get(key);
                    for (const index2 of selected_indices.values()){
                        if (!this.has_link(index, index2, ORIENTATION.UNDIRECTED)){
                            is_clique = false;
                        }
                    }
                    selected_indices.add(index);
                 }
            }
            
            if (is_clique){
                let count = 0;
                for (const v of selection){
                    if (v) {
                        count ++;
                    }
                }
                if (count > record){
                    record = count;
                }
            }
        }

        return record;
    }



    // TODO consider cubic bezier
    // The drawing of a graph is said to be planar if no link intersect another link
    // Return true iff the drawing is planar
    // How it works:
    // Considering two links, if both have no control points, then we check if the straight segments between the endpoints have an intersection with the is_segments_intersection
    // If both have cps, then ???
    // If only one has a cp then ???
    is_drawing_planar(): boolean{
        for (const link_index of this.links.keys()) {
            const link1 = this.links.get(link_index);
            const v1 = this.vertices.get(link1.start_vertex);
            const w1 = this.vertices.get(link1.end_vertex);
            let z1 = v1.pos.middle(w1.pos);
            if (typeof link1.cp != "string"){
                z1 = link1.cp;
            }
            for (const link_index2 of this.links.keys()) {
                if ( link_index2 < link_index){
                    const link2 = this.links.get(link_index2);
                    const v2 = this.vertices.get(link2.start_vertex);
                    const w2 = this.vertices.get(link2.end_vertex);
                    let is_intersecting = false;
                    let z2 = v2.pos.middle(w2.pos);
                    // TODO: faster algorithm for intersection between segment and bezier
                    if (typeof link2.cp != "string"){
                        z2 = link2.cp;
                        is_intersecting = is_quadratic_bezier_curves_intersection(v1.pos, z1, w1.pos, v2.pos, z2, w2.pos);
                    }
                    else {
                        if (typeof link1.cp == "string"){
                            is_intersecting = is_segments_intersection(v1.pos, w1.pos, v2.pos, w2.pos);
                        } else {
                            is_intersecting = is_quadratic_bezier_curves_intersection(v1.pos, z1, w1.pos, v2.pos, z2, w2.pos);
                        }
                    }
    
                    if (is_intersecting){
                        return false;
                    }
                }
            }
        }
        return true;
    }


    /**
     * Returns true if the graph is bipartite.
     * A graph is said to be bipartite if it is 2-colorable.
     * TODO: optimize
     */
    isBipartite(): boolean {
        return this.chromatic_number() <= 2;
    }

    /**
     * Sets all weights of links to the euclidian distance between vertices.
     * TODO: generalize to other distances.
     */
    setEuclidianLinkWeights() {
        for (const link of this.links.values()){
            const v1 = this.vertices.get(link.start_vertex);
            const v2 = this.vertices.get(link.end_vertex);
            if (v1 && v2){
                const d = Math.sqrt(v1.pos.dist2(v2.pos));
                link.weight = String(d);
            }
        }
    }

    /**
     * Returns the stretch of the graph.
     * The stretch is defined as the maximal stretch between pairs of vertices.
     * The stretch of a pair of vertices is defined as the ratio between the euclidian distance in the graph between them and the euclidian distance between them.
     * Returns undefined if there is 1 vertex or less.
     */
    stretch(): number | undefined{
        this.setEuclidianLinkWeights();
        const data = this.Floyd_Warhall(true);
        const distances = data.distances;
        let maxStretch: number | undefined = undefined;
        for (const [indexV1, v1] of this.vertices){
            for (const [indexV2, v2] of this.vertices){
                if (indexV1 != indexV2){
                    const v1distances = distances.get(indexV1);
                    if (v1distances){
                        const graphDist = v1distances.get(indexV2);
                        if (graphDist){
                            const stretch = graphDist / Math.sqrt(v1.pos.dist2(v2.pos));
                            if (typeof maxStretch === "undefined" ){
                                maxStretch = stretch;
                            } else if (stretch > maxStretch){
                                maxStretch = stretch;
                            }
                        }
                    }
                }
            }
        }
        return maxStretch;
    }


    /**
     * Resets the edges of the graph so that they respect the Delaunay adjacency rule.
     * 
     */
    resetDelaunayGraph(linkConstructor: (i: number, j: number) => L){
        this.links.clear();

        for (const [i1, v1] of this.vertices){
            for (const [i2, v2] of this.vertices){
                for (const [i3, v3] of this.vertices){
                    if ( !( (i1 < i2 && i2 < i3) || (i1 > i2 && i2 > i3) )){
                        continue;
                    }
                    // Check if the points are in counterclowise order.
                    if ( (v2.pos.x - v1.pos.x)*(v3.pos.y-v1.pos.y)-(v3.pos.x -v1.pos.x)*(v2.pos.y-v1.pos.y) <= 0){
                        // console.log("not ccw", i1, i2, i3);
                        continue;
                    }
                    // console.log("ccw", i1, i2, i3);

                    let isPointInside = false;
                    for (const [i4,v4] of this.vertices){
                       if( i1 != i4 && i2 != i4 && i3 != i4){
                            const mat = 
                            [[v1.pos.x, v1.pos.y, v1.pos.x**2 + v1.pos.y**2, 1],
                             [v2.pos.x, v2.pos.y, v2.pos.x**2 + v2.pos.y**2, 1],
                             [v3.pos.x, v3.pos.y, v3.pos.x**2 + v3.pos.y**2, 1],
                             [v4.pos.x, v4.pos.y, v4.pos.x**2 + v4.pos.y**2, 1]];
                            if (det(mat) > 0){
                                isPointInside = true;
                                break;
                            }
                        }
                    }
                    if (isPointInside == false){
                        this.add_link(linkConstructor(i1,i2));
                        this.add_link(linkConstructor(i1,i3));
                        this.add_link(linkConstructor(i2,i3));
                    }
                }
            }
        }
    }

}


