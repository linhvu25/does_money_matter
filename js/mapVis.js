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
      if (map_fill == "all") {
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

    vis.states
      .on("mouseover", function (event, d) {
        if (vis.scaled) return;
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
             ${
               vis.senateSpending[d.properties.name].total_$ > 100000000
                 ? "<br />(click for details)"
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

          vis.scaled = !vis.scaled;
          if (vis.scaled) {
            new CircleVis(vis.parentElement, d.properties.name);
            new TreeMap("treeMap", d.properties.name);

            vis.states.transition().duration(500).attr("fill", backgroundColor);
            d3.select(this)
              .transition()
              .duration(500)
              .attr("fill", highlightColor);
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
            d3.select("#circle-scale").select("svg").remove();

            setFill();
            d3.select("#map-title").text(
              "Senate races in 8 States cost more than $100M in 2018 or 2020"
            );
          }

          d3.select("#race-info")
            .attr("class", "support-text")
            .text(
              "States with more than $100 million in total contributions are clickable."
            );
          d3.select("#candidate-circles").transition().delay(500).remove();
        }
      });
    vis.states.on("mouseout", function (event, d) {
      vis.tooltip.style("opacity", 0).style("left", 0).style("top", 0).html(``);
    });
  }
}
