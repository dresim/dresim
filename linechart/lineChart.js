function linePlot(id, args) {
  //setting up arguments
  this.id = id;
  this.w = args.width;
  this.h = args.height;
  this.padding = args.padding;
  this.duration = args.duration;
  this.xTickNum = args.timeTickNum;
  this.yTickNum = args.yTickNum;
  this.name = args.name;
  var xScale;
  var yScale;
  var xAxis;
  var yAxis;
  var upper;
  var lower;
  var extraY = 10; //extra Y pixel to avoid circles out of boundary
  var bound = args.defaultBound;
  var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S");
  var dateFn = function(d) {
    return timeFormat.parse(d);
  };

  this.plot = function(data, args) {
    var timeAxisFormat;
    var minStr = args.timeScale.start.split("T")[0] + "T00:00:00";
    var maxStr = args.timeScale.end.split("T")[0] + "T24:00:00";

    // define the x scale (horizontal)
    var mindate = timeFormat.parse(minStr);
    var maxdate = timeFormat.parse(maxStr);

    switch (args.timeAxisFormat) {
      case "dateDay":
        timeAxisFormat = "%m/%d %a";
        break;
      case "dateHour":
        timeAxisFormat = "%H "; //"%m/%d %I %p";
        break;
      case "date":
        timeAxisFormat = "%m/%d "; //the end space is required for parsing
        break;
      case "month":
        timeAxisFormat = "%m "; //the end space is required for parsing
        break;
    }

    xScale = d3.time
      .scale()
      .domain([mindate, maxdate])
      .range([this.padding, this.w - this.padding]);

    xAxis = d3.svg
      .axis()
      .scale(xScale)
      .orient("bottom")
      .ticks(this.xTickNum)
      .tickFormat(d3.time.format(timeAxisFormat));

    var data_all = data[0];
    for (var i = 1; i < data.length; i++) {
      data_all = data_all.concat(data[i]);
    }
    if (data_all.length !== 0) {
      minBound = Math.min(
        d3.min(data_all, function(d) {
          return d.y;
        }) - extraY,
        bound.min
      );
      maxBound = Math.max(
        d3.max(data_all, function(d) {
          return d.y;
        }) + extraY,
        bound.max
      );
      yScale = d3.scale
        .linear()
        .domain([minBound, maxBound])
        .range([this.h - this.padding, this.padding]);
    } else {
      yScale = d3.scale
        .linear()
        .domain([bound["min"], bound["max"]])
        .range([this.h - this.padding, this.padding]);
    }

    yAxis = d3.svg
      .axis()
      .scale(yScale)
      .orient("left")
      .ticks(this.yTickNum);

    var svg = d3
      .select("#" + this.id)
      .attr("class", "svg-container")
      .append("svg")
      .attr({
        preserveAspectRatio: "xMinYMin meet",
        viewBox: "0 0 " + this.w + " " + this.h,
        //class to make it responsive
        class: "svg-content-responsive"
        //'width': this.w,
        //'height': this.h,
      });

    svg
      .append("clipPath")
      .attr("id", "chart-area")
      .append("rect")
      .attr({
        x: this.padding,
        y: this.padding,
        width: this.w - this.padding * 2,
        height: this.h - this.padding * 2
      });

    svg
      .append("clipPath")
      .attr("id", "text-area")
      .append("rect")
      .attr({
        x: this.padding,
        y: 0,
        width: this.w - this.padding * 2,
        height: this.h - this.padding * 1
      });

    //backgroud
    svg.append("rect").attr({
      x: this.padding,
      y: this.padding,
      width: this.w - this.padding * 2,
      height: this.h - this.padding * 2,
      fill: "red",
      "stroke-width": 4,
      stroke: "black",
      opacity: 0.12,
      id: "background"
    });

    //plotting the rects and texts for the period in the hospital
    svg.append("g").attr("class", "inHospital");
    if (typeof args === "undefined") {
      args = {};
    }
    if (args.inHospital !== "undefined") {
      for (var key in args.inHospital) {
        var t1 = args.inHospital[key].start;
        var t2 = args.inHospital[key].end;
        svg
          .select(".inHospital")
          .append("rect")
          .attr({
            x: xScale(timeFormat.parse(t1)),
            y: this.padding,
            width: xScale(timeFormat.parse(t2)) - xScale(timeFormat.parse(t1)),
            height: this.h - this.padding * 2,
            fill: "blue",
            opacity: 0.2,
            "clip-path": "url(#chart-area)"
          })
          .append("title")
          .text(function(d) {
            return (
              args.inHospital[key].cause +
              "\n" +
              t1.replace("T", " ") +
              "\n" +
              t2.replace("T", " ")
            );
          });
        if (
          args.inHospital[key].cause !== "undefined" &&
          args.timeAxisFormat !== "month"
        ) {
          svg
            .select(".inHospital")
            .append("text")
            .text(args.inHospital[key].cause)
            .attr({
              x: xScale(timeFormat.parse(t1)),
              y: this.padding * 0.9,
              class: "cause",
              "clip-path": "url(#text-area)"
            });
        }
      }
    }

    //Create X axis
    svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (this.h - this.padding) + ")")
      .call(xAxis)
      .selectAll(".tick text")
      .call(wrap, timeAxisFormat);

    //Create Y axis
    svg
      .append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + this.padding + ",0)")
      .call(yAxis);

    var line = d3.svg
      .line()
      .x(function(d) {
        return xScale(dateFn(d.x));
      })
      .y(function(d) {
        return yScale(d.y);
      });

    for (var i = 0; i < data.length; i++) {
      //plotting the line
      svg.append("path").attr({
        d: line(data[i]),
        stroke: args.dataLineStroke[i],
        "stroke-width": args.dataLineStrokeWidth[i],
        fill: "none",
        opacity: args.dataLineOpacity[i],
        "clip-path": "url(#chart-area)",
        class: "dataLine" + i
      });

      if (args.timeAxisFormat == "month") {
        var opacity = 0.0;
      } else {
        var opacity = args.dataPointOpacity[i];
      }

      svg
        .selectAll(".dataPoint" + i)
        .data(data[i])
        .enter()
        .append("circle")
        .attr({
          cx: function(d) {
            return xScale(dateFn(d.x));
          },
          cy: function(d) {
            return yScale(d.y);
          },
          r: args.dataPointR[i],
          fill: args.dataPointFill[i],
          opacity: opacity,
          "clip-path": "url(#chart-area)",
          class: "dataPoint" + i
        })
        .each(function(d) {
          if (
            d.y > args.normalRange[i].upper ||
            d.y < args.normalRange[i].lower
          ) {
            d3.select(this).attr({
              stroke: args.dataPointStrokeAlert[i],
              "stroke-width": args.dataLineStrokeWidth[i],
              fill: args.dataPointFillAlert[i],
              opacity: args.dataPointOpacity[i]
            });
          } else {
            d3.select(this).attr({ stroke: null, "stroke-width": null });
          }
        });

      tag = this.name[i];
      //adding the tooltips
      svg
        .selectAll(".dataPoint" + i)
        .append("title")
        .text(function(d) {
          return tag + ": " + d.y + "\n" + d.x.replace("T", "\n");
        });

      //Create threshhold line
      upper = [
        { x: minStr, y: args.normalRange[i].upper },
        { x: maxStr, y: args.normalRange[i].upper }
      ];

      lower = [
        { x: minStr, y: args.normalRange[i].lower },
        { x: maxStr, y: args.normalRange[i].lower }
      ];

      svg.append("path").attr({
        d: line(upper),
        stroke: "#000",
        "stroke-width": "1px",
        "stroke-dasharray": "10,10",
        fill: "none",
        class: "upperLine" + i,
        "clip-path": "url(#chart-area)"
      });

      svg.append("path").attr({
        d: line(lower),
        stroke: "#000",
        "stroke-width": "1px",
        "stroke-dasharray": "10,10",
        fill: "none",
        class: "lowerLine" + i,
        "clip-path": "url(#chart-area)"
      });
    }
  };

  this.update = function(data, args) {
    var timeAxisFormat;
    switch (args.timeAxisFormat) {
      case "dateDay":
        timeAxisFormat = "%m/%d %a";
        break;
      case "dateHour":
        timeAxisFormat = "%H "; //"%m/%d %I %p";
        break;
      case "date":
        timeAxisFormat = "%m/%d "; //the end space is required for parsing
        break;
      case "month":
        timeAxisFormat = "%m "; //the end space is required for parsing
        break;
    }
    var minStr = args.timeScale.start.split("T")[0] + "T00:00:00";
    var maxStr = args.timeScale.end.split("T")[0] + "T24:00:00";

    // define the x scale (horizontal)
    var mindate = timeFormat.parse(minStr);
    var maxdate = timeFormat.parse(maxStr);

    xScale.domain([mindate, maxdate]);

    xAxis.ticks(this.xTickNum).tickFormat(d3.time.format(timeAxisFormat));

    //reset y scale domain
    var data_all = data[0];
    for (var i = 1; i < data.length; i++) {
      data_all = data_all.concat(data[i]);
    }

    if (data_all.length !== 0) {
      minBound = Math.min(
        d3.min(data_all, function(d) {
          return d.y;
        }) - extraY,
        bound.min
      );
      maxBound = Math.max(
        d3.max(data_all, function(d) {
          return d.y;
        }) + extraY,
        bound.max
      );
      yScale = d3.scale
        .linear()
        .domain([minBound, maxBound])
        .range([this.h - this.padding, this.padding]);
    } else {
      yScale = d3.scale
        .linear()
        .domain([bound["min"], bound["max"]])
        .range([this.h - this.padding, this.padding]);
    }
    yAxis.scale(yScale);

    var line = d3.svg
      .line()
      .x(function(d) {
        return xScale(dateFn(d.x));
      })
      .y(function(d) {
        return yScale(d.y);
      });

    svg = d3.select("#" + this.id).select("svg");

    //update elements in the hospital
    svg
      .selectAll(".inHospital")
      .selectAll("rect")
      .remove();
    svg.selectAll(".cause").remove();
    if (typeof args === "undefined") {
      args = {};
    }
    if (typeof args.inHospital !== "undefined") {
      for (var key in args.inHospital) {
        var t1 = args.inHospital[key].start;
        var t2 = args.inHospital[key].end;
        svg
          .select(".inHospital")
          .append("rect")
          .attr({
            x: xScale(timeFormat.parse(t1)),
            y: this.padding,
            width: xScale(timeFormat.parse(t2)) - xScale(timeFormat.parse(t1)),
            height: this.h - this.padding * 2,
            fill: "blue",
            opacity: 0.2,
            "clip-path": "url(#chart-area)"
          })
          .append("title")
          .text(function(d) {
            return (
              args.inHospital[key].cause +
              "\n" +
              t1.replace("T", " ") +
              "\n" +
              t2.replace("T", " ")
            );
          });
        if (
          args.inHospital[key].cause !== "undefined" &&
          args.timeAxisFormat !== "month"
        ) {
          svg
            .select(".inHospital")
            .append("text")
            .text(args.inHospital[key].cause)
            .attr({
              x: xScale(timeFormat.parse(t1)),
              y: this.padding * 0.9,
              class: "cause",
              "clip-path": "url(#text-area)"
            });
        }
      }
    }

    //Update X axis
    svg
      .select(".x.axis")
      .transition()
      .duration(this.duration)
      .call(xAxis)
      .selectAll(".tick text")
      .call(wrap, timeAxisFormat);

    //Update Y axis
    svg
      .select(".y.axis")
      .transition()
      .duration(this.duration)
      .call(yAxis);

    for (var i = 0; i < data.length; i++) {
      svg
        .select(".dataLine" + i)
        .transition()
        .duration(this.duration * 0.5)
        .attr("stroke-width", "0px")
        .transition()
        .duration(this.duration * 0.5)
        .attr("stroke-width", args.dataLineStrokeWidth[i])
        .attr("d", line(data[i]));

      var circles = svg.selectAll(".dataPoint" + i).data(data[i]);

      if (args.timeAxisFormat == "month") {
        var opacity = 0.0;
      } else {
        var opacity = args.dataPointOpacity[i];
      }

      circles
        .enter()
        .append("circle")
        .attr({
          cx: function(d) {
            return xScale(dateFn(d.x));
          },
          cy: function(d) {
            return yScale(d.y);
          },
          r: 0,
          fill: args.dataPointFill[i],
          opacity: opacity,
          "clip-path": "url(#chart-area)",
          class: "dataPoint" + i
        })
        .each(function(d) {
          if (
            d.y > args.normalRange[i].upper ||
            d.y < args.normalRange[i].lower
          ) {
            d3.select(this).attr({
              stroke: args.dataPointStrokeAlert[i],
              "stroke-width": args.dataLineStrokeWidth[i],
              fill: args.dataPointFillAlert[i],
              opacity: args.dataPointOpacity[i]
            });
          } else {
            d3.select(this).attr({ stroke: null, "stroke-width": null });
          }
        });

      circles
        .transition()
        .duration(this.duration) //
        .attr({
          cx: function(d) {
            return xScale(dateFn(d.x));
          },
          cy: function(d) {
            return yScale(d.y);
          },
          r: args.dataPointR[i]
        })
        .each(function(d) {
          if (
            d.y > args.normalRange[i].upper ||
            d.y < args.normalRange[i].lower
          ) {
            d3.select(this).attr({
              stroke: args.dataPointStrokeAlert[i],
              "stroke-width": args.dataLineStrokeWidth[i],
              fill: args.dataPointFillAlert[i],
              opacity: args.dataPointOpacity[i]
            });
          } else {
            d3.select(this).attr({
              stroke: null,
              "stroke-width": null,
              fill: args.dataPointFill[i],
              opacity: opacity
            });
          }
        });

      circles
        .exit()
        .transition()
        .duration(this.duration)
        .attr("r", 0)
        .remove();

      svg
        .selectAll(".dataPoint" + i)
        .select("title")
        .remove();
      //adding tooltips
      tag = this.name[i];
      svg
        .selectAll(".dataPoint" + i)
        .append("title")
        .text(function(d) {
          return tag + ": " + d.y + "\n" + d.x.replace("T", "\n");
        });

      //Create threshhold line
      upper = [
        { x: minStr, y: args.normalRange[i].upper },
        { x: maxStr, y: args.normalRange[i].upper }
      ];

      lower = [
        { x: minStr, y: args.normalRange[i].lower },
        { x: maxStr, y: args.normalRange[i].lower }
      ];

      svg
        .select(".upperLine" + i)
        .transition()
        .duration(this.duration)
        .attr("d", line(upper));

      svg
        .select(".lowerLine" + i)
        .transition()
        .duration(this.duration)
        .attr("d", line(lower));
    }
  };

  var dayOfWeek = {
    Mon: "",
    Tue: "",
    Wed: "",
    Thu: "",
    Fri: "",
    Sat: "",
    Sun: ""
  };

  var dayOfMonth = {
    "00": "0",
    "01": "1",
    "02": "2",
    "03": "3",
    "04": "4",
    "05": "5",
    "06": "6",
    "07": "7",
    "08": "8",
    "09": "9",
    "10": "10",
    "11": "11",
    "12": "12",
    "13": "13",
    "14": "14",
    "15": "15",
    "16": "16",
    "17": "17",
    "18": "18",
    "19": "19",
    "20": "20",
    "21": "21",
    "22": "22",
    "23": "23",
    "24": "24",
    "25": "25",
    "26": "26",
    "27": "27",
    "28": "28",
    "29": "29",
    "30": "30",
    "31": "31"
  };

  //line break in SVG time label
  function wrap(text, timeAxisFormat) {
    text.each(function() {
      var text = d3.select(this);
      //this is to solve the transition problem
      //comment out and use console.log(text.text()) to see what happended
      if (text.text().match(" ") === null) {
        return;
      }
      var words = text
        .text()
        .split(/\s+/)
        .reverse();
      var word;
      var lineNumber = 0;
      var lineHeight = 1.1; // ems;
      var y = text.attr("y");
      var dy = parseFloat(text.attr("dy"));
      var tspan = text
        .text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", dy + "em");
      date = words.pop().split("/");
      console.log(date);
      //console.log(timeAxisFormat)
      if (timeAxisFormat == "%m ") {
        tspan.text(dayOfMonth[date]);
        return;
      } else if (timeAxisFormat == "%H ") {
        console.log(date);
        tspan.text(dayOfMonth[date]);
      } else {
        //tspan.text(dayOfMonth[date[0]] + "/" + dayOfMonth[date[1]]);
        tspan.text(dayOfMonth[date[1]]);
      }

      switch (timeAxisFormat) {
        case "%m/%d %a":
          //tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(dayOfWeek[words.pop()]);
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(dayOfWeek[words.pop()]);

          break;
        case "%m/%d %H:%M":
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(words.pop());
          break;
      }
    });
  }
}
