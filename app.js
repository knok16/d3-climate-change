(function init() {
    'use strict';

    var margin = {top: 50, right: 40, bottom: 50, left: 40},
        chart1Width = 300,
        chart2Width = 700,
        chartHeight = 500;

    var svg = d3.select('body').select('svg#main-plot')
        .attr('width', chart1Width + chart2Width + (margin.left + margin.right) * 2)
        .attr('height', chartHeight + margin.top + margin.bottom);

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    d3.csv('./data.csv', parseInts, function (csv) {
        var chart1 = svg.append('g')
            .attr('id', 'montly-chart')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .attr('width', chart1Width)
            .attr('height', chartHeight);
        var chart2 = svg.append('g')
            .attr('id', 'annual-chart')
            .attr('class', 'chart')
            .attr('transform', 'translate(' + (chart1Width + margin.left * 2 + margin.right) + ',' + margin.top + ')')
            .attr('width', chart2Width)
            .attr('height', chartHeight);

        var monthScale = d3.scale.ordinal().domain(months).rangeBands([0, chart1Width], 0.1);
        var minYear = d3.min(csv, function(row) {return row['Year']});
        var maxYear = d3.max(csv, function(row) {return row['Year']});
        var yearScale = d3.scale.linear().domain([minYear, maxYear]).range([0, chart2Width]);
        var minTemp = d3.min(csv, function(row) {return row['Glob']});
        var maxTemp = d3.max(csv, function(row) {return row['Glob']});
        var tempScale = d3.scale.linear().domain([minTemp - 30, maxTemp + 20]).range([chartHeight, 0]);
        var colorScale = d3.scale.linear().domain([minTemp - 30, maxTemp + 20]).range([-0.7, 0.6]);

        var doubleFormatter = d3.format('.2f');
        var tempFormatter = function tempFormatter(d) {return doubleFormatter(d / 100) + ' \u00B0C';}

        var xAxis1 = d3.svg.axis().scale(monthScale).orient('bottom').outerTickSize(0);
        var xAxis2 = d3.svg.axis().scale(yearScale).orient('bottom').outerTickSize(0).tickFormat(function (d) {return d;});
        var yAxisLeft1 = d3.svg.axis().scale(tempScale).orient('left').tickSize(0, 0).tickPadding(20).tickFormat(tempFormatter);
        var yAxisRight1 = d3.svg.axis().scale(tempScale).orient('right').ticks(0).outerTickSize(0);
        var yAxisEmpty = d3.svg.axis().scale(tempScale).orient('right').ticks(0).outerTickSize(0);

        chart1.append('g').attr('class', 'axis x-axis month-axis').attr('transform', 'translate(0, ' + chartHeight + ')').call(xAxis1);
        chart1.append('g').attr('class', 'axis y-axis temp-axis').call(yAxisEmpty);
        chart1.append('g').attr('class', 'axis y-axis temp-axis').attr('transform', 'translate(' + chart1Width + ', 0)').call(yAxisRight1);

        chart2.append('g').attr('class', 'axis x-axis year-axis').attr('transform', 'translate(0, ' + chartHeight + ')').call(xAxis2);
        chart2.append('g').attr('class', 'axis y-axis temp-axis').call(yAxisLeft1);
        chart2.append('g').attr('class', 'axis y-axis temp-axis').attr('transform', 'translate(' + chart2Width + ', 0)').call(yAxisEmpty);

        var avgLine = chart1.append('svg:line').attr('class', 'line').attr('id', 'avg-line');
        var graph2 = chart2.append('svg:path').attr('class', 'line graph');
        var sweepLine = chart2.append('svg:line').attr('class', 'line').attr('id', 'sweep-line');
        var tempLabel = chart2.append('svg:text').attr('class', 'label').attr('id', 'temp-label');
        var yearLabel = chart2.append('svg:text').attr('class', 'label').attr('id', 'year-label');
        var tempAxisLabel1 = chart1.append('svg:text').attr('class', 'axis-legend')
            .attr('transform', 'translate(' + (-margin.left / 2) + ',' + (chartHeight / 2) + ')rotate(-90)')
            .text('avg t\u00B0C m.');
        var tempAxisLabel1 = chart2.append('svg:text').attr('class', 'axis-legend')
            .attr('transform', 'translate(' + (chart2Width + margin.right / 2) + ',' + (chartHeight / 2) + ')rotate(90)')
            .text('avg t \u00B0C y.a.');

        graph2.attr('d', function() {
            return d3.svg.line()
                .x(function(d) {return yearScale(+d['Year']);})
                .y(function(d) {return tempScale(+d['Glob']);})
                .interpolate('monotone')(csv);
        });

        svg.on('mousemove', function() {
            var year = Math.round(yearScale.invert(d3.event.offsetX - (chart1Width + margin.left * 2 + margin.right)));
            showYear(Math.min(Math.max(0, year - csv[0]['Year']), csv.length - 1));
        });

        showYear(32);

        function showYear(index) {
            var animationDuration = 100;
            var easingEffect = 'linear';
            var mainColor = 0;
            var yearSeparator = 1970;
            var labelMargin = 10;

            var yearData = csv[index];
            var year = yearData['Year'];
            var globalTemp = yearData['Glob'];
            var c = colorScale(globalTemp);
            var color = d3.hsl(c >= 0 ? mainColor : mainColor + 180, Math.abs(c), 0.6);

            graph2.transition()
                .attr('stroke', color)
                .duration(animationDuration)
                .ease(easingEffect);

            var t = chart1.selectAll('rect').data(months);
            t.enter().append('svg:rect');
            t.transition()
                .attr('x', function(d){return monthScale(d);})
                .attr('y', function(d) {return tempScale(yearData[d]);})
                .attr('width', monthScale.rangeBand())
                .attr('height', function(d) {return tempScale.range()[0] - tempScale(yearData[d]);})
                .attr('fill', color)
                .duration(animationDuration)
                .ease(easingEffect);
            t.exit().remove();
            avgLine.transition()
                .attr({
                    x1: monthScale.range()[0],
                    y1: tempScale(globalTemp),
                    x2: svg.attr('width'),
                    y2: tempScale(globalTemp)
                })
                .duration(animationDuration)
                .ease(easingEffect);
            sweepLine.transition()
                .attr({
                    x1: yearScale(year),
                    y1: tempScale.range()[0],
                    x2: yearScale(year),
                    y2: tempScale.range()[1]
                })
                .duration(animationDuration)
                .ease(easingEffect);
            tempLabel.transition()
                .text(tempFormatter(globalTemp))
                .attr('x', year < yearSeparator ? yearScale.range()[1] - labelMargin : yearScale.range()[0] + labelMargin)
                .attr('y', tempScale(globalTemp) - labelMargin)
                .attr('fill', color)
                .attr('text-anchor', year < yearSeparator ? 'end' : 'start')
                .duration(animationDuration)
                .ease(easingEffect);

            yearLabel.transition()
                .text(year)
                .attr('x', yearScale(year) + (year < yearSeparator ? labelMargin : - labelMargin))
                .attr('y', tempScale.range()[0] - labelMargin)
                .attr('text-anchor', year < yearSeparator ? 'start' : 'end')
                .duration(animationDuration)
                .ease(easingEffect);
        }
    });

    function parseInts(row) {
        for (var key in row) {
            if (row.hasOwnProperty(key)) {
                row[key] = +row[key];
            }
        }
        return row;
    }
})();