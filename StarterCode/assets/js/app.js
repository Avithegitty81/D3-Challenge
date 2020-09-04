// Create Plots:
async function CreatePlot()
{
    var svgArea = d3.select("body").select('svg');
    if (!svgArea.empty()) {
        svgArea.remove();
    }

    var svgWidth = 0.85*(window.innerWidth);
    var svgHeight = 0.9*(window.innerHeight);
    var margin = {
        top: 20,
        right: 20,
        bottom: 100,
        left: 100


    };
    var width = svgWidth - margin.left - margin.right;
    var height = svgHeight - margin.top - margin.bottom;
    // Create a SVG Wrapper, append an SVG group that will hold the chart:
    var svg = d3
        .select("#scatter")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
        var chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
        // Fetch data using d3.csv method:
        let HealthData = await d3.csv("./assets/data/data.csv").catch(function(error){
            console.log(error);

        });
        // console.log(HealthData) to display data in console:
        console.log("Sample Size:" + HealthData.length); 
        HealthData.forEach(function(data) {
            data.age = +data.age;
            data.poverty = +data.poverty;
            data.income = +data.income;
            data.healthcare = +data.healthcare;
            data.obesity = +data.obesity;
            data.smokes = +data.smokes;

        });

        // Create a Scatter plot between two data variables namely "Health Care" v/s "Poverty":
        let selectXAxis = "poverty"
        let selectYAxis = "healthcare"
        // Define the params for the axis
        let x_min = d3.min(HealthData, d => d[selectXAxis]);
        let x_max = d3.max(HealthData, d => d[selectXAxis]);
        let y_min = d3.min(HealthData, d => d[selectYAxis]);
        let y_max = d3.max(HealthData, d => d[selectYAxis]);

        // Creating Scale functions:
        var xLinearScale = d3.scaleLinear()
                            .domain([(x_min - 0.01*(x_min+x_max)),
                            (x_max + 0.01*(x_min+x_max))
                            ])
                            .range([0, width])
                            .nice();
        var yLinearScale = d3.scaleLinear()
                            .domain([(y_min - 0.02*(y_min+y_max)),
                            (y_max + 0.02*(y_min+y_max))
                            ])
                            .range([height,0])
                            .nice();
        // Create axis function:
        var bottomAxis = d3.axisBottom(xLinearScale);
        var leftAxis = d3.axisLeft(yLinearScale);
        var xAxis = chartGroup.append("g")
                              .attr("transform", `translate(0, ${height})`)
                              .classed("axisClr",true)
                              .call(bottomAxis);
        var yAxis = chartGroup.append("g")
                              .classed("axisClr",true)
                              .call(leftAxis);
                              
        // Create Circles at each data point
        var circleGroup = chartGroup.selectAll("circle")
                                .data(HealthData)
                                .enter()
                                .append("g");
        var circlePoints = circleGroup.append("circle")
                                 .attr("cx", d => xLinearScale(d[selectXAxis]))
                                 .attr("cy", d => yLinearScale(d[selectYAxis]))
                                 .attr("fill","#89bdd3")
                                 .attr("stroke","#3a879e")
                                 .attr("r", "15")
                                 .attr("stroke-width", 1.5);
        // Create labels inside circles using the class stateText:
        var circleLabels = circleGroup.selectAll(null)
                                      .data(HealthData)
                                      .enter() 
                                      .append("text")
                                      .text(d => d.abbr)
                                      .attr("x", d => xLinearScale(d[selectXAxis]))
                                      .attr("y", d => yLinearScale(d[selectYAxis])+5)
                                      .attr("text-anchor", "middle")
                                      .classed("stateText",true)// Text style from d3Style.css
        // Function tooltip
        function UpgradeToolTip(circlePoints, xAxis, yAxis) {
            let xPercent, yPercent = "";
            let xLabel, yLabel = "";
            switch (xAxis){
                case "poverty": xLabel = "Poverty"; xPercent = "%"; break;
                case "age": xLabel = "Age"; xPercent = "yrs"; break;
                case "income": xLabel = "Income"; xPercent = ""; break;
                default: xLabel ="";

            }
            switch(yAxis) {
                case "healthcare": yLabel = "Healthcare"; yPercent = '%'; break;
                case "smokes": yLabel = "Smokes"; yPercent = "%"; break;
                case "obesity": yLabel = "Obesity"; yPercent = "%"; break;
                default: yLabel ="";

            }
            var toolTip = d3.tip()
                .attr("class", "d3-tip")
                .style("position","absolute")
                .offset([150, -75])
                .html(function(d) {
                    if(xAxis === "income"){
                        let income = formatter.format(d[xAxis]);
                        return (`$(d.state)<br>${xLabel}: ${income.substring(0, income.length-3)}${xPercent}<br>${yLabel}: ${d[yAxis]}${yPercent}`)
                    } else {
                        return (`${d.state}<br>${xLabel}: ${d[xAxis]}${xPercent}<br>${yLabel}: ${d[yAxis]}${yPercent}`)
                    }; 
                });
            // Initiate Tool tip:
            circlePoints.call(toolTip);
            
            // Mouseover event:
            circlePoints.on("mouseover", function(data) {
                toolTip.show(data, this);
            })
            // Onmouseout event:
            .on("mouseout", function(data) {
                toolTip.hide(data, this);
            });
        return circlePoints;

        }
        // Internation Number Formatting:
        var formatter = new Intl.NumberFormat('en-US', {
                                           style: 'currency',
                                           currency: 'USD',

        }); // converting income into US currency

        // initialize tooltips
        circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);

        // Create a group of X Axis Labels:
        let Grouped_xLabels = chartGroup.append("g")
                          .attr("transform", `translate(${width/ 2}, ${height + margin.top + 20})`);
                          
        // Create three labels corresponding to poverty, age and income:
        let PovertyLabel = Grouped_xLabels.append("text")
                          .text("In Poverty (%)")
                          .attr("dy", 0)
                          .attr("value","poverty")
                          .attr("class", "active")
                          .on("click", function(){
                              PovertyLabel.classed ("active",true).classed("inactive",false);
                              IncomeLabel.classed("inactive",true).classed("active",false);
                              AgeLabel.classed("inactive",true).classed("active",false);
                              xAxis = UpdateXAxis("poverty",xAxis);
                              circlePoints = UpdateXPosition("poverty", circlePoints, "#89bdd3", "#3a879e");
                              circleLabels = UpdateXLabels("poverty", circleLabels);
                              selectXAxis = "poverty";
                              circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);


                          });
        let AgeLabel = Grouped_xLabels.append("text")
                            .text("Age (Median)")
                            .attr("dy", 20)
                            .attr("value","age")
                            .attr("class", "inactive")
                            .on("click", function(){
                                PovertyLabel.classed("inactive",true).classed("active", false);
                                IncomeLabel.classed("inactive",true).classed("active",false);
                                AgeLabel.classed("active",true).classed("inactive",false);
                                xAxis = UpdateXAxis("age", xAxis);
                                circlePoints = UpdateXPosition("age", circlePoints, "#a9c653", "#70c653");
                                circleLabels = UpdateXLabels("age", circleLabels);
                                selectXAxis = "age";
                                circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);


                            });
        let IncomeLabel = Grouped_xLabels.append("text")
                          .text("Household Income (Median)")
                          .attr("dy", 40)
                          .attr("value","income")
                          .attr("class", "inactive")
                          .on("click", function(){
                              PovertyLabel.classed("inactive",true).classed("active",false);
                              IncomeLabel.classed("active",true).classed("active",false);
                              AgeLabel.classed("inactive",true).classed("active",false);
                              xAxis = UpdateXAxis("income", xAxis);
                              circlePoints = UpdateXPosition("income", circlePoints, "#ffad33", "#e68a00");
                              circleLabels = UpdateXLabels("income", circleLabels);
                              selectXAxis = "income";
                              circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);

                          }); 
                          
        // Create a group for Y axis Labels:
        let Grouped_yLabels = chartGroup.append("g")
                          .attr("transform", "rotate(-90)")
                          
        // Create three labels corresponding to healthcare, smokes and obese:
        let HealthcareLabel = Grouped_yLabels.append("text")
                          .attr("y", 0 - margin.left + 60)
                          .attr("x", 0 -(height/ 2))
                          .text("Lacks Healthcare (%)")
                          .attr("value","healthcare")
                          .attr("class", "active")
                          .on("click", function(){
                              HealthcareLabel.classed("active",true).classed("inactive",false);
                              SmokesLabel.classed("inactive",true).classed("active",false);
                              ObeseLabels.classed("inactive",ture).classed("active",false);
                              yAxis = UpdateYAxis("smokes",yAxis);
                              circlePoints = UpdateYPosition("healthcare", circlePoints, "#ff9999", "#ff6666");
                              circleLabels = UpdateYLabels("healthcare", circleLabels);
                              selectYAxis = "healthcare";
                              circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis); 

                          });

        let SmokesLabel = Grouped_yLabels.append("text")
                          .attr("y", 0 - margin.left + 40)
                          .attr("x", 0 -(height / 2))
                          .text("Smokes (%)")
                          .attr("value", "smokes")
                          .attr("class", "inactive")
                          .on("click", function(){
                              HealthcareLabel.classed("inactive",true).classed("active",false);
                              SmokesLabel.classed("active",true).classed("inactive",false);
                              ObeseLabels.classed("inactive",true).classed("active",false);
                              yAxis = UpdateYAxis("smokes",yAxis);
                              circlePoints = UpdateYPosition("smokes", circlePoints, "#ffaa80", "#ff7733");
                              circleLabels = UpdateYLabels("smokes", circleLabels);
                              selectYAxis = "smokes";
                              circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
                            });

        let ObeseLabels = Grouped_yLabels.append("text")
                           .attr("y", 0 - margin.left + 20)
                           .attr("x", 0 - (height / 2))
                           .test("Obese (%)")
                           .attr("value", "obesity")
                           .attr("class", "inactive")
                           .on("click", function(){
                               HealthcareLabel.classed("inactive",true).classed("active",false);
                               SmokesLabel.classed("inactive",true).classed("active",false);
                               ObeseLabels.classed("active",true).classed("inactive",false);
                               yAxis = UpdateXAxis("obesity",yAxis);
                               circlePoints = UpdateYPosition("obesity", circleLabels);
                               selectYAxis = "obesity";
                               circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
                           });                     
    

        
                          




                        };
