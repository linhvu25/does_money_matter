/* * * * * * * * * * * * * *
 *         TreeMap         *
 * * * * * * * * * * * * * */

class TreeMap {
    // constructor method to initialize Timeline object
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        // call initVis method
        this.initVis();
    }
    initVis(){
        let vis = this;

        // margin conventions
        vis.margin = { top: 10, right: 50, bottom: 10, left: 50 };
        vis.width =
            document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3
            .select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")"
            );

        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        // // stratify the data: reformatting for d3.js
        // var root = d3.stratify()
        //     .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
        //     .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
        //     (data);
        // root.sum(function(d) { return +d.value })   // Compute the numeric value for each entity
        //
        // // Then d3.treemap computes the position of each element of the hierarchy
        // // The coordinates are added to the root object above
        // d3.treemap()
        //     .size([width, height])
        //     .padding(4)
        //     (root)
        //
        // console.log(root.leaves())
        // // use this information to add rectangles:

        vis.updateVis();
    }

    updateVis(){

    }
}