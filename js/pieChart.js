/* * * * * * * * * * * * * *
*         PieChart         *
* * * * * * * * * * * * * */


class PieChart {

    // constructor method to initialize Timeline object
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        // margin conventions
        vis.margin = {top: 10, right: 50, bottom: 10, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'pieTooltip')

        // add title
        vis.svg.append('g')
            .attr('class', 'title pie-title')
            .append('text')
            .text('Sectors that top contributors come from')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // colors
        vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            // .domain([1, 5])
            // .range(["#eeff00", "#ff0022", "#2200ff","#eeff00", "#ff0022"]);


        // TODO
        // pie chart setup
        vis.pieChartGroup = vis.svg.append('g')
            .attr('class', 'pie-chart')
            .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")");

        vis.pie = d3.pie()
            .value(d=>d);

        // pie chart settings
        let outerRadius = vis.width / 10;
        let innerRadius = 0;

        vis.arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // call next method in pipeline
        this.wrangleData();
    }

    // wrangleData method
    wrangleData() {
        let vis = this;
        vis.displayData = [];

        // sort contribution from most $ to least $
        vis.sortedData = vis.data.sort((a,b) => {return(a["total_$"] - b["total_$"])})

        // extract contribution amount
        vis.sortedData.forEach(row => {
            let money = row["total_$"];
            vis.displayData.push(Number(money.replace(/[^0-9\.-]+/g,"")))
            vis.displayData = vis.displayData.slice(0, 5)
        })

        vis.updateVis();

    }

    // updateVis method
    updateVis() {
        let vis = this;

        let tooltipInfo = vis.sortedData.slice(0,5)

        // TODO
        vis.arcs = vis.pieChartGroup.selectAll(".pie-arc")
            .data(vis.pie(vis.displayData))

        vis.arcs.enter()
            .append("path")
            .attr("class", "pie-arc")
            .merge(vis.arcs)
            .attr("d", vis.arc)
            .style("fill", (d,i)=>vis.colorScale(i))
            .on('mouseover', function(event, d, i){

                // get index
                let info = tooltipInfo[d.index];

                // change the segment of pie chart
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'rgba(173,222,255,0.62)')

                // update tooltip
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                             <h3> Broad Sector: ${info["broad_sector"]}<h3>
                             <h4> General Industry: ${info["general_industry"]}</h4>
                             <h4> Total $: ${info["total_$"]}</h4>
                        </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", d => d.data.color)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.arcs.exit().remove();

    }
}