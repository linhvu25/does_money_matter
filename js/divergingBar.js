/* * * * * * * * * * * * * *
 *   Diverging Bar Chart   *
 * * * * * * * * * * * * * */

class DivergingBarChart {
    // constructor method to initialize Timeline object
    constructor(_parentElement, _state) {
        this.parentElement = _parentElement;
        this.state = _state;
        this.data = [];
        this.barData = [];

        // call initVis method
        this.getData();
    }

    getData(){
        let vis= this;

        d3.csv(`data/candidate_totals/${vis.state}.csv`).then((data) => {
            vis.data = data;
            vis.initVis();
        })
    }

    initVis(){
        let vis = this;

        // margin conventions
        vis.margin = { top: 10, right: 50, bottom: 220, left: 100 };
        // vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.width = 600 - vis.margin.left - vis.margin.right;
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

        d3.select("#" + vis.parentElement)
            .select("svg")
            .remove();

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

        // console.log("bar data", vis.data)
        // add candidate selection
        var candidate_list = [...new Set(vis.data.map(obj => obj.candidate))];
        //console.log(candidate_list)
        candidate_list.forEach((candidate) => {
            var dropdown = document.getElementById("candidate-bar-select");
            var opt = document.createElement("option");
            opt.text = candidate;
            opt.value = candidate;
            dropdown.options.add(opt);
        })

        vis.barData = vis.data.filter(item => {
            let business = item.specific_business
            return business.includes("UNION")
        })

        vis.barData.forEach((row) => {
            let money = row["total_$"]
            row["total_$"] = Number(money.replace(/[^0-9\.-]+/g, ""))
        });
        //console.log("bar data", vis.barData)
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
            .domain([d3.min(vis.barData, d=> d["total_$"]),
                d3.max(vis.barData, d=> d["total_$"])])
            .range([vis.height, 0]);
        vis.svg.append("g")
            .call(d3.axisLeft(vis.y));

        // Bars
        vis.svg.selectAll("mybar")
            .data(vis.barData)
            .join("rect")
            .attr("x", d => vis.x(d["specific_business"]))
            .attr("y", d => vis.y(d["total_$"]))
            .attr("width", vis.x.bandwidth())
            .attr("height", d => vis.height - vis.y(d["total_$"]))
            .attr("fill", "#69b3a2")
    }

}