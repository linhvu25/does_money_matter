/* * * * * * * * * * * * * *
 *   Diverging Bar Chart   *
 * * * * * * * * * * * * * */

class DivergingBarChart {
  // constructor method to initialize Timeline object
  constructor(_parentElement, _state, sector) {
    this.parentElement = _parentElement;
    var clean_state = _state.replace(/\s/, "_").toLowerCase();
    this.state = clean_state;
    this.sector = sector;
    this.data = [];
    this.barData = [];

    // call initVis method
    this.getData();
  }

  getData() {
    let vis = this;

    d3.csv(`data/candidate_totals/${vis.state}.csv`).then((data) => {
      vis.data = data;
      vis.initVis();
    });
  }

  initVis() {
    let vis = this;

    // margin conventions
    vis.margin = { top: 10, right: 50, bottom: 20, left: 300 };
    vis.width =
      document.getElementById(vis.parentElement).getBoundingClientRect().width -
      vis.margin.left -
      vis.margin.right;
    if (vis.width < 0) vis.width = 800;
    // vis.width = 600 - vis.margin.left - vis.margin.right;
    vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // init drawing area
    vis.svg = d3
      .select("#" + vis.parentElement)
      .append("svg")
      .attr("width", vis.width + vis.margin.left + vis.margin.right)
      .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + vis.margin.left + "," + vis.margin.top + ")"
      );

    this.wrangleData();
  }

  wrangleData() {
    let vis = this;

    var candidate_select = document.getElementById("map-tree-candidate-select");
    vis.candidate =
      candidate_select.options[candidate_select.selectedIndex].value;

    vis.filteredData = vis.data.filter((d) => {
      if (vis.sector == d.broad_sector) {
        if (vis.candidate == "all") return true;
        else if (d.candidate == vis.candidate) {
          return true;
        }
      }
      return false;
    });

    // subset data to broad_sector and $, rename columns
    vis.displayData = vis.filteredData.map((row) => [
      row["specific_business"],
      row["total_$"],
    ]);
    vis.displayData = vis.displayData.map((item) => ({
      group: item["0"],
      value: item["1"],
    }));

    // extract contribution amount
    vis.displayData.forEach((row) => {
      var money = row.value;
      row.value = Number(money.replace(/[^0-9\.-]+/g, ""));
    });

    // aggregate $ by broad_sector
    const groupedSum = vis.displayData.reduce((accumulator, currentValue) => {
      const { group, value } = currentValue;

      // Check if the group is already in the accumulator
      // Initialize the sum for the group if not present
      if (!accumulator[group]) accumulator[group] = 0;

      // Add the value to the sum for the current group
      accumulator[group] += value;

      return accumulator;
    }, {});

    // convert to array
    const myArray = Object.keys(groupedSum).map((key) => ({
      specific_business: key,
      total_$: groupedSum[key],
    }));

    vis.barData = myArray
      .sort((a, b) => b.total_$ - a.total_$)
      .filter((_, i) => i < 20);
    this.updateVis();
  }

  updateVis() {
    let vis = this;

    d3.select("#bar-chart-title").text(
      `Top ${vis.barData.length} ${toTitleCase(vis.sector)} Contributors to ${
        vis.candidate == "all" ? "All Candidates" : getName(vis.candidate)
      }`
    );

    // X axis
    vis.x = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing
        .domain(vis.barData.map((d) => d["specific_business"]))
    //vis.svg.append("g").call(d3.axisLeft(vis.x));

    // Y axis
    let innerRadius = 90,
        outerRadius = Math.min(vis.width, vis.height) / 2;

    vis.y = d3.scaleRadial()
        .range([innerRadius, outerRadius])   // Domain will be define later.
        .domain([0, d3.max(vis.barData, (d) => d["total_$"])])
        //.paddingInner(0.2);

    // Bars
    vis.svg
        .selectAll("path")
        .data(vis.barData)
        .enter()
        .append("path")
        .attr("fill", plotColor)
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(innerRadius)
            .outerRadius( d=>vis.y(d["total_$"]))
            .startAngle( d=>vis.x(d["specific_business"]))
            .endAngle( d=>vis.x(d["specific_business"]) + vis.x.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius))
        .attr("transform", "translate(100,400)")


  }
}
