import { AbstractGraph } from "../graph_abstract";

const g0 = AbstractGraph.fromArcsListDefault([[0, 1]]);
console.log(g0.strongly_connected_components().length == 2);

const g1 = AbstractGraph.fromArcsListDefault([[0, 1], [1, 2]]);
console.log(g1.strongly_connected_components().length == 3);

const g2 = AbstractGraph.fromArcsListDefault([[0,1],[1,2],[2,0],[3,2],[3,4],[4,5],[5,3]]);
console.log(g2.strongly_connected_components().length == 2)

const g3 = AbstractGraph.fromArcsListDefault([[0,1],[1,2],[2,0]]);
console.log(g3.strongly_connected_components().length == 1)

const g4 = AbstractGraph.fromArcsListDefault([[0,1],[1,2],[2,3],[3,0],[3,1],[1,4],[4,5],[5,3]]);
console.log(g4.strongly_connected_components().length == 1);