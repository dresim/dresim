// Total height and width of the chart
var svgWidth = 800;
var svgHeight = 600;

// Add the marging for the chart
var margin = {
  top: 20,
  right: 40,
  bottom: 120,
  left: 120
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold the chart, and shift the latter by left and top margins.
var svg = d3
  .select("#scatter2")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// add the location of the chart within the page and append "g"roup
var chartGroup = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params both x and y
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// function used for updating x-scale upon clicking on the axis label
function xScale(healthData, chosenXAxis) {
  // create scales
  var xLinearScale = d3
    .scaleLinear()
    .domain([
      d3.min(healthData, d => d[chosenXAxis]) * 0.8,
      d3.max(healthData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;
}

// function used for updating y-scale upon clicking on the axis label
function yScale(healthData, chosenYAxis) {
  // create scales
  var yLinearScale = d3
    .scaleLinear()
    .domain([
      d3.min(healthData, d => d[chosenYAxis]) * 0.8,
      d3.max(healthData, d => d[chosenYAxis]) * 1.2
    ])
    .range([height, 0]);

  return yLinearScale;
}

// function used for updating xAxis
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis
    .transition()
    .duration(500)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating yAxis
function renderAxes1(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);

  yAxis
    .transition()
    .duration(500)
    .call(leftAxis);

  return yAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(
  circlesGroup,
  newXScale,
  chosenXAxis,
  newYScale,
  chosenYAxis
) {
  circlesGroup
    .transition()
    .duration(500)
    .attr("cx", d => newXScale(d[chosenXAxis]))
    .attr("cy", d => newYScale(d[chosenYAxis]));

  return circlesGroup;
}

// update the location of the abbreviated states when transitioning
function renderStates(abbr, newXScale, chosenXAxis, newYScale, chosenYAxis) {
  abbr
    .transition()
    .duration(500)
    .attr("x", d => newXScale(d[chosenXAxis]))
    .attr("y", d => newYScale(d[chosenYAxis]));

  return abbr;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesGroup) {
  if (chosenXAxis === "poverty") {
    var label = "Stage:";
  } else if (chosenXAxis === "income") {
    var label = "Income:";
  } else {
    var label = "Reward:";
  }

  if (chosenYAxis === "healthcare") {
    var label2 = "Node Numbers:";
  } else if (chosenYAxis === "smokes") {
    var label2 = "Success rate:";
  } else {
    var label2 = "Maintinance rate:";
  }

  var toolTip = d3
    .tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .attr("fill", "blue")
    .html(function(d) {
      return `${d.state}<br>${label} ${d[chosenXAxis]}<br>${label2} ${d[chosenYAxis]}`;
    });

  // Create tooltip in the chart
  // ==============================
  chartGroup.call(toolTip);

  // Create event listeners to display and hide the tooltip
  // ==============================
  circlesGroup
    .on("mouseover", function(data) {
      toolTip.show(data, this);
    })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// Import the data

var inputfile = "assets/data/post.csv";
d3.csv(inputfile).then(function(healthData) {
  console.log(healthData);
  // console.log(healthData[0].id)
  // console.log(healthData[1].id)
  // console.log(healthData[2].id)

  // Parse Data/Cast as numbers
  // ==============================
  healthData.forEach(function(data) {
    data.poverty = +data.poverty;
    data.healthcare = +data.healthcare;
    data.age = +data.age;
    data.income = +data.income;
    data.smokes = +data.smokes;
    data.obesity = +data.obesity;
    // console.log(data)
    // console.log(data.poverty)
    // console.log(data.healthcare)
  });

  // Create scale functions
  // xLinearScale function above csv import
  var xLinearScale = xScale(healthData, chosenXAxis);

  var yLinearScale = yScale(healthData, chosenYAxis);

  // Create axis functions
  var bottomAxis = d3.axisBottom(xLinearScale).ticks(6);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup
    .append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  var yAxis = chartGroup.append("g").call(leftAxis);

  // Create Circles
  // ==============================
  var circlesGroup = chartGroup
    .selectAll("circle")
    .data(healthData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("r", "12")
    .attr("fill", "blue")
    .attr("opacity", ".5")
    .attr("stroke-width", "1")
    .attr("stroke", "white");

  // Add abbreviated state in circle
  // selectAll .label instead of text. svg uses text for various elements that's why not all states show up
  var abbr = chartGroup
    .selectAll(".label")
    .data(healthData)
    .enter()
    .append("text")
    .attr("class", "label")
    .text(d => d.abbr)
    .attr("x", d => xLinearScale(d[chosenXAxis]))
    .attr("y", d => yLinearScale(d[chosenYAxis]))
    .attr("text-anchor", "middle")
    .attr("font-size", "9px")
    .attr("fill", "white");

  // Create group for 3 x- axis labels
  var labelsGroup = chartGroup
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var povertyLabel = labelsGroup
    .append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("Post-Event");

  var ageLabel = labelsGroup
    .append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("");
  //.text("Post-Event");
  /*
  var incomeLabel = labelsGroup
    .append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "income") // value to grab for event listener
    .classed("inactive", true)
    .text("Post-Event");
*/
  // Create group for 3 y- axis labels
  var labelsGroup1 = chartGroup.append("g");

  var healthcareLabel = labelsGroup1
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", 0 - height / 2)
    .attr("value", "healthcare") // value to grab for event listener
    .text("All")
    .classed("active", true);

  var smokeLabel = labelsGroup1
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -70)
    .attr("x", 0 - height / 2)
    .attr("value", "smokes") // value to grab for event listener
    .text("Metro")
    .classed("inactive", true);

  var obeseLabel = labelsGroup1
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -90)
    .attr("x", 0 - height / 2)
    .attr("value", "obesity") // value to grab for event listener
    .text("Power")
    .classed("inactive", true);

  // updateToolTip function
  var circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

  // y axis labels event listener
  labelsGroup1.selectAll("text").on("click", function() {
    // get value of selection
    var value = d3.select(this).attr("value");
    if (value !== chosenYAxis) {
      // replaces chosen YAxis with value
      chosenYAxis = value;

      // updates y scale for new data
      yLinearScale = yScale(healthData, chosenYAxis);

      // updates y axis with transition
      yAxis = renderAxes1(yLinearScale, yAxis);

      // updates circles with new y values
      circlesGroup = renderCircles(
        circlesGroup,
        xLinearScale,
        chosenXAxis,
        yLinearScale,
        chosenYAxis
      );
      abbr = renderStates(
        abbr,
        xLinearScale,
        chosenXAxis,
        yLinearScale,
        chosenYAxis
      );

      // updates tooltips with new info
      circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

      if (chosenYAxis === "smokes") {
        smokeLabel.classed("active", true).classed("inactive", false);
        healthcareLabel.classed("active", false).classed("inactive", true);
        obeseLabel.classed("active", false).classed("inactive", true);
      } else if (chosenYAxis === "obesity") {
        smokeLabel.classed("active", false).classed("inactive", true);
        healthcareLabel.classed("active", false).classed("inactive", true);
        obeseLabel.classed("active", true).classed("inactive", false);
      } else {
        smokeLabel.classed("active", false).classed("inactive", true);
        healthcareLabel.classed("active", true).classed("inactive", false);
        obeseLabel.classed("active", false).classed("inactive", true);
      }
    }
  });

  // x axis labels event listener
  labelsGroup.selectAll("text").on("click", function() {
    // get value of selection
    var value = d3.select(this).attr("value");
    if (value !== chosenXAxis) {
      // replaces chosenXAxis with value
      chosenXAxis = value;

      // updates x scale for new data
      xLinearScale = xScale(healthData, chosenXAxis);

      // updates x axis with transition
      xAxis = renderAxes(xLinearScale, xAxis);

      // updates circles with new x values
      circlesGroup = renderCircles(
        circlesGroup,
        xLinearScale,
        chosenXAxis,
        yLinearScale,
        chosenYAxis
      );
      abbr = renderStates(
        abbr,
        xLinearScale,
        chosenXAxis,
        yLinearScale,
        chosenYAxis
      );

      // updates tooltips with new info
      circlesGroup = updateToolTip(chosenXAxis, chosenYAxis, circlesGroup);

      // changes classes to change bold text
      if (chosenXAxis === "age") {
        ageLabel.classed("active", true).classed("inactive", false);
        povertyLabel.classed("active", false).classed("inactive", true);
        //incomeLabel.classed("active", false).classed("inactive", true);
        //updatedata("assets/data/pre.csv");
      } else if (chosenXAxis === "income") {
        ageLabel.classed("active", false).classed("inactive", true);
        povertyLabel.classed("active", false).classed("inactive", true);
        //incomeLabel.classed("active", true).classed("inactive", false);
      } else {
        ageLabel.classed("active", false).classed("inactive", true);
        povertyLabel.classed("active", true).classed("inactive", false);
        //incomeLabel.classed("active", false).classed("inactive", true);
        //updatedata("assets/data/post.csv");
      }
    }
  });
});
