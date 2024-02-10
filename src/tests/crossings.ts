import { BasicGraph } from "../graph";

/*
     2
g1 = |
     0-1
*/
const g1 = BasicGraph.from([[0,0,""], [1,0,""], [0,1,""]], [[0,1,""],[0,2,""]]);
console.log(g1.crossings().length == 0)


/*
     2 3
g2 =  X
     0 1
*/
const g2 = BasicGraph.from([[0,0,""], [1,0,""], [0,1,""], [1,1,""]], [[0,3,""],[1,2,""]]);
console.log(g2.crossings().length == 1)

// Test for precision
const g3 = BasicGraph.from([
    [237.9665396129149,  223.56762344482667, ""],
    [206.81395334397183, 175.86737741460786, ""],
    [260.33205307691446, 188.3506392441002, ""]
], [[0,1,""], [0,2,""]])
console.log(g3.crossings().length == 0);
    
