/* * * * * * * * * * * * * *
 *         TreeMap         *
 * * * * * * * * * * * * * */

class TreeMap {
  // constructor method to initialize Timeline object
  constructor(_parentElement, _state, _data) {
    this.parentElement = _parentElement;
    this.state = _state.replace(/\s/, "_").toLowerCase();
    this.data = _data;
    console.log("tree data", this.data)
    this.candidates = [
      "All Candidates",
      ...new Set(_data.map((d) => d.candidate)),
    ];
    this.year = this.data[0].election_year;
    this.displayData = [];
    this.wrangledData = [];
    this.treeData = [];

    // call initVis method
    this.initVis();
  }
  initVis() {
    let vis = this;

    // margin conventions
    vis.margin = { top: 0, right: 100, bottom: 0, left: 100 };

    vis.width =
      document.getElementById(vis.parentElement).getBoundingClientRect().width -
      vis.margin.left -
      vis.margin.right;
    vis.height = 500;
      // document.getElementById(vis.parentElement).getBoundingClientRect()
      //   .height -
      // vis.margin.top -
      // vis.margin.bottom;

    if (vis.height < 400) vis.height = 400;
    // if (vis.width < 400) vis.width = 400;

    d3.select("#" + vis.parentElement)
      .select("svg")
      .remove();

    // init drawing area
    vis.svg = d3
      .select("#" + vis.parentElement)
      .append("svg")
      .attr("width", vis.width)
      .attr("height", vis.height)
      .attr("transform", `translate (${vis.margin.left}, ${vis.margin.top})`)
        .style("fill", "#E6E3D3")
      .append("g");

    // append tooltip
    vis.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "pieTooltip");

    d3.select("#map-tree-candidate-select").selectAll("option").remove();
    d3.select("#map-tree-candidate-select")
      .selectAll("option")
      .data(vis.candidates)
      .enter()
      .append("option")
      .attr("value", (d) => (d == "All Candidates" ? "all" : d))
      .text((d) => (d == "All Candidates" ? d : getName(d)));

    vis.wrangleData();

    d3.select("#map-tree-select").on("change", () => vis.updateVis());
    d3.select("#map-tree-candidate-select").on("change", () => {
      vis.wrangleData();
      d3.select("#bar-chart-title").text("");
      d3.select("#barChart").select("svg").remove();
    });
  }

  wrangleData() {
    let vis = this;

    var candidate_select = document.getElementById("map-tree-candidate-select");
    var candidate =
      candidate_select.options[candidate_select.selectedIndex].value;
    if (candidate !== "all") {
      vis.filteredData = vis.data.filter((d) => d.candidate == candidate);
    } else {
      vis.filteredData = vis.data;
    }

    // append title
    d3.select("#tree-map-title").text(
      `${toTitleCase(vis.state.replace("_", " "))} ${
        vis.year
      } Sector Contribution totals, ${
        candidate == "all" ? "All Candidates" : getName(candidate)
      }`
    ).attr("class", "plot-title");

    // subset data to broad_sector and $, rename columns
    vis.displayData = vis.filteredData.map((row) => [
      row["broad_sector"],
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
      key,
      value: groupedSum[key],
    }));

    // create data for treeMap
    vis.wrangledData = myArray.map((item) => ({
      name: item.key,
      parent: "Origin",
      value: String(item.value),
    }));

    // add parent node
    const origin = { name: "Origin", parent: "", value: "" };
    vis.wrangledData.push(origin);

    vis.wrangledData.columns = ["name", "parent", "value"];

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    // filter data according to user selection
    var map_select = document.getElementById("map-tree-select");
    var map = map_select.options[map_select.selectedIndex].value;

    if (map === "none") {
      vis.treeData = vis.wrangledData.filter(
        (d) => d.name !== "UNITEMIZED CONTRIBUTIONS" && d.name !== "UNCODED"
      );
    } else if (map === "unitemized") {
      vis.treeData = vis.wrangledData.filter((d) => d.name !== "UNCODED");
    } else if (map === "uncoded") {
      vis.treeData = vis.wrangledData.filter(
        (d) => d.name !== "UNITEMIZED CONTRIBUTIONS"
      );
    } else vis.treeData = vis.wrangledData;

    //console.log("my tree data", vis.treeData);

    // stratify the data: reformatting for d3.js
    // BUG SOMEWHERE BETWEEN HERE
    vis.root = d3
      .stratify()
      .id((d) => d.name) // Name of the entity (column name is name in csv)
      .parentId((d) => d.parent)(
      // Name of the parent (column name is parent in csv)
      vis.treeData
    );
    vis.root.sum((d) => +d.value); // Compute the numeric value for each entity

    // Then d3.treemap computes the position of each element of the hierarchy
    // The coordinates are added to the root object above
    d3.treemap().size([vis.width, vis.height]).padding(4)(vis.root);

    // console.log("my root", vis.root);

    //console.log("my leaves", vis.root.leaves());
    // use this information to add rectangles:
    vis.leaves = vis.svg
      .selectAll("rect")
      .data(vis.root.leaves())
      .join("rect")
      .attr("x", d=>d.x0)
      .attr("y", d=>d.y0)
      .attr("width", d=>d.x1 - d.x0)
      .attr("height", d=>d.y1 - d.y0)
      .style("fill", plotColor)
      .on("mouseover", function (event, d) {
        // change the segment of tree map
        d3.select(this)
          .attr("stroke-width", "2px")
          .attr("stroke", "black")
          .style("fill", highlightColor);

        // update tooltip
        vis.tooltip
          .style("opacity", 1)
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + "px").html(`
                        <div class="tooltip-text">
                             <p> <span style="color: grey;">Broad Sector:</span> 
                             <b style="color: #4a7c47">${d.data.name}</b> 
                             <br>
                             <span style="color: grey;">Total contributions:</span> 
                             <b style="color: #4a7c47">${d3.format("$,")(d.data.value)}</b> 
                             </p>
                        </div>`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("stroke-width", "0px").style("fill", plotColor);

        vis.tooltip
          .style("opacity", 0)
          .style("left", 0)
          .style("top", 0)
          .html(``);
      })
      .on("click", function (event, d) {
        //circular diverging bar chart
        d3.select("#barChart").select("svg").remove();
        //linear diverging bar chart
        d3.select("#divBarChart").select("svg").remove();

        d3.csv(`data/candidate_totals/${vis.state}.csv`).then((data) => {
          // console.log("diverging bar", data)
          myDivergingViz = new DivergingBarChart("barChart", data, vis.state, d.id);
          myDivBarChart = new DivBarChart("divBarChart", data, vis.state, d.id);
        });
      });

    // and to add the text labels
    vis.labels = vis.svg
      .selectAll("text")
      .data(vis.root.leaves())
      .join("text")
      .attr("x", function (d) {
        return d.x0 + 10;
      }) // +10 to adjust position (more right)
      .attr("y", function (d) {
        return d.y0 + 20;
      }) // +20 to adjust position (lower)
      .text(function (d) {
        return d.data.name;
      })
      .attr("font-size", "15px")
      .attr("fill", "rgb(251, 251, 251)")
      .attr("opacity", 1);

    vis.labels.attr("opacity", function (d, i) {
      var text_width = this.getBoundingClientRect().width;
      var box_width = d.x1 - d.x0;
      if (text_width > box_width) return 0;
      return 1;
    });
  }
}
