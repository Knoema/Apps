charts = {	
	drawLines: function (container, series, precision) {
		var options = charts.getChartOptions(container, precision);	
		var chart = new Highcharts.Chart(options, function (chart) {

			$.each(series, function (index, series) {
				var option = apps.forecastTrackingTool.prototype.getSource(
					apps.forecastTrackingTool.prototype.getSourceShortName(series.seriesId)
				);
				var chartSeries = {
					id: series.seriesId,
					type: 'line',
					name: option.Name,
					data: series.data,
					unit: series.unit,
					color: '#' + option.Color,
					shadow: false,
					yAxis: 0,
					frequency: series.frequency
				};
				chart.addSeries(chartSeries, false);
			});

			chart.redraw();

			chart.xAxis[0].addPlotBand({
				id: '2011-2016',
				color: 'rgba(84, 141, 212, 0.3)',
				from: Date.UTC(2011, 0, 1),
				to: Date.UTC(2016, 0, 1)
			});
			
			$(chart.container).mouseout(function () {
				$('#tooltip').hide();
			});
		});
	},

	drawBars: function (container, series, precision) {

		var options = charts.getChartOptions(container, precision);	
		options.xAxis.categories = [series[0].data[0][0]];
		options.xAxis.type="linear";
		var chart = new Highcharts.Chart(options, function (chart) {

			$.each(series, function (index, series) {
				var option = apps.forecastTrackingTool.prototype.getSource(
					apps.forecastTrackingTool.prototype.getSourceShortName(series.seriesId)
				);
				var chartSeries = {
					id: series.seriesId,
					type: 'column',
					name: option.Name,
					data: series.data,
					unit: series.unit,
					color: '#' + option.Color,
					shadow: false,
					yAxis: 0,
					frequency: series.frequency
				};
				chart.addSeries(chartSeries, false);
			});

			chart.redraw();
			$(chart.container).mouseout(function () {
				$('#tooltip').hide();
			});
		});
	},	

	getChartOptions: function (container, precision) {
		var options = {
			chart: {
				renderTo: container,
				defaultSeriesType: "mixed",
				animation: false,
				backgroundColor: '#FFFFFF',		
				plotBorderWidth: 1,
				animation: false,
				plotBackgroundColor: {
					linearGradient: [0, 255, 255, 255],
					stops: [

						[0, 'rgb(255, 255, 255)'],
						[1, 'rgb(184, 204, 228)']
					]
				}
			},
			credits: { enabled: false },
			title: { text: '' },
			plotOptions: {
				series: {
					cursor: 'pointer',
					marker: {
						enabled: false,
						states: {
							hover: {
								enabled: true,
								lineColor: '#366092',
								radius: 4,
								lineWidth: 1
							}
						}
					},
					dataLabels: {
						color: "black"
					}
				},
				line: {					
					animation: false
				},
				column: {
					dataLabels: {
						enabled: true,
						formatter: function () {
							if (precision)
								return Knoema.Helpers.roundToNDecimalPlaces(this.y, precision) + ' %';
							else
								return this.y;
						}, 
						style: {
							font: '10pt Calibri',
							color: '#366092'
						}
					},
					animation: false
				}
			},
			xAxis: {
				gridLineWidth: 0,
				showLastLabel: true,
				showFirstLabel: true,
				startOnTick: false,
				endOnTick: false,				
				dateTimeLabelFormats :{
					msf: 'A',
					year: '%Y'
				},
				labels: {
					style: {
						font: 'bold 10pt Calibri',
						color: '#366092'
					}
				},
				plotBands: [{ 
					id: '2011-2016',
					color: '#FCFFC5',
					from: Date.UTC(2011, 0, 1),
					to: Date.UTC(2016, 0, 1)
				}],
				lineColor: '#888888',
				tickColor: '#888888',
				lineWidth: 1,
				margin: 10,
				type: 'datetime'
			},
			yAxis: [{
				gridLineWidth: 1,
				gridLineColor: '#888888',
				labels: {
					style: {
						font: 'bold 10pt Calibri',
						color: '#366092'
					},
					formatter: function () {
						if (precision)
							return Knoema.Helpers.roundToNDecimalPlaces(this.value, precision - 1) + ' %';
						else
							return this.value;
					}
				},
				title: {
					style: {
						font: 'bold 10pt Calibri',
						color: '#366092'				
					},
					text: ''
				},
				lineColor: '#888888',
				tickColor: '#888888',
				lineWidth: 1,
				margin: 10
			},
			{
				gridLineWidth: 0,
				labels: {
					style: {
						font: 'bold 10pt Calibri',
						color: '#366092'
					}
				},
				title: {
					style: {
						font: 'bold 10pt Calibri',
						color: '#366092'
					},
					text: ''
				},
				lineColor: '#888888',
				tickColor: '#888888',
				opposite: true,
			}],
			legend: {				
				enabled: false				
			},
			tooltip: {
				borderRadius: 0,
				borderWidth: 0,
				style: {
					color: '#000',
					font: '10pt Calibri'
				},
				crosshairs: [true],
				backgroundColor: '#dce6f1',
				formatter: function () {

					var unit = this.series.options.unit;
					var seriesName = this.series.options.name;			
							
					if (precision)
						value = Knoema.Helpers.roundToNDecimalPlaces(this.y, precision);
					else
						value = this.y;
					if (this.point.name) {
						txt = "<b>" + seriesName + "</b><br/>" + this.point.name + "<br/>Value: " + value + " " + unit;					
					} else {
						txt = "<b>" + seriesName + "</b><br/>Date: " + new Date(this.x).getUTCFullYear() + "<br/>Value: " + value + " " + unit;
					}

					if ($('#tooltip').length > 0) {
						$('#tooltip').css('padding', '5px');
						$('#tooltip')
							.show()
							.html(txt);
						return false;
					}
					else
						return txt;
				}
			},
			series: {}
		};
		return options;
	},
	

	drawMap: function (container, data) {

		$.get('/img/world.svg?version=0.83.796.3361', function (result) {
			var htmlString = result.xml; //IE
			if (!htmlString) {
				if (result.documentElement) {
					htmlString = document.importNode(result.documentElement, true); //non-IE
				} else if (typeof result.getElementById == 'function') {
					htmlString = result.getElementById('svgmapid'); //last resort
				}
			}
			$(container).html(htmlString);
			var map = $(container).find('#svgmapid');
			charts.setTooltip(map, data);
			if (map != null && data.length > 0) {
				$.each(data, function () {
					$(map).find('#' + this.isoCode).attr("fill", this.color);
				});
			};
		});
	},

	setTooltip: function (map, data) {

		var tooltip = function () {
			var top = 3, left = -3, maxwidth = 300; //tooltip positioning
			var speed = 10, timer = 20, endalpha = 95, alpha = 0; //tooltip fading
			var height, width;
			var ie = document.all ? true : false;
			var $container = $('body');
			var $tooltip_div;
			return {
				show: function (text, borderColor, argWidth) {
					if ($container.find('.map-tooltip').length == 0) {
						$container.append('<div class="map-tooltip" style="opacity: 0;"/>');
						$container.find('.map-tooltip').append('<div class="map-tooltip-cont" />');
						document.onmousemove = this.pos;
					}
					$tooltip_div = $container.find('.map-tooltip');
					$tooltip_div.css('display', 'block');
					$tooltip_div.find('.map-tooltip-cont').css('border-color', borderColor).html(text);
					if (argWidth) {
						$tooltip_div.css('width', argWidth + 'px');
					}
					if (!ie) {
						var width = parseInt($tooltip_div.get(0).offsetWidth);
						if (width > maxwidth) {
							$tooltip_div.css('width', maxwidth + 'px');
						}
					} else {
						if (text.length == 4) {
							$tooltip_div.css('width', '46px');
						} else {
							$tooltip_div.css('width', '150px');
						}
					}
					height = parseInt($tooltip_div.get(0).offsetHeight) + top;
					clearInterval($tooltip_div.get(0).timer);
					$tooltip_div.get(0).timer = setInterval(function () { tooltip.fade(1) }, timer);
				},
				pos: function (e) {
					var y = ie ? event.clientY + document.documentElement.scrollTop : e.pageY;
					var x = ie ? event.clientX + document.documentElement.scrollLeft : e.pageX;
					$tooltip_div = $container.find('.map-tooltip');
					$tooltip_div.css('top', (y - height) + 'px');
					$tooltip_div.css('left', (x + left) + 'px');
				},
				fade: function (delay) {
					var a = alpha;
					$tooltip_div = $container.find('.map-tooltip');
					if ((a != endalpha && delay == 1) || (a != 0 && delay == -1)) {
						var i = speed;
						if (endalpha - a < speed && delay == 1) {
							i = endalpha - a;
						} else if (alpha < speed && delay == -1) {
							i = a;
						}
						alpha = a + (i * delay);
						$tooltip_div.css('opacity', alpha * .01);
						$tooltip_div.css('filter', 'alpha(opacity=' + alpha + ')');
					} else {
						clearInterval($tooltip_div.get(0).timer);
						if (delay == -1) { $tooltip_div.css('display', 'none'); }
					}
				},
				hide: function () {
					if ($container.find('.map-tooltip').length == 0) {
						$container.append('<div class="map-tooltip" style="opacity: 0;"/>');
						$container.find('.map-tooltip').append('<div class="map-tooltip-cont" />');
						document.onmousemove = this.pos;
					}
					$tooltip_div = $container.find('.map-tooltip');
					clearInterval($tooltip_div.get(0).timer);
					$tooltip_div.get(0).timer = setInterval(function () { tooltip.fade(-1) }, timer);
				}
			};
		} ();

		$(map).undelegate();

		$(map).delegate('g', 'mouseover', function (event) {
			target = $(event.target).closest('g')[0];
			$.each(data, function () {
				if (this.isoCode == target.id) {
					var target1 = $(target).attr("fill");
					$(target).attr("opacity", 0.5);
					tooltip.show(this.tooltip, $(target1).attr("fill"));
				}
			});
		});

		$(map).delegate('path', 'mouseover', function (event) {
			target = event.target;
			$.each(data, function () {
				if (this.isoCode == target.id) {
					$(target).attr("opacity", 0.5);
					tooltip.show(this.tooltip, $(target).attr("fill"));
				}
			});
		});

		$(map).delegate('g', 'mouseout', function (event) {
			$($(event.target).closest('g')[0]).attr("opacity", 1);
			tooltip.hide();
		});

		$(map).delegate('path', 'mouseout', function (event) {
			$(event.target).attr("opacity", 1);
			tooltip.hide();
		});
	}
};




