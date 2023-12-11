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

    console.log(
      document.getElementById(vis.parentElement).getBoundingClientRect().width,
      document.getElementById(vis.parentElement).getBoundingClientRect().height
    );

    if (vis.height < 400) vis.height = 400;

    vis.svg = d3
      .select("#" + this.parentElement)
      .append("svg")
      .attr("width", vis.width)
      .attr("height", vis.height)
      .attr("transform", `translate (${vis.margin.left}, ${vis.margin.top})`);

    vis.color = d3.scaleSequentialSqrt(
      d3.extent(Object.values(vis.senateSpending).map((d) => d.total_$)),
      d3.interpolateGreens
    );

    vis.path = d3.geoPath();
    vis.states = topojson.feature(vis.us, vis.us.objects.states).features;

    vis.viewpoint = { width: 975, height: 410 };
    vis.zoom = vis.width / vis.viewpoint.width;
    vis.scaled = false;

    var lg = vis.svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "map-gradient") //id of the gradient
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "100%");
    lg.append("stop")
      .attr("offset", "0%")
      .style(
        "stop-color",
        vis.color(Object.values(vis.senateSpending).map((d) => d.total_$)[0])
      )
      .style("stop-opacity", 1);

    lg.append("stop")
      .attr("offset", "100%")
      .style("stop-color", vis.color(0))
      .style("stop-opacity", 1);

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

    vis.mapScale = d3
      .select("#map-scale")
      .append("svg")
      .attr("height", 190)
      .attr("width", 80)
      .append("g")
      .attr("id", "map-legend");

    var mapScaleTicks = [0, 25, 100, 200, 529];
    vis.mapScale
      .selectAll("line")
      .data(mapScaleTicks)
      .enter()
      .append("line")
      .attr("y1", (d) => 181 - 170 * Math.sqrt(d / 529))
      .attr("y2", (d) => 181 - 170 * Math.sqrt(d / 529))
      .attr("x1", 0)
      .attr("x2", 28)
      .attr("stroke-width", "2")
      .attr("stroke", (d) => vis.color(d * 10 ** 6));

    vis.mapScale
      .selectAll("text")
      .data(mapScaleTicks)
      .enter()
      .append("text")
      .attr("y", (d) => 185 - 170 * Math.sqrt(d / 529))
      .attr("x", 30)
      .attr("font-size", 12)
      .text((d) => (d == 0 ? "$0" : `$${d}M`));

    vis.mapScale
      .append("rect")
      .attr("x", 0)
      .attr("y", 10)
      .attr("height", 170)
      .attr("width", 20)
      .attr("fill", "url(#map-gradient)");

    d3.select("#map-title")
      .text("Senate races in 8 States cost more than $100M in 2018 or 2020")
      .attr("class", "plot-title");

    vis.tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .attr("id", "map-tooltip")
      .attr("opacity", 1);

    d3.select("#map-fill-select").on("change", () => {
      if (vis.scaled) return;
      vis.updateVis();
    });

    vis.wrangleData();
  }

  wrangleData() {
    let vis = this;
    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    function setFill() {
      var map_fill_select = document.getElementById("map-fill-select");
      var map_fill =
        map_fill_select.options[map_fill_select.selectedIndex].value;
      if (map_fill === "all") {
        vis.states
          .transition()
          .duration(500)
          .attr("fill", (d) =>
            vis.color(vis.senateSpending[d.properties.name].total_$)
          );
      } else {
        vis.states
          .transition()
          .duration(500)
          .attr("fill", (d) =>
            vis.senateSpending[d.properties.name].total_$ > 100000000
              ? vis.color(vis.senateSpending[d.properties.name].total_$)
              : backgroundColor
          );
      }
    }
    setFill();

    vis.height =
      document.getElementsByClassName("states")[0].getBoundingClientRect()
        .height -
      vis.margin.top -
      vis.margin.bottom +
      90;

    if (!vis.scaled) vis.svg.attr("height", vis.height);

    d3.csv(`data/candidate_totals/maine.csv`).then((data) => {
      new TreeMap("treeMap", "Maine", data);
    });

    vis.states
      .on("mouseover", function (event, d) {
        if (vis.scaled) return;
        vis.tooltip
          .style("opacity", 1)
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + "px").html(`
          <div class="tooltip-text">
             <b style="color: #4a7c47; font-size:18px">${d.properties.name}</b>
             <p> 
             <span style="color: grey;">Year: </span> 
             <b style="color: #4a7c47">${
               vis.senateSpending[d.properties.name].election_year
             }</b> 
             <br/>
             <span style="color: grey;">Total contributions: </span> 
             <b style="color: #4a7c47">${d3.format("$,")(
               vis.senateSpending[d.properties.name].total_$
             )}</b>
             ${d.properties.name == "Georgia" ? "<br />(2 races)" : ""}
             ${
               vis.senateSpending[d.properties.name].total_$ > 100000000
                 ? '<br /><b style="color: #4a7c47;">click for details</b>'
                 : ""
             }
             </p>          
         </div>`);
      })
      .on("click", function (event, d) {
        if (
          vis.scaled ||
          vis.senateSpending[d.properties.name].total_$ > 100000000
        ) {
          vis.svg
            .select(".states")
            .transition()
            .duration(500)
            .attr(
              "transform",
              vis.scaled
                ? `translate(0,20), scale(${vis.zoom} ${vis.zoom})`
                : `translate(0,20), scale(${vis.zoom / 3} ${vis.zoom / 3})`
            );

          //d3.selectAll("#candidate-image").remove();

          vis.scaled = !vis.scaled;
          if (vis.scaled) {
            new CircleVis(vis.parentElement, d.properties.name);

            var state_name = d.properties.name.replace(/\s/, "_").toLowerCase();
            d3.csv(`data/candidate_totals/${state_name}.csv`).then((data) => {
              new TreeMap("treeMap", d.properties.name, data);
            });

            vis.states.transition().duration(500).attr("fill", backgroundColor);
            d3.select(this)
              .transition()
              .duration(500)
              .attr("fill", (d) =>
                vis.color(vis.senateSpending[d.properties.name].total_$)
              );
            d3.select("#map-desc").html(``);
          } else {
            d3.select("#candidate-circles")
              .transition()
              .duration(250)
              .attr("opacity", 0);

            d3.select("#circle-legend")
              .transition()
              .duration(250)
              .attr("opacity", 0);

            d3.select("#circle-legend").transition().delay(500).remove();
            d3.select("#circle-scale")
              .select("svg")
              .transition()
              .duration(250)
              .attr("opacity", 0)
              .remove();

            setFill();
            d3.select("#map-title")
              .text(
                "Senate races in 8 States cost more than $100M in 2018 or 2020"
              )
              .attr("class", "plot-title");

            d3.select("#map-desc").html(`<h6>
            The cost displayed is the total money raised by all candidates
            in the race.<br />
            <b>Click</b> on senate races that cost more than $100M to
            learn more.
          </h6>`);
          }

          //d3.selectAll("#candidate-image").remove();

          d3.select("#race-info")
            .attr("class", "support-text")
            .text(
              "States with more than $100 million in total contributions are clickable."
            );
          d3.select("#candidate-circles").transition().delay(500).remove();
          //d3.select("#candidate-image").remove();
        }
      });
    vis.states.on("mouseout", function (event, d) {
      vis.tooltip.style("opacity", 0).style("left", 0).style("top", 0).html(``);
    });
  }
}
