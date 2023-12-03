/* * * * * * * * * * * * * *
 *       SankeyPlot        *
 * * * * * * * * * * * * * */

/*class SankeyPlot {
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
}*/


//---------HTML---------///

/*
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
        width =900 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var formatNumber = d3.format(",.0f"),
        format = function(d) { return formatNumber(d); },
        color = d3.scaleOrdinal(d3.schemeCategory10);

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var sankey = d3.sankey()
        .nodeWidth(36)
        .nodePadding(40)
        .size([width, height]);
    //.extent([[1, 1], [width - 1, height - 5]]);

    var path = d3.sankeyLinkHorizontal(10);

    // Function to clean the currency string and convert it to a number
    function parseMoney(currencyString) {
        return parseFloat(currencyString.replace(/[^0-9.-]+/g, ""));
    }

    d3.csv("data/candidate_totals/az.csv").then(function(rawData) {

        console.log("raw data:", rawData);

        var nodesByName = new Map();
        var links = [];

        rawData.forEach(function(d) {
            var source = nodesByName.get(d.broad_sector);
            var target = nodesByName.get(d.candidate);
            var value = parseMoney(d.total_$);
            //var value = 10;

            if (isNaN(value)) {
                console.error("Invalid value for total_$", d);
                return; // Skip this iteration.
            }

            if (!source) {
                source = {name: d.broad_sector, category: 'broad_sector'};
                nodesByName.set(d.broad_sector, source);
            }
            if (!target) {
                target = {name: d.candidate, category: 'candidate'};
                nodesByName.set(d.candidate, target);
            }
            links.push({source: source, target: target, value: value});
        });

        console.log("Nodes before sankey:", nodesByName);
        console.log("Links before sankey:", links);

        var nodes = Array.from(nodesByName.values());

        links.forEach(function(link) {
            link.source = nodes.indexOf(link.source);
            link.target = nodes.indexOf(link.target);
        });
        console.log("Nodes after indexing", nodes); // Check the processed nodes.
        console.log("Links after indexing", links); // Check the processed links.

        // Set up the Sankey diagram with nodes and links.
        //let sankeyData = {nodes, links};

        //sankey(sankeyData);

        sankey({
            nodes: nodes.map(d => Object.assign({}, d)), // create a copy of each node
            links: links.map(d => Object.assign({}, d)) // copy of each link
        });

        nodes.forEach(function(node, i) {
            // Just an example, would calculate these based on your actual layout
            node.x0 = i * (width / nodes.length);
            node.x1 = node.x0 + 25; // Node width of 25
            node.y0 = i * (height / nodes.length);
            node.y1 = node.y0 + 10; // Node height of 10
        });

        links.forEach(function(link, i) {
            // Manually set a width for the link
            link.width = 5; // Hardcoded width of 5
        });

        // Check if the sankey layout computation added the properties correctly
        console.log("Sankey nodes after layout", nodes);
        console.log("Sankey links after layout", links);

        nodes.forEach(node => {
            if (isNaN(node.x0) || isNaN(node.x1) || isNaN(node.y0) || isNaN(node.y1)) {
                console.error("Node with NaN position", node);
            }
        });

        links.forEach(link => {
            if (isNaN(link.width)) {
                console.error("Link with NaN width", link);
            }
        });


        /!*        svg.append("g")
                    .selectAll(".link")
                    .data(links)
                    .enter().append("path")
                    .attr("class", "link")
                    .attr("d", path)
                    .style("stroke-width", function(d) { return Math.max(1, d.width); })
                    .append("title")
                    .text(function(d) {
                        return d.source.name + " → " + d.target.name + "\n" + format(d.value);
                    });*!/

        function customSankeyLinkPath(sourceX, sourceY, targetX, targetY) {
            // This function creates a simple straight line between source and target
            return `M${sourceX},${sourceY}L${targetX},${targetY}`;
        }

        svg.append("g")
            .selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", function(d) {
                // Assuming y0 is the vertical center of the source node
                var sourceX = nodes[d.source].x1; // Right side of the source node
                var sourceY = nodes[d.source].y0 + (nodes[d.source].y1 - nodes[d.source].y0) / 2; // Vertical center
                var targetX = nodes[d.target].x0; // Left side of the target node
                var targetY = nodes[d.target].y0 + (nodes[d.target].y1 - nodes[d.target].y0) / 2; // Vertical center
                return customSankeyLinkPath(sourceX, sourceY, targetX, targetY);
            })
            .style("stroke-width", function(d) { return d.width; })
            .append("title")
            .text(function(d) {
                return nodes[d.source].name + " → " + nodes[d.target].name + "\n" + format(d.value);
            });

        var node = svg.append("g")
            .selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node");

        node.append("rect")
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return d.y0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .attr("width", sankey.nodeWidth())
            .style("fill", function(d) { return color(d.name); })
            .append("title")
            .text(function(d) { return d.name + "\n" + format(d.value); });

        node.append("text")
            .attr("x", function(d) { return d.x0 - 6; })
            .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(function(d) { return d.name; });
    });
*/


//------Converted into class structure-----//

/*
class SankeyPlot {
    constructor(selector) {
        this.margin = {top: 10, right: 10, bottom: 10, left: 10};
        this.width = 900 - this.margin.left - this.margin.right;
        this.height = 300 - this.margin.top - this.margin.bottom;
        this.formatNumber = d3.format(",.0f");
        this.color = d3.scaleOrdinal(d3.schemeCategory10);
        this.selector = selector;

        this.svg = d3.select(this.selector).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        this.sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(40)
            .size([this.width, this.height]);
    }

    parseMoney(currencyString) {
        return parseFloat(currencyString.replace(/[^0-9.-]+/g, ""));
    }

    customSankeyLinkPath(sourceX, sourceY, targetX, targetY) {
        return `M${sourceX},${sourceY}L${targetX},${targetY}`;
    }

    renderSankey(rawData) {
        let nodesByName = new Map();
        let links = [];

        rawData.forEach(d => {
            let source = nodesByName.get(d.broad_sector);
            let target = nodesByName.get(d.candidate);
            let value = this.parseMoney(d.total_$);

            if (isNaN(value)) {
                console.error("Invalid value for total_$", d);
                return;
            }

            if (!source) {
                source = {name: d.broad_sector, category: 'broad_sector'};
                nodesByName.set(d.broad_sector, source);
            }
            if (!target) {
                target = {name: d.candidate, category: 'candidate'};
                nodesByName.set(d.candidate, target);
            }
            links.push({source, target, value});
        });

        let nodes = Array.from(nodesByName.values());
        links.forEach(link => {
            link.source = nodes.indexOf(link.source);
            link.target = nodes.indexOf(link.target);
        });

        this.sankey({
            nodes: nodes.map(d => ({...d})),
            links: links.map(d => ({...d}))
        });

        nodes.forEach((node, i) => {
            node.x0 = i * (this.width / nodes.length);
            node.x1 = node.x0 + 25;
            node.y0 = i * (this.height / nodes.length);
            node.y1 = node.y0 + 10;
        });

        links.forEach((link, i) => {
            link.width = 5;
        });

        this.svg.selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", d => {
                let sourceX = nodes[d.source].x1;
                let sourceY = nodes[d.source].y0 + (nodes[d.source].y1 - nodes[d.source].y0) / 2;
                let targetX = nodes[d.target].x0;
                let targetY = nodes[d.target].y0 + (nodes[d.target].y1 - nodes[d.target].y0) / 2;
                return this.customSankeyLinkPath(sourceX, sourceY, targetX, targetY);
            })
            .style("stroke-width", d => d.width)
            .append("title")
            .text(d => `${nodes[d.source].name} → ${nodes[d.target].name}\n${this.formatNumber(d.value)}`);

        let node = this.svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node");

        node.append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", this.sankey.nodeWidth())
            .style("fill", d => this.color(d.name))
            .append("title")
            .text(d => `${d.name}\n${this.formatNumber(d.value)}`);

        node.append("text")
            .attr("x", d => d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(function (d) {
                return d.name;
            });

    };
}*/
