/* * * * * * * * * * * * * *
 *   Diverging Bar Chart   *
 * * * * * * * * * * * * * */

class DivergingBarChart {
  // constructor method to initialize Timeline object
  constructor(_parentElement, _data, _state, _sector) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.state = _state.replace(/\s/, "_").toLowerCase();;
    this.sector = _sector;
    this.bothCandidates = [];
    this.barData = [];

    // call initVis method
    this.initVis();
  }

  initVis() {
    let vis = this;

    // margin conventions
    vis.margin = { top: 50, right: 150, bottom: 50, left: 150 };
    vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width -
      vis.margin.left -
      vis.margin.right;
    vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height -
        vis.margin.top -
        vis.margin.bottom;

    if (vis.height < 400) vis.height = 400 - vis.margin.top - vis.margin.bottom;
    // if (vis.width < 0) vis.width = 600;
    // // vis.width = 600 - vis.margin.left - vis.margin.right;
    // vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // init drawing area
    vis.svg = d3
      .select("#" + vis.parentElement)
      .append("svg")
      .attr("width", vis.width + vis.margin.left + vis.margin.right)
      .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + (500 + vis.margin.left) + "," + (200 + vis.margin.top) + ")"
      );

    this.getCheckedCandidates();
  }

  getCheckedCandidates(){
    let vis = this;

    // Use reduce to create an array with distinct candidate names
    var uniqueCandidates = vis.data.reduce(function (accumulator, row) {
      if (!accumulator.includes(row.candidate)) accumulator.push(row.candidate)
      return accumulator
    }, [])

    var candidateNames = uniqueCandidates.map(function(candidate, index) {
      return {
        id: index + 1,
        name: candidate
      };
    });

    // Array to store checked candidate names
    vis.checkedCandidates = [];

    // Function to create dynamic checkboxes for candidates
    function createCandidateCheckbox(candidate) {
      // Create container div for each checkbox and label
      var checkboxContainer = document.createElement("div");
      checkboxContainer.className = "checkbox-container";

      // Create checkbox input element
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "checkbox" + candidate.id;
      checkbox.className = "custom-checkbox";

      // Check the first two checkboxes automatically for states that are not Georgia
      if (vis.state !== "georgia"){
        if (candidate.id <= 2){
          checkbox.checked = true;
          vis.checkedCandidates.push(candidate.name);
        }
      }

      // Add event listener to track checkbox changes
      checkbox.addEventListener("change", function(event) {
        console.log(candidate.name, checkbox.checked)
        updateCheckedCandidates(candidate.name, checkbox.checked);
      });

      // Create label for the checkbox
      var checkboxLabel = document.createElement("label");
      checkboxLabel.htmlFor = "checkbox" + candidate.id;
      checkboxLabel.className = "checkbox-label";
      checkboxLabel.appendChild(document.createTextNode(getName(candidate.name)));

      // Append checkbox and label to the container
      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(checkboxLabel);

      // Append the container to the checkboxContainer div
      document.getElementById("checkboxContainer").appendChild(checkboxContainer);
    }

    // Function to update dynamic checkboxes based on the array
    function updateCheckboxes() {
      // Clear existing checkboxes
      var checkboxContainer = document.getElementById("checkboxContainer");
      checkboxContainer.innerHTML = "";

      // Loop through the array and create checkboxes
      candidateNames.forEach(function(candidate) {
        createCandidateCheckbox(candidate);
      });
    }

    // Function to update the array of checked candidates
    function updateCheckedCandidates(candidateName, isChecked) {
      if (isChecked) vis.checkedCandidates.push(candidateName)
      else {
        // If unchecked, remove the candidate name from the array
        var index = vis.checkedCandidates.indexOf(candidateName);
        if (index !== -1) vis.checkedCandidates.splice(index, 1);
      }
      vis.bothCandidates = vis.checkedCandidates;
    }

    // Initial creation of checkboxes
    updateCheckboxes();

    this.wrangleData();
  }

  wrangleData() {
    let vis = this;
    console.log("here")

    console.log(vis.bothCandidates);

    // var candidate_select = document.getElementById("map-tree-candidate-select");
    vis.candidate1 = vis.checkedCandidates[0]
    vis.candidate2 = vis.checkedCandidates[1]

    // console.log("original data", vis.data)

    // create data for each candidate
    vis.candidate1Data = createCandidateData(vis.candidate1);
    vis.candidate2Data = createCandidateData(vis.candidate2);

    // console.log("candidate 1", vis.candidate1Data)
    // console.log("candidate 2", vis.candidate2Data)

    // function to create data for each candidate
    function createCandidateData(candidate){
      var filteredData = vis.data.filter((d) => {
        if (vis.sector === d.broad_sector) {
          if (d.candidate === candidate) return true
        }
        return false;
      });

      // subset data to broad_sector and $, rename columns
      var displayData = filteredData.map((row) => [
        row["specific_business"],
        row["total_$"]
      ]);

      displayData = displayData.map((item) => ({
        group: item["0"],
        value: item["1"]
      }));

      // extract contribution amount
      displayData.forEach((row) => {
        var money = row.value;
        row.value = Number(money.replace(/[^0-9\.-]+/g, ""));
      });

      // aggregate $ by broad_sector
      const groupedSum = displayData.reduce((accumulator, currentValue) => {
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

      let barData = myArray
          .sort((a, b) => b.total_$ - a.total_$)
          .filter((_, i) => i < 20);
      return barData;
    }

    // Perform inner join
    function innerJoin(arr1, arr2, key) {
      return arr1.reduce((result, obj1) => {
        const matchingObj = arr2.find(obj2 => obj2[key] === obj1[key]);
        if (matchingObj) {
          result.push({ ...obj1, ...matchingObj });
        }
        return result;
      }, []);
    }

    // rename total_$ in each candidate's data
    vis.candidate1Data.forEach(function(data){
      data['total_$_1'] = data['total_$'];
      delete data['total_$'];
    })
    vis.candidate2Data.forEach(function(data){
      data['total_$_2'] = data['total_$'];
      delete data['total_$'];
    })

    // combine 2 datasets
    vis.barData = innerJoin(this.candidate1Data, this.candidate2Data, 'specific_business');

    this.updateVis();
  }

  updateVis() {
    let vis = this;

    console.log(vis.barData)

    this.tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    d3.select("#bar-chart-title").html(
      `Top ${vis.barData.length} ${toTitleCase(vis.sector)} Contributors to <br>
       ${getName(vis.candidate1)} and ${getName(vis.candidate2)}`
    ).attr("class", "plot-title");

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
        .domain([0, d3.max(vis.barData, (d) => d["total_$_1"])])
        //.paddingInner(0.2);

    // Second barplot Scales
    vis.ybis = d3.scaleRadial()
        .range([innerRadius, 2])   // Domain will be defined later.
        .domain([0, d3.max(vis.barData, (d) => d["total_$_2"])]);

    // Bars
    vis.obars =
        vis.svg.append("g")
        .selectAll("path")
        .data(vis.barData)
        .enter()
        .append("path")
        .attr("fill", plotColor)
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(innerRadius)
            .outerRadius( d=>vis.y(d["total_$_1"]))
            .startAngle( d=>vis.x(d["specific_business"]))
            .endAngle( d=>vis.x(d["specific_business"]) + vis.x.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius))
        .attr("class", "bar")
            .on("mouseover", function(event, d) {
              vis.tooltip.transition()
                  .duration(200)
                  .style("opacity", .9);
              vis.tooltip.html(`
                <div class="tooltip-text">
                   <b style="color: #4a7c47; font-size:18px">${getName(vis.candidate1)}</b>
                   <p>
                   <span style="color: grey;">Business: </span> 
                   <b style="color: #4a7c47">${
                        d.specific_business
                    }</b> 
                   <br/>
                   <span style="color: grey;">Contributions: </span> 
                   <b style="color: #4a7c47">${d3.format("$,")(
                        d.total_$_2
                    )}</b>
                   </p>          
               </div>`)
                  .style("left", (event.pageX) + "px")
                  .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
              vis.tooltip.transition()
                  .duration(500)
                  .style("opacity", 0)});
        // .attr("transform", "translate(100,400)")

  vis.ibars =
      vis.svg.append("g")
        .selectAll("path")
        .data(vis.barData)
        .enter()
        .append("path")
        .attr("fill", "red")
        .attr("d", d3.arc()     // imagine your doing a part of a donut plot
            .innerRadius(vis.ybis(0))
            .outerRadius( d=>vis.ybis(d["total_$_2"]))
            .startAngle( d=>vis.x(d["specific_business"]))
            .endAngle( d=>vis.x(d["specific_business"]) + vis.x.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius))
        .attr("class", "bar")
          .on("mouseover", function(event, d) {
      vis.tooltip.transition()
          .duration(200)
          .style("opacity", .9);
      vis.tooltip.html(`
            <div class="tooltip-text">
               <b style="color: #4a7c47; font-size:18px">${getName(vis.candidate2)}</b>
               <p>
               <span style="color: grey;">Business: </span> 
               <b style="color: #4a7c47">${
            d.specific_business
        }</b> 
               <br/>
               <span style="color: grey;">Contributions: </span> 
               <b style="color: #4a7c47">${d3.format("$,")(
            d.total_$_2
        )}</b>
               </p>          
           </div>`)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px");
    })
        .on("mouseout", function(event, d) {
          vis.tooltip.transition()
              .duration(500)
              .style("opacity", 0)});

    vis.ibars.exit().remove();
    vis.obars.exit().remove()

    // Add the labels
    vis.labels = vis.svg.append("g")
        .selectAll("g")
        .data(vis.barData)
        .enter()
        .append("g")
        .attr("class", "select-text-legend")
        .attr("text-anchor", d=> (vis.x(d.specific_business) + vis.x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start")
        .attr("transform", d=>
            "rotate(" + ((vis.x(d.specific_business) + vis.x.bandwidth() / 2) * 180 / Math.PI - 90) + ")"
            +"translate(" + (vis.y(d['total_$_1'])+10) + ",0)")
        .append("text")
        .text(d=>d.specific_business.toLowerCase())
        .attr("transform", d => (vis.x(d.specific_business) + vis.x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)")
        .style("font-size", "11px")
        .attr("alignment-baseline", "middle")
        .attr("class", "bar-labels")

    vis.labels.exit().remove()
  }
}
