/* * * * * * * * * * * * * *
 *         TreeMap         *
 * * * * * * * * * * * * * */

class TreeMap {
    // constructor method to initialize Timeline object
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.displayData = [];
        this.treeData = [];

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

        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        // subset data to broad_sector and $, rename columns
        vis.displayData = vis.data.map(row => [row["broad_sector"], row["total_$"]]);
        vis.displayData = vis.displayData.map(item => ({
            group: item["0"],
            value: item["1"]
        }));

        // extract contribution amount
        vis.displayData.forEach((row) => {
            let money = row.value;
            row.value = Number(money.replace(/[^0-9\.-]+/g, ""));
        });

        // aggregate $ by broad_sector
        const groupedSum = vis.displayData.reduce((accumulator, currentValue) => {
            const { group, value } = currentValue;

            // Check if the group is already in the accumulator
            if (!accumulator[group]) {
                accumulator[group] = 0; // Initialize the sum for the group if not present
            }

            // Add the value to the sum for the current group
            accumulator[group] += value;

            return accumulator;
        }, {});

        // convert to array
        const myArray = Object.keys(groupedSum).map(key => ({ key, value: groupedSum[key] }));

        vis.treeData = myArray.map(item => ({
            name: item.key,
            parent: 'Origin',
            value: String(item.value)
        }));

        const origin = {name: 'Origin', parent: '', value: ''}
        vis.treeData.push(origin)

        console.log("my data", vis.treeData)

        // stratify the data: reformatting for d3.js
        var root = d3.stratify()
            .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
            .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
            (vis.treeData);
        root.sum(function(d) { return +d.value })   // Compute the numeric value for each entity

        console.log("root", root)

        // Then d3.treemap computes the position of each element of the hierarchy
        // The coordinates are added to the root object above
        d3.treemap()
            .size([vis.width, vis.height])
            .padding(4)
            (root)

        console.log("my leaves", root.leaves())
        // use this information to add rectangles:
        vis.svg
            .selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr('x', function (d) {return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .style("stroke", "black")
            .style("fill", "#69b3a2");

        // // and to add the text labels
        // vis.svg
        //     .selectAll("text")
        //     .data(root.leaves())
        //     .enter()
        //     .append("text")
        //     .attr("x", function(d){ return d.x0+10})    // +10 to adjust position (more right)
        //     .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
        //     .text(function(d){ return d.data.name})
        //     .attr("font-size", "15px")
        //     .attr("fill", "white")
        vis.updateVis();
    }

    updateVis(){
        let vis = this;
        // use this information to add rectangles:

    }
}