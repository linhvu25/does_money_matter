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
      .filter((_, i) => i < 10);
    console.log("bar data", vis.barData);
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
    vis.x = d3
      .scaleLinear()
      .domain([0, d3.max(vis.barData, (d) => d["total_$"])])
      .range([0, vis.width]);
    vis.svg
      .append("g")
      .attr("transform", "translate(0," + vis.height + ")")
      .call(d3.axisBottom(vis.x))
      .selectAll("text");

    // Add Y axis
    vis.y = d3
      .scaleBand()
      .range([0, vis.height])
      .domain(vis.barData.map((d) => d["specific_business"]))
      .padding(0.2);
    vis.svg.append("g").call(d3.axisLeft(vis.y));

    // Bars
    vis.svg
      .selectAll("mybar")
      .data(vis.barData)
      .join("rect")
      .attr("y", (d) => vis.y(d["specific_business"]))
      .attr("x", 0)
      .attr("height", vis.y.bandwidth())
      .attr("width", (d) => vis.x(d["total_$"]))
      .attr("fill", "#69b3a2");
  }
}
