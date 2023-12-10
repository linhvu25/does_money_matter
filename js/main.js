
let myDivergingViz;
let myDivBarChart;

let backgroundColor = "rgb(221,255,221)"
    plotColor = "rgb(89,182,105)"
    highlightColor = "#4a7c47"

let promises = [
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"),
  d3.csv("data/max_senate_spending_2018_2020.csv"),
];

function toTitleCase(str) {
  return str.toLowerCase().replaceAll(/\(*\b(\w)/g, (x) => x.toUpperCase());
}

function getName(candidate) {
  const [last_name, first_name] = candidate.split(", ");
  var name = first_name + " " + last_name;
  name = name
    .split(" ")
    .map((x) => toTitleCase(x))
    .join(" ");

  return name;
}

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

function getStateName(abbrev) {
  return state_abbrev[abbrev];
}

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
  //new TreeMap("treeMap", "georgia");
}
