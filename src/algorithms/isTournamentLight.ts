import { Graph } from "../graph";
import { Option } from "../option";
import { Vertex } from "../vertex";


/**
 * @param m is the TRANSPOSED adjacency matrix of a directed graph
 * @todo CHECK for loops
 * 
 * An arc u->v is said to be heavy if there exists vertices a, b, c such that
 * - a -> b -> c -> a is a cycle
 * - a,b,c -> u
 * - v -> a,b,c
 * 
 * @returns undefined if there is no heavy arc (in that case the matrix is light)
 * @returns [u,v,a,b,c] where u->v is an heavy arc
 */
export function searchHeavyArc(m: Array<Array<boolean>>): Option<Array<number>> {

    let n = m.length;

    const order = new Array<number>();
    for (let u = 0; u < n; u ++){
        for (let v = 0; v < n; v ++){
            if ( m[v][u] == false) { continue }; // Suppose m[v][u] = true so v <- u

            // If u->v is not heavy then the vertices x such that v -> x -> u should be acyclic
            // So there should be a partial order for them
            // So we reconstruct the partial order incrementally
            // If there is a vertex that cannot be inserted without conflicting with the current partial order then there is a triangle
            order.splice(0, order.length);

            for (let b = 0; b < n ; b ++){
                if ( m[b][v] ){ // b <- v
                    if (m[u][b] == false){ // u <- b
                        continue;
                    }
                    let i = 0;
                    while (i < order.length){
                        const a = order[i];
                        if ( m[a][b] ){ // if a <- b break, it is the first in order, so order[k] -> b for every k<i
                            break;
                        }
                        i ++;
                    }
                    let isCycle = false;
                    let j = i+1;
                    while (j < order.length){
                        const c = order[j];
                        if ( m[b][c] ){ //  b <- order[j]
                            isCycle = true;
                            break;
                        }
                        j ++;
                    }
                    if (isCycle){
                        return [u,v,order[j],b,order[i]];
                    } else {
                        order.splice( i, 0, b);
                    }
                }
                
            }
        }
            
    }
    

    return undefined;
}


export function tournamentLightConflict<V,L>(g: Graph<V,L>): Option<Array<Vertex<V>>> {
    for (const [_, u] of g.vertices){
        for (const v of g.getOutNeighbors(u)){
            const order = new Array<Vertex<V>>();


            for (const b of g.getOutNeighbors(v)){
                if (g.hasArc(b.index,u.index) == false){
                    continue;
                }
                let i = 0;
                while (i < order.length){
                    const a = order[i];
                    if ( g.hasArc(b.index, a.index) ){
                        break;
                    }
                    i ++;
                }
                let isCycle = false;
                let j = i+1;
                while (j < order.length){
                    const c = order[j];
                    if ( g.hasArc(b.index, c.index)){
                    } else {
                        isCycle = true;
                        break;
                    }
                    j ++;
                }
                if (isCycle){
                    return [u,v,order[j],b,order[i]];
                } else {
                    order.splice( i, 0, b);
                }
            }
        }
    }
    return undefined;
}



/**
 * A tournament is light if there is no arc uv such that there exists a cycle abc such that abc dominates u and v dominates abcs.
 * If you want to get a conflict, if there is some, use the function tournamentLightConflict
 * @param g 
 * @returns 
 */
export function isTournamentLight<V,L>(g: Graph<V,L>): boolean {
    const m = g.getDirectedMatrix();
    if (typeof searchHeavyArc(m) == "undefined"){
        return true;
    } else {
        return false;
    }
}