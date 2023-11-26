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

    vis.color = d3.scaleSequentialSqrt(
      d3.extent(Object.values(vis.senateSpending).map((d) => d.total_$)),
      d3.interpolateBlues
    );

    vis.path = d3.geoPath();
    vis.states = topojson.feature(vis.us, vis.us.objects.states).features;

    vis.viewpoint = { width: 975, height: 410 };
    vis.zoom = vis.width / vis.viewpoint.width;

    vis.svg
      .append("g")
      .attr("class", "states")
      .attr("transform", `translate(0,20), scale(${vis.zoom} ${vis.zoom})`)
      .selectAll("path")
      .data(vis.states)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("stroke", "white")
      .attr("d", vis.path)
      .attr("fill", "#aaaaaa40");

    vis.states = vis.svg.selectAll(".state");

    vis.svg
      .append("g")
      .attr("class", "map-title")
      .append("text")
      .attr("font-size", "20")
      .attr("x", vis.width / 2)
      .attr("text-anchor", "middle")
      .attr("y", vis.margin.top)
      .text("Senate races in 8 States cost more than $100M in 2018 or 2020");

    vis.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("opacity", 1);

    d3.select("#map-fill-select").on("change", () => vis.updateVis());

    vis.wrangleData();
  }

  wrangleData() {
    let vis = this;
    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    var map_fill_select = document.getElementById("map-fill-select");
    var map_fill = map_fill_select.options[map_fill_select.selectedIndex].value;

    if (map_fill == "all") {
      vis.states.attr("fill", (d) =>
        vis.color(vis.senateSpending[d.properties.name].total_$)
      );
    } else {
      vis.states.attr("fill", (d) =>
        vis.senateSpending[d.properties.name].total_$ > 100000000
          ? "rgb(56, 136, 193)"
          : "rgb(223, 235, 247)"
      );
    }

    vis.height =
      document.getElementsByClassName("states")[0].getBoundingClientRect()
        .height -
      vis.margin.top -
      vis.margin.bottom +
      90;

    vis.svg.attr("height", vis.height);

    vis.states.on("mouseover", function (event, d) {
      vis.tooltip
        .style("opacity", 1)
        .style("left", event.pageX + 20 + "px")
        .style("top", event.pageY + "px").html(`
         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 5px; padding-bottom: 0px;">
             <h6>${d.properties.name}</h6>
             <p>Year: ${
               vis.senateSpending[d.properties.name].election_year
             }<br/>Total contributions: ${d3.format("$,")(vis.senateSpending[d.properties.name].total_$)}
             ${d.properties.name == "Georgia" ? "<br />(2 races)" : ""}
             </p>          
         </div>`);
    });
    vis.states.on("mouseout", function (event, d) {
      //   d3.select(this).attr("fill", (d) =>
      //     vis.color(vis.stateInfoObject[d.properties.name][selectedCategory])
      //   );
      vis.tooltip.style("opacity", 0).style("left", 0).style("top", 0).html(``);
    });
  }
}
