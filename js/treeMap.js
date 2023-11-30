/* * * * * * * * * * * * * *
 *         TreeMap         *
 * * * * * * * * * * * * * */

class TreeMap {
  // constructor method to initialize Timeline object
  constructor(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.wrangledData = [];
    this.treeData = [];

    // call initVis method
    this.initVis();
  }
  initVis() {
    let vis = this;

    // margin conventions
    vis.margin = { top: 10, right: 50, bottom: 10, left: 50 };
    vis.width =
      document.getElementById(vis.parentElement).getBoundingClientRect().width -
      vis.margin.left -
      vis.margin.right;
    vis.height = 800 - vis.margin.top - vis.margin.bottom;
    // vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

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

    // append tooltip
    vis.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "pieTooltip");

    vis.wrangleData();

    d3.select("#map-tree-select").on("change", () => vis.updateVis());
  }

  wrangleData() {
    let vis = this;

    // subset data to broad_sector and $, rename columns
    vis.displayData = vis.data.map((row) => [
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
    console.log("my data", vis.wrangledData);

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    // filter data according to user selection
    var map_select = document.getElementById("map-tree-select")
        var map = map_select.options[map_select.selectedIndex].value;

    if(map === "none") {
      vis.treeData = vis.wrangledData.filter(d => (d.name !== "UNITEMIZED CONTRIBUTIONS" && d.name !== "UNCODED"))
    } else if(map === "unitemized"){
      vis.treeData = vis.wrangledData.filter(d => d.name !== "UNCODED")
    } else if(map === "uncoded"){
      vis.treeData = vis.wrangledData.filter(d => d.name !== "UNITEMIZED CONTRIBUTIONS")
    } else vis.treeData = vis.wrangledData

    console.log("my tree data", vis.treeData);

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
    // AND HERE because vis.root looks weird

    // Then d3.treemap computes the position of each element of the hierarchy
    // The coordinates are added to the root object above
    d3.treemap().size([vis.width, vis.width]).padding(4)(vis.root);

    // console.log("my root", vis.root);

    // console.log("my leaves", vis.root.leaves());
    // use this information to add rectangles:
    vis.svg
      .selectAll("rect")
      .data(vis.root.leaves())
      .enter()
      .append("rect")
      .attr("x", function (d) {
        return d.x0;
      })
      .attr("y", function (d) {
        return d.y0;
      })
      .attr("width", function (d) {
        return d.x1 - d.x0;
      })
      .attr("height", function (d) {
        return d.y1 - d.y0;
      })
      .style("stroke", "black")
      .style("fill", "#69b3a2")
      .on("mouseover", function (event, d, i) {
        // change the segment of tree map
        d3.select(this)
          .attr("stroke-width", "2px")
          .attr("stroke", "black")
          .attr("fill", "rgba(173,222,255,0.62)");

        // update tooltip
        vis.tooltip
          .style("opacity", 1)
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + "px").html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                             <p> Broad Sector: ${d.data.name}</p>
                             <p> Total donation: ${d.data.value}</p>
                        </div>`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("stroke-width", "0px").attr("fill", "#69b3a2");

        vis.tooltip
          .style("opacity", 0)
          .style("left", 0)
          .style("top", 0)
          .html(``);
      });

    // and to add the text labels
    vis.svg
      .selectAll("text")
      .data(vis.root.leaves())
      .enter()
      .append("text")
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
      .attr("fill", "white");
  }
}
