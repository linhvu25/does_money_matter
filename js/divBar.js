//linear horizontal diverging bar chart

class DivBarChart {
    constructor(_parentElement, _data, _state, _sector) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.state = _state.replace(/\s/, "_").toLowerCase();;
        this.sector = _sector;
        this.barData = [];

        // call initVis method
        this.initVis();
    }

    initVis() {

        let vis = this;

        // Dimensions & margins
        const margin = { top: 50, right: 50, bottom: 30, left: 300 };
        const width = 2000 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        // Append svg object to div
        const svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        vis.svg = svg;
        vis.margin = margin;
        vis.width = width;
        vis.height = height;



        // define scales and axes
        vis.x = d3.scaleLinear().range([0, vis.width / 2]);
        vis.y = d3.scaleBand().range([vis.height, 0]).padding(0.1);

        // initialize axes
        vis.xAxis = d3.axisBottom(vis.x).ticks(5);
        vis.yAxis = d3.axisLeft(vis.y);

        // x-axis
        vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(${vis.width / 2},0)`); // center the x-axis

        //  y-axis
        vis.svg.append("g")
            .attr("class", "y-axis");

        vis.getCheckedCandidates();
    }


    getCheckedCandidates(){
        let vis = this;

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

            // Check the first two checkboxes automatically
            if (candidate.id <= 2) {
                checkbox.checked = true;
                vis.checkedCandidates.push(candidate.name);
            }

            // Add event listener to track checkbox changes
            checkbox.addEventListener("change", function() {
                updateCheckedCandidates(candidate.name, checkbox.checked);
            });

            // Create label for the checkbox
            var checkboxLabel = document.createElement("label");
            checkboxLabel.htmlFor = "checkbox" + candidate.id;
            checkboxLabel.className = "checkbox-label";
            checkboxLabel.appendChild(document.createTextNode(candidate.name));

            // Append checkbox and label to the container
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(checkboxLabel);

            // Append the container to the checkboxContainer div
            document.getElementById("checkboxContainer2").appendChild(checkboxContainer);
        }

        // Function to update dynamic checkboxes based on the array
        function updateCheckboxes() {
            // Clear existing checkboxes
            var checkboxContainer = document.getElementById("checkboxContainer2");
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
        }

        // Initial creation of checkboxes
        updateCheckboxes();

        this.wrangleData();
    }
    wrangleData() {
        let vis = this;

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

        d3.select("#div-bar-chart-title").html(
            `Top ${vis.barData.length} ${toTitleCase(vis.sector)} Contributors to <br>
       ${vis.candidate1} and ${vis.candidate2}`
        ).attr("class", "plot-title");

        // maxTotal is max value for total_$ across all candidates and specific businesses
        const maxTotal = d3.max(vis.barData, d => Math.max(Math.abs(d.total_$_1), Math.abs(d.total_$_2)));

        //console.log(maxTotal)

        // Update domain of the x scale to be symmetrical around the central axis
        vis.x.domain([-maxTotal, maxTotal]);

        //console.log("x domain")
        //console.log(vis.x.domain)

        // Remove previous bars to update
        vis.svg.selectAll(".bar").remove();

        // Update the y-axis scale
        this.y.domain(this.barData.map(d => d.specific_business));

        // Call the axes to update them
        this.svg.select(".x-axis")
            .attr("transform", `translate(0,${vis.height})`) // put x-axis at bottom
            .call(vis.xAxis);

        this.svg.select(".y-axis").call(vis.yAxis);

        // Draw bars for candidate1 on left side of axis
        vis.svg.selectAll(".bar.candidate1")
            .data(vis.barData)
            .enter()
            .append("rect")
            .attr("class", "bar candidate1")
            .attr("x", d => vis.x(Math.min(0, -d.total_$_1))) // Position bars on the neg side of axis
            .attr("y", d => vis.y(d.specific_business))
            .attr("width", d => Math.abs(vis.x(0) - vis.x(-d.total_$_1))) // Width = distance from zero
            .attr("height", vis.y.bandwidth())
            .attr("fill", "green");

        //console.log("bar candidate 1")

        // Draw bars for candidate2 on right side of axis
        vis.svg.selectAll(".bar.candidate2")
            .data(vis.barData)
            .enter()
            .append("rect")
            .attr("class", "bar candidate2")
            .attr("x", vis.x(0)) // Start at the central axis
            .attr("y", d => vis.y(d.specific_business))
            .attr("width", d => Math.abs(vis.x(d.total_$_2) - vis.x(0))) // width = distance from zero
            .attr("height", vis.y.bandwidth())
            .attr("fill", "red");

        // Remove previous labels to update
        vis.svg.selectAll(".candidate-label").remove();

        // Calculate the center position for the left side label
        const leftLabelX = vis.x(0) - (vis.width / 7);

        // Calculate the center position for the right side label
        const rightLabelX = vis.x(0) + (vis.width / 7);

        // Add candidate label for candidate1 above the left side bars
        vis.svg.append("text")
            .attr("class", "candidate-label") // CSS class for styling after
            .attr("x", leftLabelX) // Centered above the left bars
            .attr("y", 0) // Positioned just at top of the x-axis
            .attr("dy", "-0.5em") // Slightly above the x-axis line
            .style("text-anchor", "middle") // center the text above the bar?
            .text(vis.candidate1); // Candidate1 name from constructor

        // Add candidate label for candidate2 above the right bars
        vis.svg.append("text")
            .attr("class", "candidate-label")
            .attr("x", rightLabelX)
            .attr("y", 0)
            .attr("dy", "-0.5em")
            .style("text-anchor", "middle")
            .text(vis.candidate2);
    }

}