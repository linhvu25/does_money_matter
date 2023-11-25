let promises = [
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"),
  d3.csv("data/max_senate_spending_2018_2020.csv"),
];

const state_abbrev = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

Promise.all(promises).then((data) => {
  let [states, senate_spending_raw] = data;
  senateSpending = {};
  Array.from(senate_spending_raw).forEach((element) => {
    for (const [key, value] of Object.entries(element)) {
      if (key != "election_jurisdiction") {
        element[key] = parseInt(value.replaceAll(/\D/g, ""));
      }
    }
    var state = state_abbrev[element.election_jurisdiction];

    senateSpending[state] = element;
  });
  initVis(states, senateSpending);
});

function initVis(states, senateSpending) {
  myMapVis = new MapVis("map-svg", states, senateSpending);
}

d3.csv("data/2020_senate_AZ_candidates.csv").then((data) => {
  myPieChart = new PieChart("pieDivRight", data);
  myTreeMap = new TreeMap('treeMap', data)

});


// EXAMPLE from here: https://d3-graph-gallery.com/graph/treemap_basic.html
// Read data
d3.csv('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_hierarchy_1level.csv').then((data) => {

  console.log("example data", data);

  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 445 - margin.left - margin.right,
      height = 445 - margin.top - margin.bottom;

// append the svg object to the body of the page
  var svg = d3.select("#treeMap")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  // stratify the data: reformatting for d3.js
  var root = d3.stratify()
      .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
      .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
      (data);
  root.sum(function(d) { return +d.value })   // Compute the numeric value for each entity

  console.log("example root", root)

  // Then d3.treemap computes the position of each element of the hierarchy
  // The coordinates are added to the root object above
  d3.treemap()
      .size([width, height])
      .padding(4)
      (root)

  console.log("example leaves", root.leaves())
  // use this information to add rectangles:
  svg
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr('x', function (d) {
        console.log(d.x0)
        return d.x0
      })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("stroke", "black")
      .style("fill", "#69b3a2");

  // and to add the text labels
  svg
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("x", function(d){ return d.x0+10})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
      .text(function(d){ return d.data.name})
      .attr("font-size", "15px")
      .attr("fill", "white")
})