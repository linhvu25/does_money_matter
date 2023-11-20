class MapVis {
  constructor(parentElement, states, senateSpending) {
    this.parentElement = parentElement;
    this.senateSpending = senateSpending;
    this.us = states;
    this.displayData = [];

    this.initVis();
  }

  initVis() {
    let vis = this;
    vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };

    vis.width =
      document.getElementById(vis.parentElement).getBoundingClientRect().width -
      vis.margin.left -
      vis.margin.right;
    vis.height =
      document.getElementById(vis.parentElement).getBoundingClientRect()
        .height -
      vis.margin.top -
      vis.margin.bottom;

    vis.svg = d3
      .select("#" + this.parentElement)
      .append("svg")
      .attr("width", vis.width)
      .attr("height", vis.height)
      .attr("transform", `translate (${vis.margin.left}, ${vis.margin.top})`);

    vis.path = d3.geoPath();
    vis.states = topojson.feature(vis.us, vis.us.objects.states).features;

    vis.viewpoint = { width: 975, height: 410 };
    vis.zoom = vis.width / vis.viewpoint.width;

    vis.map = vis.svg
      .append("g")
      .attr("class", "states")
      .attr("transform", `scale(${vis.zoom} ${vis.zoom})`)
      .selectAll("path")
      .data(vis.states)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("stroke", "white")
      .attr("d", vis.path)
      .attr("fill", "#aaaaaa40");

    vis.svg
      .append("g")
      .attr("class", "map-title")
      .append("text")
      .attr("font-size", "20")
      .attr("x", vis.width / 2)
      .attr("text-anchor", "middle")
      .attr("y", vis.margin.top)
      .text("Senate races in 8 States raised more than $100M in 2018 or 2020");

    vis.wrangleData();
  }

  wrangleData() {
    let vis = this;
    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    vis.svg
      .selectAll(".state")
      .attr("fill", (d) =>
        vis.senateSpending[d.properties.name].total_$ > 100000000
          ? "#aa4aaa"
          : "#aaaaaa40"
      );
  }
}
