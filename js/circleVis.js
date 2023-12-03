class CircleVis {
  constructor(parentElement, stateName) {
    var clean_state = stateName.replace(/\s/, "_").toLowerCase();
    this.state = clean_state;
    this.stateName = stateName;
    this.parentElement = parentElement;
    this.data = [];
    this.raceSummary = "";
    this.initVis();
  }

  getRaceSummary(data) {
    console.log(data);

    const general_candidates = data.filter(
      (x) => x.election_status.search("GENERAL") != -1
    );
    const winner = general_candidates
      .filter((x) => x.election_status.search("WON") != -1)
      .map((x) => getName(x.candidate))
      .join(" and ");

    var summary = "";
    summary += `<p>${data.length} candidates ran for the Senate in ${this.stateName} in ${data[0].election_year}, `;
    summary += `raising a total of $${(
      data.map((d) => d.total_$).reduce((pS, a) => pS + a, 0) /
      10 ** 6
    ).toFixed(1)} million.</p>`;
    summary += `<p>${winner} won the election.</p>`;

    d3.select("#race-info").html(summary);
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
      this.raceSummary = this.getRaceSummary(data);

      d3.select("#map-title").text(
        `Candidate totals for ${vis.stateName}'s ${data[0].election_year} Senate Race`
      );

      const legend_colors = [...vis.color.range(), "#4a4"];
      const legend_labels = [
        "Republican",
        "Democrat",
        "Third Party",
        "Won election",
      ];

      vis.legend = vis.svg
        .append("g")
        .attr("id", "circle-legend")
        .attr("transform", `translate(${10},${vis.height - 120})`)
        .attr("opacity", 0);

      vis.legend
        .selectAll("rect")
        .data(legend_colors)
        .enter()
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("x", 5)
        .attr("y", (d, i) => i * 20)
        .attr("fill", (d) => d);

      vis.legend
        .selectAll("text")
        .data(legend_labels)
        .enter()
        .append("text")
        .attr("x", 20)
        .attr("y", (d, i) => 10 + i * 20)
        .text((d) => d);

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
            .radius((d) => vis.radius(d.total_$) + 5)
            .iterations(1)
        ); // Force that avoids circle overlapping

      vis.updateVis();
    });
  }

  updateVis() {
    let vis = this;

    vis.radius.domain(d3.extent(vis.data.map((d) => d.total_$)));

    vis.legend.transition().duration(500).delay(500).attr("opacity", 1);

    vis.nodes
      .attr("r", (d) => vis.radius(d.total_$))
      .attr("opacity", 0)
      .attr("fill", (d) => vis.color(d.general_party))
      .attr("stroke", (d) => (d.status_of_candidate == "WON" ? "#4a4" : "#aaa"))
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

    vis.nodes
      .on("mouseover", function (event, d) {
        //   console.log(d);
        const [outcome, race] = d.election_status
          .split("-")
          .map((x) => x.toLowerCase());

        var name = getName(d.candidate);

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
      })
      .on("mouseout", function (event, d) {
        vis.tooltip
          .style("opacity", 0)
          .style("left", 0)
          .style("top", 0)
          .html(``);
      })
      .on("click", function (event, d) {
        console.log(d.candidate);
        const selectBox = document.getElementById("map-tree-candidate-select");
        const candidates = Array.from(selectBox.options).map((d) => d.value);
        const selectedIndex = candidates.indexOf(d.candidate);
        let state = state_abbrev[d.election_jurisdiction];
        new TreeMap("treeMap", state, selectedIndex);
      });
  }
}
