class CircleVis {
  constructor(parentElement, stateName) {
    var clean_state = stateName.replace(/\s/, "_").toLowerCase();
    this.state = clean_state;
    this.stateName = stateName;
    this.parentElement = parentElement;
    this.data = [];
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.svg = d3.select("#" + this.parentElement).select("svg");
    vis.radius = d3.scaleLinear().range([5, 120]);
    vis.color = d3
      .scaleOrdinal()
      .range(["#d30b0d", "rgb(56, 136, 193)", "#f1aa32"])
      .domain(["REPUBLICAN", "DEMOCRATIC", "THIRD-PARTY"]);

    vis.width = vis.svg._groups[0][0].width.baseVal.value;
    vis.height = vis.svg._groups[0][0].height.baseVal.value;

    vis.tooltip = d3.select("#map-tooltip");

    // read in data for state
    d3.csv(`data/race_totals/${this.state}.csv`).then((data) => {
      const numCols = ["#_of_records", "election_year", "total_$"];
      data = data.map((row) => {
        for (var col of numCols) {
          row[col] = parseInt(row[col].replace(/\D/g, ""));
        }
        return row;
      });
      vis.data = data;

      d3.select("#map-title").text(
        `Candidate totals for ${vis.stateName}'s ${data[0].election_year} Senate Race`
      );

      vis.nodes = vis.svg
        .append("g")
        .attr("id", "candidate-circles")
        .attr("opacity", 1)
        .selectAll(".candidate-circle")
        .data(vis.data)
        .enter()
        .append("circle")
        .attr("class", "candidate-circle");

      vis.simulation = d3
        .forceSimulation()
        .force(
          "center",
          d3
            .forceCenter()
            .x(vis.width / 2 + 50)
            .y(vis.height / 2)
        ) // Attraction to the center of the svg area
        .force("charge", d3.forceManyBody().strength(0.2)) // Nodes are attracted one each other of value is > 0
        .force(
          "collide",
          d3
            .forceCollide()
            .strength(0.2)
            .radius((d) => vis.radius(d.total_$) + 2)
            .iterations(1)
        ); // Force that avoids circle overlapping

      vis.updateVis();
    });
  }

  updateVis() {
    let vis = this;
    console.log(vis.data[0]);

    vis.radius.domain(d3.extent(vis.data.map((d) => d.total_$)));

    vis.nodes
      .attr("r", (d) => vis.radius(d.total_$))
      .attr("opacity", 0)
      .attr("fill", (d) => vis.color(d.general_party))
      .attr("stroke", (d) => (d.status_of_candidate == "WON" ? "#0f0" : "#aaa"))
      .attr("stroke-width", (d) => (d.status_of_candidate == "WON" ? 4 : 0))
      .transition()
      .duration(500)
      .delay(500)
      .attr("opacity", 1);

    vis.simulation.nodes(vis.data).on("tick", function (d) {
      vis.nodes
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        });
    });

    vis.nodes.on("mouseover", function (event, d) {
      //   console.log(d);
      const [outcome, race] = d.election_status
        .split("-")
        .map((x) => x.toLowerCase());

      const [last_name, first_name] = d.candidate.split(", ");
      var name = first_name + " " + last_name;
      name = name
        .split(" ")
        .map((x) => toTitleCase(x))
        .join(" ");

      vis.tooltip
        .style("opacity", 1)
        .style("left", event.pageX + 20 + "px")
        .style("top", event.pageY + "px").html(`
         <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 5px; padding-bottom: 0px;">
             <h6>${name}</h6>
             <p>
             ${toTitleCase(d.incumbency_status)}.<br/>
             Total contributions: ${d3.format("$,")(d.total_$)}<br/>
             ${outcome.replace(/^(\w)/, (x) =>
               x.toUpperCase()
             )} in the ${race} election.
             </p>          
         </div>`);
    });

    vis.nodes.on("mouseout", function (event, d) {
      vis.tooltip.style("opacity", 0).style("left", 0).style("top", 0).html(``);
    });
  }
}
