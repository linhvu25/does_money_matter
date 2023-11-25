/* * * * * * * * * * * * * *
 *   Diverging Bar Chart   *
 * * * * * * * * * * * * * */

class DivergingBarChart {
    // constructor method to initialize Timeline object
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.barData = [];

        // call initVis method
        this.initVis();
    }

    initVis(){
        let vis = this;

        // margin conventions
        vis.margin = { top: 10, right: 50, bottom: 10, left: 50 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3
            .select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        this.wrangleData();
    }

    wrangleData(){
        let vis = this;

        console.log("data", vis.data)

        vis.barData = vis.data.filter(item => {
            let business = item.specific_business
            return business.includes("UNION")
        })

        vis.barData.forEach((row) => {
            let money = row["total_$"]
            row["total_$"] = Number(money.replace(/[^0-9\.-]+/g, ""))
        });
        console.log("bar data", vis.barData)
        this.updateVis();
    }

    updateVis(){
        let vis = this;

        // X axis
        vis.x = d3.scaleBand()
            .range([ 0, vis.width ])
            .domain(vis.barData.map(d => d["specific_business"]))
            .padding(0.2);
        vis.svg.append("g")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(d3.axisBottom(vis.x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        vis.y = d3.scaleLinear()
            .domain([0, 13000])
            .range([ vis.height, 0]);
        vis.svg.append("g")
            .call(d3.axisLeft(vis.y));

        // Bars
        vis.svg.selectAll("mybar")
            .data(vis.barData)
            .enter()
            .append("rect")
            .attr("x", d => vis.x(d["specific_business"]))
            .attr("y", d => vis.y(d["total_$"]))
            .attr("width", vis.x.bandwidth())
            .attr("height", d => 800 - vis.y(d["total_$"]))
            .attr("fill", "#69b3a2")
    }

}