/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables, switches, helper functions
let myPieChart

// function updateAllVisualizations(){
//     myPieChart.wrangleData()
// }

let data = [];
d3.csv("campaign_data/2020_senate_AZ_candidates.csv").then((data)=>{
    console.log(data);
    myPieChart = new PieChart('pieDivRight', data)
})
