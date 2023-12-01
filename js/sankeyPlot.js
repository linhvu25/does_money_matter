/* * * * * * * * * * * * * *
 *       SankeyPlot        *
 * * * * * * * * * * * * * */

class SankeyPlot {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.initVis();
    }

    initVis() {
        let vis = this;

        //dimensions and margins
        vis.margin = { top: 10, right: 10, bottom: 10, left: 10 };
        vis.width = 960 - vis.margin.left - vis.margin.right;
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

        // append svg
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        //color scale
        vis.color = d3.scaleOrdinal(d3.schemeCategory10);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Format data for sankey plot
        let sankeyNodes = [];
        let sankeyLinks = [];

        // Extract necessary fields from data
        vis.data.forEach(function(d) {
            // deal with $ in total_$
            var money = String(d.total_$);
            d.total_$ = Number(money.replace(/[^0-9\.-]+/g, ""))

            sankeyNodes.push({ "name": d.general_industry });
            sankeyNodes.push({ "name": d.candidate });
            sankeyLinks.push({
                "source": d.general_industry,
                "target": d.candidate,
                "value": +d.total_$
            });
        });

        // remove duplicates from nodes
        sankeyNodes = Array.from(new Set(sankeyNodes.map(JSON.stringify))).map(JSON.parse);

        // construct the sankey plot's data structure
        vis.graph = {
            "nodes": sankeyNodes,
            "links": sankeyLinks
        };

        // Loop through each link to populate the source and target by index
        vis.graph.links.forEach(function(d, i) {
            vis.graph.links[i].source = vis.graph.nodes.findIndex(x => x.name === d.source);
            vis.graph.links[i].target = vis.graph.nodes.findIndex(x => x.name === d.target);
        });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // set up Sankey plot
        let sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(10)
            .size([vis.width, vis.height]);

        sankey.nodes(vis.graph.nodes)
            .links(vis.graph.links)
            .layout(32);

        // path generator for links
        let path = d3.sankeyLinkHorizontal();

        // add links
        let link = vis.svg.append("g").selectAll(".link")
            .data(vis.graph.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", path)
            .style("stroke-width", function(d) { return Math.max(1, d.dy); })
            .sort(function(a, b) { return b.dy - a.dy; });

        // add node rectangles
        let node = vis.svg.append("g").selectAll(".node")
            .data(vis.graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        node.append("rect")
            .attr("height", function(d) { return d.dy; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function(d) { return vis.color(d.name); }) // Use color scale for fill
            .style("stroke", function(d) { return d3.rgb(vis.color(d.name)).darker(2); });

        // add node titles
        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .text(function(d) { return d.name; });
    }
}
