//changes to be made:
// make dynamic for input dataset and selected candidates
// change colors of bars
// decide if we just top 10 or more general industries


class DivBarChart {
    constructor(element, data, candidate1, candidate2) {
        this.element = element;
        this.data = data;
        this.candidate1 = candidate1;
        this.candidate2 = candidate2;
        this.initVis();
    }

    initVis() {
        // Dimensions & margins
        const margin = { top: 50, right: 50, bottom: 30, left: 400 };
        const width = 1060 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        // Append svg object to div
        const svg = d3.select(this.element)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        this.svg = svg;
        this.margin = margin;
        this.width = width;
        this.height = height;

        // define scales and axes
        this.x = d3.scaleLinear().range([0, this.width / 2]);
        this.y = d3.scaleBand().range([this.height, 0]).padding(0.1);

        // initialize axes
        this.xAxis = d3.axisBottom(this.x).ticks(5);
        this.yAxis = d3.axisLeft(this.y);

        // x-axis
        this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(${this.width / 2},0)`); // ccenter the x-axis

        //  y-axis
        this.svg.append("g")
            .attr("class", "y-axis");

        this.wrangleData();
    }

    //all industries
    //to crowded, alterest to filter for top 10 in block below
/*    wrangleData() {
        // Filter data for the two candidates
        const filteredData = this.data.filter(d =>
            d.candidate === 'KELLY, MARK' || d.candidate === 'MCSALLY, MARTHA E');

        // Group by general industry
        const industryMap = d3.group(filteredData, d => d.general_industry);

        // Structure data for diverging bar chart
        this.barData = Array.from(industryMap, ([industry, values]) => {
            const totalKelly = d3.sum(values, d => d.candidate === 'KELLY, MARK' ? d.total_$ : 0);
            const totalMcSally = d3.sum(values, d => d.candidate === 'MCSALLY, MARTHA E' ? d.total_$ : 0);
            return { industry, totalKelly, totalMcSally };
        });

        this.updateVis();
    }*/

    wrangleData() {
        // Filter data for the selected candidates
        const filteredData = this.data.filter(d =>
            d.candidate === this.candidate1 || d.candidate === this.candidate2);

        // group by general industry
        const industryMap = d3.group(filteredData, d => d.general_industry);

        // Structure data for diverging bar chart
        this.barData = Array.from(industryMap, ([industry, values]) => {
            const totalCandidate1 = d3.sum(values, d =>
                d.candidate === this.candidate1 ? d.total_$ : 0);
            const totalCandidate2 = d3.sum(values, d =>
                d.candidate === this.candidate2 ? d.total_$ : 0);
            return { industry, totalCandidate1, totalCandidate2 };
        });

        // Sort data by the total contribution amount in descending order
        this.barData.sort((a, b) => Math.abs(b.totalCandidate1) - Math.abs(a.totalCandidate1));

        // SLice data to get top 10 contributors
        this.barData = this.barData.slice(0, 10);

        this.updateVis();
    }
    updateVis() {
        let vis = this;

        // maxTotal is max value for total_$ across all candidates and industries
        const maxTotal = d3.max(vis.barData, d => Math.max(Math.abs(d.totalCandidate1), Math.abs(d.totalCandidate2)));

        // Update domain of the x scale to be symmetrical around the central axis
        vis.x.domain([-maxTotal, maxTotal]);

        // Remove previous bars to update
        vis.svg.selectAll(".bar").remove();

        // Update the y-axis scale
        this.y.domain(this.barData.map(d => d.industry));

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
            .attr("x", d => vis.x(Math.min(0, -d.totalCandidate1))) // Position bars on the neg side of axis
            .attr("y", d => vis.y(d.industry))
            .attr("width", d => Math.abs(vis.x(0) - vis.x(-d.totalCandidate1))) // Width = distance from zero
            .attr("height", vis.y.bandwidth())
            .attr("fill", "#1f77b4"); // change color for candidate1 to match color scheme

        // Draw bars for candidate2 on right side of axis
        vis.svg.selectAll(".bar.candidate2")
            .data(vis.barData)
            .enter()
            .append("rect")
            .attr("class", "bar candidate2")
            .attr("x", vis.x(0)) // Start at the central axis
            .attr("y", d => vis.y(d.industry))
            .attr("width", d => Math.abs(vis.x(d.totalCandidate2) - vis.x(0))) // width = distance from zero
            .attr("height", vis.y.bandwidth())
            .attr("fill", "#ff7f0e"); // chage color for candidate2 to match color scheme

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
