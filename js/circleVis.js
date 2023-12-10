class CircleVis {
  constructor(_parentElement, _stateName) {
    this.state = _stateName.replace(/\s/, "_").toLowerCase();
    this.stateName = _stateName;
    this.parentElement = _parentElement;
    this.data = [];
    this.initVis();
  }

  getRaceSummary(data) {
    //console.log(data);

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
    vis.radius = d3
      .scaleSqrt()
      .range([5, 100])
      .domain([0, 162 * 10 ** 6]);
    vis.color = d3
      .scaleOrdinal()
      .range(["#E81B23", "rgb(0, 21, 188)", "#f1aa32"])
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

      vis.scale = d3
        .select("#circle-scale")
        .append("svg")
        .attr("height", 200)
        .attr("width", 180)
        .attr("opacity", 0)
        .append("g")
        .attr("id", "circle-legend")
        .attr("opacity", 1);

      d3.select("#circle-scale")
        .select("svg")
        .transition()
        .duration(500)
        .attr("opacity", 1);

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
        .attr("class", "support-text")
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

    // vis.radius.domain(d3.extent(vis.data.map((d) => d.total_$)));

    vis.legend.transition().duration(500).delay(500).attr("opacity", 1);

    const scale_circles = [10 ** 6, 10 ** 7, 5 * 10 ** 7, 10 ** 8];
    // console.log(scale_circles);
    vis.scale
      .selectAll("circle")
      .data(scale_circles)
      .enter()
      .append("circle")
      .attr("stroke", "black")
      .attr("stroke-width", "2")
      .attr("fill", "none")
      .attr("r", (d) => vis.radius(d))
      .attr("cx", 100)
      .attr("cy", (d) => 100 + vis.radius(10 ** 8) - vis.radius(d));

    vis.scale
      .selectAll("text")
      .data(scale_circles)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", 100)
      .attr("y", (d) => 100 + vis.radius(10 ** 8) - 2 * vis.radius(d) - 6)
      .attr("font-size", 12)
      .text((d) => `$${d / 10 ** 6}M`);

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

    vis.simulation.nodes(vis.data).on("tick", function () {
      // Update circle positions
      vis.nodes
          .attr("cx", function (d) {
            return d.x;
          })
          .attr("cy", function (d) {
            return d.y;
          });

      // append candidate photos to respective circles

      let images = vis.svg.selectAll("image")
          .data(vis.data);

      images.enter()
          .append("image")
          .merge(images)
          .attr("xlink:href", d => "data/photos/" + d.candidate.replace(/\s/g, '') + ".jpeg")
          .attr("x", d => d.x - vis.radius(d.total_$) * 0.45)
          .attr("y", d => d.y - vis.radius(d.total_$) * 0.45)
          .attr("width", d => vis.radius(d.total_$))
          .attr("height", d => vis.radius(d.total_$))
          .attr("id", "candidate-image") // ref mapVis.js to remove when state selection updated
          .attr("class", "clip-circle") // clip into circle; ref css
          .on("error", function() {
            d3.select(this).style("display", "none"); //dont display if image does not exist for candidate
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
         <div class="tooltip-text">
             <p>
             <b style="color: #4a7c47; font-size:18px">${name}</b> <br>
             <span style="color: grey;">${toTitleCase(d.incumbency_status)}</span> <br>
             <span style="color: grey;">Total contributions:</span> 
             <b style="color: #4a7c47">${d3.format("$,")(d.total_$)}</b> <br>
             <b style="color: #4a7c47">${outcome.replace(/^(\w)/, (x) => x.toUpperCase())}</b> 
             <span style="color: grey;">in the ${race} election.</span>
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
        const selectBox = document.getElementById("map-tree-candidate-select");
        const candidates = Array.from(selectBox.options).map((d) => d.value);
        const selectedIndex = candidates.indexOf(d.candidate);
        let state = state_abbrev[d.election_jurisdiction];
        new TreeMap("treeMap", state, selectedIndex);
      });
  })
}};
