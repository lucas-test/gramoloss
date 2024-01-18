import { generatePaleyGraph, generateRandomTournament, generateTestTournament, generateUGTournament, generateUTournament } from "../generators";
import { AbstractGraph } from "../graph_abstract";


// console.time("test")
// let sum = 0;
// const m = 1000;
// for (let n = 4; n < 19 ; n ++){
//     sum = 0;
//     for (let i = 0 ; i < m ; i ++){
//         // console.time("test")
//         const t = generateRandomTournament(n);
//         const [dw, ordering] = t.degreewidth();
//         // console.log(dw);
//         sum += dw;
//         // console.timeEnd("test")
//     }
//     console.log(n, (sum/m).toFixed(5), (sum/m - (3*n-7)/8).toFixed(5) );
    
// }
// console.timeEnd("test")


// This is tournament (4s) for which the algo is slow
// const badT = AbstractGraph.fromArcsListDefault([[0, 1],[0, 2],[2, 1],[3, 0],[3, 1],[2, 3],[0, 4],[4, 1],[4, 2],[3, 4],[0, 5],[1, 5],[2, 5],[5, 3],[5, 4],[6, 0],[1, 6],[6, 2],[6, 3],[4, 6],[5, 6],[7, 0],[1, 7],[2, 7],[3, 7],[7, 4],[7, 5],[7, 6],[0, 8],[8, 1],[2, 8],[3, 8],[4, 8],[8, 5],[8, 6],[7, 8],[9, 0],[1, 9],[9, 2],[3, 9],[4, 9],[5, 9],[6, 9],[9, 7],[8, 9],[10, 0],[1, 10],[10, 2],[3, 10],[4, 10],[5, 10],[6, 10],[7, 10],[10, 8],[9, 10],[11, 0],[1, 11],[11, 2],[3, 11],[4, 11],[11, 5],[6, 11],[7, 11],[8, 11],[9, 11],[11, 10],[12, 0],[12, 1],[12, 2],[12, 3],[12, 4],[12, 5],[6, 12],[12, 7],[12, 8],[12, 9],[12, 10],[12, 11],[0, 13],[13, 1],[13, 2],[3, 13],[13, 4],[13, 5],[13, 6],[13, 7],[13, 8],[13, 9],[10, 13],[13, 11],[12, 13],[14, 0],[14, 1],[14, 2],[3, 14],[14, 4],[14, 5],[6, 14],[14, 7],[14, 8],[9, 14],[14, 10],[14, 11],[12, 14],[14, 13],[15, 0],[1, 15],[15, 2],[3, 15],[15, 4],[15, 5],[6, 15],[7, 15],[8, 15],[15, 9],[10, 15],[11, 15],[12, 15],[15, 13],[14, 15],[0, 16],[16, 1],[16, 2],[3, 16],[4, 16],[5, 16],[6, 16],[7, 16],[16, 8],[9, 16],[16, 10],[11, 16],[16, 12],[13, 16],[16, 14],[16, 15],[0, 17],[17, 1],[2, 17],[3, 17],[17, 4],[17, 5],[6, 17],[17, 7],[17, 8],[9, 17],[10, 17],[17, 11],[12, 17],[13, 17],[17, 14],[15, 17],[17, 16],[0, 18],[1, 18],[2, 18],[3, 18],[18, 4],[18, 5],[6, 18],[7, 18],[8, 18],[18, 9],[18, 10],[18, 11],[18, 12],[18, 13],[18, 14],[15, 18],[18, 16],[18, 17],[19, 0],[19, 1],[2, 19],[19, 3],[4, 19],[19, 5],[6, 19],[19, 7],[8, 19],[9, 19],[10, 19],[11, 19],[19, 12],[19, 13],[19, 14],[15, 19],[16, 19],[17, 19],[19, 18],[0, 20],[1, 20],[2, 20],[3, 20],[4, 20],[20, 5],[20, 6],[7, 20],[8, 20],[9, 20],[10, 20],[20, 11],[12, 20],[13, 20],[14, 20],[20, 15],[16, 20],[17, 20],[18, 20],[19, 20],[0, 21],[21, 1],[2, 21],[21, 3],[4, 21],[5, 21],[21, 6],[21, 7],[21, 8],[9, 21],[10, 21],[11, 21],[12, 21],[13, 21],[21, 14],[15, 21],[16, 21],[17, 21],[18, 21],[21, 19],[20, 21],[22, 0],[22, 1],[2, 22],[3, 22],[22, 4],[5, 22],[6, 22],[22, 7],[8, 22],[22, 9],[10, 22],[22, 11],[22, 12],[22, 13],[14, 22],[22, 15],[22, 16],[22, 17],[22, 18],[19, 22],[20, 22],[21, 22],[23, 0],[1, 23],[23, 2],[23, 3],[23, 4],[23, 5],[6, 23],[7, 23],[23, 8],[9, 23],[23, 10],[23, 11],[12, 23],[23, 13],[14, 23],[23, 15],[23, 16],[23, 17],[18, 23],[19, 23],[23, 20],[23, 21],[22, 23],[24, 0],[24, 1],[2, 24],[3, 24],[4, 24],[24, 5],[6, 24],[7, 24],[24, 8],[24, 9],[10, 24],[24, 11],[24, 12],[24, 13],[24, 14],[24, 15],[16, 24],[17, 24],[24, 18],[19, 24],[20, 24],[21, 24],[22, 24],[24, 23]]);

// console.time("test");
// const [dw, ordering] = badT.degreewidth();
// console.log(dw);
// console.timeEnd("test");





// for (let i = 0 ; i < 10 ; i ++){
//     const start = Date.now();
    
//     const t = generateRandomTournament(25);
   
//     const [dw, ordering] = t.degreewidth();
   
//     if (Date.now() - start > 1000){
//         const arcs = t.arcsList();
//         for (const arc of arcs){
//             console.log(`[${arc[0]}, ${arc[1]}],`)
//         }
//         console.log(dw);
//     }
// }


// console.time("test")
// console.log(generateTestTournament(20).degreewidth());
// console.timeEnd("test");


// Conjecture dw(UG(n,k)) = k if n >= 2k+1
console.log(generateUGTournament(5,2).degreewidth()[0]);
console.log(generateUGTournament(7,3).degreewidth()[0]);

// Regular tournament => dw(2n+1) = n
console.log(generatePaleyGraph(19).degreewidth()[0]);

// U-tournament => dw(Un) = 1 if n >= 3
console.log(generateUTournament(2).degreewidth())
console.log(generateUTournament(4).degreewidth())
console.log(generateUTournament(5).degreewidth())
console.log(generateUTournament(6).degreewidth())
