var apps = apps || {};
apps.forecastTrackingTool = function () {
	
	Knoema.Helpers.clientId = 'B6O/Vg=';
	
	this.countriesUrl ='/api/1.0/meta/dataset/AEF2011OCT/dimension/Country';
	this.indicatorsUrl = '/api/1.0/meta/dataset/AEF2011OCT/dimension/Indicator';
	this.sourcesUrl = '/api/1.0/meta/dataset/AEF2011OCT/dimension/Source';

	this.constants = this.constants();
	this.selectedSource = null;	
	
	this.bindEvents();
};

apps.forecastTrackingTool.prototype.loadGroupOfSeven = function (indicator) {

	var countries = this.getCountries();
	$.each(countries, $.proxy(function (index, country) {
		var dataDescriptor = this.getDataDescriptor(
					this.getTimeRange(
						this.getConstant('First year'),
						this.getConstant('Last year')
					),
					this.getConstant('IMF'),
					country,
					indicator,
					this.getMeasureLatestFigures().value
				);

		var container = country;	
		this.setLoadingState($('div#' + container));	
		Knoema.Helpers.post(dataDescriptor, $.proxy(function(pivotResponse){

				var series = this.getTimeSeries(dataDescriptor, pivotResponse, true);
				charts.drawLines(container, series, this.getConstant('Precision'));

				this.setLoadingState(container);

			}, this));		
	}, this));
};

apps.forecastTrackingTool.prototype.loadCountries = function () {

	var container = $('div#countries');
	var app = this;
	
	app.setLoadingState(container);

	Knoema.Helpers.get(this.countriesUrl, function (result) {
		$.each(result.items, function () {
			var href = 'explore.html?country=' + this.key;
			$(Knoema.Helpers.buildHTML('a', { 'href': href, 'countryId': this.key }))
				.appendTo($(Knoema.Helpers.buildHTML('div'))
					.appendTo(container)).text(this.name);
		});
		app.removeLoadingState(container);
	});
};

apps.forecastTrackingTool.prototype.loadIndicators = function () {

	var container = $('div#indicators');	
	var app = this;

	app.setLoadingState(container);

	Knoema.Helpers.get(this.indicatorsUrl, function (result) {
		$.each(result.items, function () {
			if (this.level > 0) {
				var href = 'explore.html?indicator=' + this.key;
				$(Knoema.Helpers.buildHTML('a', { 'href': href, 'countryId': this.key }))
					.appendTo($(Knoema.Helpers.buildHTML('div'))
						.appendTo(container)).text(this.name);
			}
		});
		app.removeLoadingState(container);
	});
};

apps.forecastTrackingTool.prototype.list = function () {
	
	var indicator = this.getUrlVar('indicator');
	var country = this.getUrlVar('country');
	
	if (indicator != undefined) {
		$('div#filter').show();
		$('div#tabs').show();
		this.exploreForecastingIndicator(indicator);
	}
	else if (country != undefined)
		this.exploreForecastingCountry(country);
};

apps.forecastTrackingTool.prototype.table = function (){
	
	var app = this;

	var start = app.getConstant('First year');
	var end = app.getConstant('Last year');
	time =  {
		"Key":"-196",
		"Name":"Mean absolute error (MAE)",
		"Formula": [start, end, "avga"]
	}

	var measureYear = app.getMeasureAbsoluteErrorForOneYear();
	var measureTwoYears = app.getMeasureAbsoluteErrorForTwoYears();

	var container = $('div#table');	
	app.setLoadingState(container);

	Knoema.Helpers.get(app.sourcesUrl, function (datasetSources) {
		Knoema.Helpers.get(app.countriesUrl, function (datasetCountries) {

			// Get sources for data descriptor 
			var sources = app.getKeys(datasetSources.items);

			// Get countries for data descriptor 
			var countries = app.getKeys(datasetCountries.items);

			var dataDescriptor = app.getDataDescriptor([time], sources, countries, app.getUrlVar('indicator'), [measureYear.value, measureTwoYears.value]);
			Knoema.Helpers.post(dataDescriptor, function (pivotResponse) {
				
				if (pivotResponse.data.length > 0)
				{
					// Group data by countries
					var data = [];
					$.each(pivotResponse.data, function (index, item) {
						app.pushErrorForecastingData(data, item);
					});
			
					var statisticsForOneYear = [];
					var statisticsForTwoYears= [];

					// Display sources with best forecasting
					var table = $('div#ftt-explore div#table table');
					$.each(data, function (index, item) {

						var row = $(Knoema.Helpers.buildHTML('tr')).appendTo(table);
						$(Knoema.Helpers.buildHTML('td')).appendTo(row).text(item.Country);

						var title = '';
						var color = app.getConstant('No data color');

						// For error for 1 year
						if (item.MinErrorOne.Source != ''){
							title = app.getSourceShortName(item.MinErrorOne.Source) + '-' + Knoema.Helpers.roundToNDecimalPlaces(item.MinErrorOne.Value, app.getConstant('Precision')) + '%';
							color = app.getSource(app.getSourceShortName(item.MinErrorOne.Source)).Color;			
							app.pushStatistics(statisticsForOneYear, item.MinErrorOne, '1 year');
						}

						$(Knoema.Helpers.buildHTML('a',
							{
								'class': 'source-color',
								'style': 'background-color:#' + color,
								'title': title
							})).appendTo($(Knoema.Helpers.buildHTML('td'))
								.appendTo(row));

						title = '';
						color = app.getConstant('No data color');

						// For error for 2 years
						if (item.MinErrorTwo.Source != ''){
							title = app.getSourceShortName(item.MinErrorOne.Source) +'-' + Knoema.Helpers.roundToNDecimalPlaces(item.MinErrorTwo.Value,  app.getConstant('Precision')) + '%';
							color = app.getSource(app.getSourceShortName(item.MinErrorTwo.Source)).Color;
							app.pushStatistics(statisticsForTwoYears, item.MinErrorTwo, '2 years');
						}

						$(Knoema.Helpers.buildHTML('a',
							{
								'class': 'source-color',
								'style': 'background-color:#' + color,
								'title': title
							})).appendTo($(Knoema.Helpers.buildHTML('td'))
								.appendTo(row));
					});

					// Display statistics 
					$('div#statistics').show();
					charts.drawBars('statisticsOneYear',statisticsForOneYear);
					charts.drawBars('statisticsTwoYears',statisticsForTwoYears);

					// Display legend 
					var legendSources = statisticsForOneYear;
					if (statisticsForOneYear.length < statisticsForTwoYears.length)
						legendSources = statisticsForTwoYears;

					$.each(legendSources, function(){
						$(Knoema.Helpers.buildHTML('a',
							{
								'class': 'source-color',
								'style': 'background-color:#' + app.getSource(app.getSourceShortName(this.seriesId)).Color,
							})).appendTo($('div#tableLegend'));
						$(Knoema.Helpers.buildHTML('span', {'style': 'margin-right:10px'}))
							.appendTo($('div#tableLegend'))
								.text(app.getSourceShortName(this.seriesId));
					});

					$(table).show();
				}
				else 
					app.showNoDataMessage('div#table');

				app.removeLoadingState(container);
			});				
		});
	});		
};


apps.forecastTrackingTool.prototype.map = function(measureId){
	
	$('div#ftt-map').html('');
	var legend = $('div#map-header div');
	$(legend).html('');

	var app = this;

	if (app.svg()) {
		var start = this.getConstant('First year');
		var end = this.getConstant('Last year');
		time =  {
			"Key":"-196",
			"Name":"Mean absolute error (MAE) — 1 year",
			"Formula": [start, end, "avga"]
		}

		var container = $('#map');	
		app.setLoadingState(container);

		Knoema.Helpers.get(app.sourcesUrl, function (datasetSources) {
			Knoema.Helpers.get(app.countriesUrl, function (datasetCountries) {

				// Get sources for data descriptor 
				var sources = app.getKeys(datasetSources.items);

				// Get countries for data descriptor 
				var countries = app.getKeys(datasetCountries.items);

				var dataDescriptor = app.getDataDescriptor([time], sources, countries, app.getUrlVar('indicator'), measureId);
				dataDescriptor.RegionIdsRequired = true;
			
				Knoema.Helpers.post(dataDescriptor, function (pivotResponse) {

					if (pivotResponse.data.length > 0)
					{
						// Group data by countries
						var data = [];
						$.each(pivotResponse.data, function (index, item) {
							app.pushErrorForecastingData(data, item);
						});
			
						// Display map with best forecasting
						var mapData = [];	
						var sources = [];					
						$.each(data, function () {
					
							for (i in pivotResponse.regions) {
								if (pivotResponse.regions[i] === this.Country) {
							
									var item = this.MinErrorOne;
									if (measureId == app.getMeasureAbsoluteErrorForTwoYears().value)
										item = this.MinErrorTwo;

									if (item.Source != ''){
										mapData.push({
											isoCode: i,
											color: '#' + app.getSource(app.getSourceShortName(item.Source)).Color,
											tooltip: this.Country + '<br/> Value: ' 
												+ app.getSourceShortName(item.Source) 
												+ '-' + Knoema.Helpers.roundToNDecimalPlaces(item.Value, app.getConstant('Precision')) + '%'
										});	
									
										if ($.inArray(item.Source, sources) == -1)
											sources.push(item.Source);			
									}				
								}
							}									
						});
					
						charts.drawMap($('#ftt-map'), mapData);

						// Display legend							
						$.each(sources, function(){
							$(Knoema.Helpers.buildHTML('a',
								{
									'class': 'source-color',
									'style': 'background-color:#' +  app.getSource(app.getSourceShortName(this)).Color,
								})).appendTo(legend);
							$(Knoema.Helpers.buildHTML('span', {'style': 'margin-right:10px'}))
								.appendTo(legend)
									.text(app.getSourceShortName(this));
						});
					}
					else 
						app.showNoDataMessage('div#map');

					app.removeLoadingState(container);
				});					
			});
		});
	}
	else 
		app.showNoSVGMessage($('div#ftt-map'));
}
apps.forecastTrackingTool.prototype.exploreForecastingIndicator = function (indicatorId) {

	var container = $('div#countries');
	this.setLoadingState(container);

	$('div#parameter div.country div').text('Country');
	this.setIndicatorName(indicatorId);

	$('div#agencies').html('');
	$('div#visualization').html('');

	var app = this;
	
	Knoema.Helpers.get(app.sourcesUrl, function (datasetSources) {
		Knoema.Helpers.get(app.countriesUrl, function (datasetCountries) {

			// Get sources for data descriptor 
			var sources = app.getKeys(datasetSources.items);

			// Get countries for data descriptor 
			var countries = app.getKeys(datasetCountries.items);

			// Get available countries and sources for selected indicator and measure "latest figures"
			var dataDescriptor = app.getDataDescriptor(
				app.getTimeRange(app.getConstant('First year for getting sources'), app.getConstant('Last year')),
				sources,
				countries,
				indicatorId,
				app.getMeasureLatestFigures().value);
			Knoema.Helpers.post(dataDescriptor, function (responseLatestFigures) {

				// Get available sources for selected indicator and measure "absolute error for 1 year"
				dataDescriptor = app.getDataDescriptor(
					app.getTimeRange(app.getConstant('First year for getting sources'),
					app.getConstant('Last year')),
					sources,
					countries,
					indicatorId,
					app.getMeasureAbsoluteErrorForOneYear().value);
				Knoema.Helpers.post(dataDescriptor, function (responseAbsoluteErrorForYear) {

					// Get available sources for selected indicator and measure "absolute error for 2 years"
					dataDescriptor = app.getDataDescriptor(
						app.getTimeRange(app.getConstant('First year for getting sources'),
						app.getConstant('Last year')),
						sources,
						countries,
						indicatorId,
						app.getMeasureAbsoluteErrorForTwoYears().value);
					Knoema.Helpers.post(dataDescriptor, function (responseAbsoluteErrorForTwoYear) {

						// Group sources by countries
						var arrayLatestFigures = [];
						$.each(responseLatestFigures.data, function (index, data) {
							if (data.Value != null)
								app.pushData(arrayLatestFigures, data.Country, data.Source);
						});

						var arrayAbsoluteErrorForYear = [];
						$.each(responseAbsoluteErrorForYear.data, function (index, data) {
							if (data.Value != null)
								app.pushData(arrayAbsoluteErrorForYear, data.Country, data.Source);
						});

						var arrayAbsoluteErrorForTwoYears = [];
						$.each(responseAbsoluteErrorForTwoYear.data, function (index, data) {
							if (data.Value != null)
								app.pushData(arrayAbsoluteErrorForTwoYears, data.Country, data.Source);
						});

						// Display countries and sources
						$.each(arrayLatestFigures, function (index, latestFigure) {
							var countyId = app.getKey(datasetCountries.items, latestFigure.Parameter);

							$(Knoema.Helpers.buildHTML('div', { 'class': 'country', 'id': countyId })).appendTo($('div#countries')).text(latestFigure.Parameter);
							var divSources = $(Knoema.Helpers.buildHTML('div', { 'class': 'country', 'id': countyId })).appendTo($('div#agencies'));

							// Display sources that have "latest figures" data
							latestFigure.Sources.sort();
							$.each(latestFigure.Sources, function (index, source) {

								$(Knoema.Helpers.buildHTML('a', { 'class': 'source-color', 'style': 'background-color:#' + app.getSource(app.getSourceShortName(source)).Color }))
									.appendTo($(divSources));

								$(Knoema.Helpers.buildHTML('span', { 'class': 'source', 'id': app.getKey(datasetSources.items, source) }))
									.appendTo($(divSources))
										.text(source.split(' ')[0]);

								if (index < latestFigure.Sources.length - 1)
									$(divSources).append(' / ');
							});

							var divHorizon = $(Knoema.Helpers.buildHTML('div', { 'class': 'country', 'id': countyId })).appendTo($('div#horizons'));

							// Display sources that have "forecasting error for 1 year" data 							
							app.displayErrorsForIndicator(arrayAbsoluteErrorForYear, latestFigure, datasetSources.items, '1-year', divHorizon);

							// Display sources that have "forecasting error for 2 year" data 
							app.displayErrorsForIndicator(arrayAbsoluteErrorForTwoYears, latestFigure, datasetSources.items, '2-years', divHorizon);

						});

						$('span.source').click(function () {
							var container = app.getChartContainer($(this).parent().attr('id'), $(this).attr('id'));
							if (container != null) {
								var sources = app.getSources($(this).parent(), $(this).attr('id'));
								app.drawForecasting(container, $(this).parent().attr('id'), indicatorId, $(this).attr('id'), sources);
							}
						});

						$('span.year').click(function () {
							var container = app.getChartContainer($(this).parent().attr('id'), $(this).attr('id'));
							if (container != null) {
								availableSources = $(this).attr('sources').split(',');
								app.drawForecastingError(container, $(this).parent().attr('id'), indicatorId, availableSources, $(this).attr('id'));
							}
						});

						app.removeLoadingState(container);
					});
				});
			});
		});
	});
};

apps.forecastTrackingTool.prototype.displayErrorsForIndicator = function(items, latestFigure, sources, text, container){
		
		var app = this;
		var availableSources = [];
		$.each(items, function (index, absoluteError) {
			if (absoluteError.Parameter == latestFigure.Parameter) {
				$.each(absoluteError.Sources, function (index, source) {
					availableSources.push(app.getKey(sources, source));
				});
			}
		});

		if (availableSources.length > 0){
		
			var id = '1';
			if (text == "2-years")
				id = '2';

			$(Knoema.Helpers.buildHTML('span', { 'class': 'year', 'id': id, 'sources': availableSources.toString() }))
				.appendTo($(container)).text(text);
		}
		else
			$(container).append('&nbsp;');
};

apps.forecastTrackingTool.prototype.exploreForecastingCountry = function (countryId) {

	var container = $('div#countries');	
	this.setLoadingState(container);

	$('div#parameter div.country div').text('Indicator');
	this.setCountryName(countryId);

	$('div#agencies').html('');
	$('div#visualization').html('');

	var app = this;

	Knoema.Helpers.get(this.sourcesUrl, function (datasetSources) {
		Knoema.Helpers.get(app.indicatorsUrl, function (datasetIndicators) {

			// Get indicators for data descriptor 
			var indicators = app.getKeys(datasetIndicators.items);

			// Get sources for data descriptor 
			var sources = app.getKeys(datasetSources.items);

			// Get available indicators and sources for selected country and measures "latest figures" and "absolute error"
			var dataDescriptor = app.getDataDescriptor(app.getTimeRange(app.getConstant('First year for getting sources'), app.getConstant('Last year')), sources, countryId, indicators,
				[
					app.getMeasureLatestFigures().value,
					app.getMeasureAbsoluteErrorForOneYear().value,
					app.getMeasureAbsoluteErrorForTwoYears().value
				]);
			Knoema.Helpers.post(dataDescriptor, function (pivotResponse) {

				// Group sources by indicators
				var array = [];
				$.each(pivotResponse.data, function (index, data) {
					if (data.Value != null && data.Measure == "Latest figures") {
						app.pushData(array, data.Indicator, data.Source);
					}
				});

				// Display indicators and sources
				$.each(array, function (index, indicator) {

					var parameterId = app.getKey(datasetIndicators.items, indicator.Parameter);

					$(Knoema.Helpers.buildHTML('div', { 'class': 'country', 'id': parameterId })).appendTo($('div#countries')).text(indicator.Parameter);
					var divSources = $(Knoema.Helpers.buildHTML('div', { 'class': 'country', 'id': parameterId })).appendTo($('div#agencies'));

					// Display sources that have "latest figures" data 
					indicator.Sources.sort();
					$.each(indicator.Sources, function (index, source) {

						$(Knoema.Helpers.buildHTML('a', { 'class': 'source-color', 'style': 'background-color:#' + app.getSource(app.getSourceShortName(source)).Color }))
							.appendTo($(divSources));

						$(Knoema.Helpers.buildHTML('span', { 'class': 'source', 'id': app.getKey(datasetSources.items, source) }))
							.appendTo($(divSources))
								.text(app.getSourceShortName(source));

						if (index < indicator.Sources.length - 1)
							$(divSources).append(' / ');
					});

					var divHorizon = $(Knoema.Helpers.buildHTML('div', { 'class': 'country', 'id': parameterId })).appendTo($('div#horizons'));

					// Display sources that have "absolute error for 1 year" data 
					app.displayErrors(pivotResponse.data, indicator.Parameter, app.getMeasureAbsoluteErrorForOneYear(),datasetSources.items, divHorizon);

					// Display sources that have "absolute error for 2 year" data 
					app.displayErrors(pivotResponse.data, indicator.Parameter, app.getMeasureAbsoluteErrorForTwoYears(),datasetSources.items, divHorizon);

				});

				$('span.source').click(function () {
					var container = app.getChartContainer($(this).parent().attr('id'), $(this).attr('id'));
					if (container != null) {
						var sources = app.getSources($(this).parent(), $(this).attr('id'));
						app.drawForecasting(container, countryId, $(this).parent().attr('id'), $(this).attr('id'), sources);
					}
				});

				$('span.year').click(function () {
					var container = app.getChartContainer($(this).parent().attr('id'), $(this).attr('id'));
					if (container != null) {
						availableSources = $(this).attr('sources').split(',');
						app.drawForecastingError(container, countryId, $(this).parent().attr('id'), availableSources, $(this).attr('id'));
					}
				});

				app.removeLoadingState(container);
			});
		});
	});
};

apps.forecastTrackingTool.prototype.displayErrors = function(items, indicator, measure, sources, container){

	var app = this;

	var sourcesForYear = [];
	$.each(items, function (index, data) {
		if (data.Value != null) {
			if (indicator == data.Indicator && data.Measure == measure.key) {
				var sourceId = app.getKey(sources, data.Source);
				if ($.inArray(sourceId, sourcesForYear) == -1)
					sourcesForYear.push(sourceId);
			};
		};
	});

	if (sourcesForYear.length > 0){
		var text = '1-year';
		var id = '1';
		if (measure.key == app.getMeasureAbsoluteErrorForTwoYears().key){
			text =  '2-years'
			id = '2';
		};
		$(Knoema.Helpers.buildHTML('span', { 'class': 'year', 'id': id, 'sources': sourcesForYear.toString() }))
			.appendTo(container).text(text);
	}
	else
		$(container).append('&nbsp;');
};

apps.forecastTrackingTool.prototype.drawForecasting = function (container, country, indicator, baseSource, extraSources) {

	var app = this;
	if (extraSources.length == 0)
		extraSources.push(baseSource);

	var baseDataDescriptor = app.getDataDescriptor(
		app.getTimeRange(app.getConstant('First year'), app.getConstant('Last year')),
		baseSource,
		country,
		indicator,
		app.getMeasureLatestFigures().value);

	var extraDataDescriptor = app.getDataDescriptor(
		app.getTimeRange(app.getConstant('Latest year with actual data') + 1, app.getConstant('Last year')),
		extraSources,
		country,
		indicator,
		app.getMeasureLatestFigures().value);
	
	Knoema.Helpers.post(baseDataDescriptor, function (responseBaseSource) {
		Knoema.Helpers.post(extraDataDescriptor, function (responseExtraSources) {

			var baseSourceSerias = app.getTimeSeries(baseDataDescriptor, responseBaseSource, true);
			var extaSourceSerias = app.getTimeSeries(extraDataDescriptor, responseExtraSources, true);

			// Get base value 
			var baseValue = [];
			$.each(baseSourceSerias[0].data, function () {
				if (new Date(this[0]).getFullYear() == app.getConstant('Latest year with actual data'))
					baseValue.push(this[0], this[1]);
			});

			// Push time series
			var seriesData = [];
			seriesData.push(baseSourceSerias[0]);

			$.each(extaSourceSerias, function () {
				this.data.push(baseValue);
				seriesData.push(this);
			});

			charts.drawLines(container, seriesData, app.getConstant('Precision'));
		});
	});
	
};

apps.forecastTrackingTool.prototype.drawForecastingError = function (container, country, indicator, sources, period) {

		var time;
		var measure;
		if (period == "1") {
			var start = this.getConstant('First year');
			var end = this.getConstant('Last year');
			time = {
				"Key": "-196",
				"Name": "Mean absolute error (MAE) — 1 year",
				"Formula": [start, end, "avga"]
			}
			measure =  this.getMeasureAbsoluteErrorForOneYear().value;
		}
		else if (period == "2") {
			var start = this.getConstant('First year');
			var end = this.getConstant('Last year');
			time = {
				"Key": "-196",
				"Name": "Mean absolute error (MAE) — 2 years",
				"Formula": [start, end, "avga"]
			};
			measure = this.getMeasureAbsoluteErrorForTwoYears().value;
		}

		var dataDescriptor = this.getDataDescriptor([time], sources, country, indicator, measure);
		Knoema.Helpers.post(dataDescriptor, $.proxy(function (pivotResponse) {
			var seriesData = this.getTimeSeries(dataDescriptor, pivotResponse, false);
			charts.drawBars(container, seriesData, this.getConstant('Precision'));
		}, this));
};

apps.forecastTrackingTool.prototype.getChartContainer = function (id, source) {

	var visualization = null;

	// Add visualisation panel 
	$('div#visualization').remove();

	if ($('div[id="' + id + '"]').hasClass('expanded') && this.selectedSource == source) {
		$('div.country').removeClass('expanded');
	}
	else {
		$('div.country').removeClass('expanded');
		$('div[id="' + id + '"]').addClass('expanded');
		visualization = $(Knoema.Helpers.buildHTML('div', { 'id': 'visualization', 'class': 'chart' }))
			.appendTo($('div#countries').find('div#' + id)).get(0);
	}

	// Remember the source for toggling visualization panel
	this.selectedSource = source;
	return visualization;
};

apps.forecastTrackingTool.prototype.setIndicatorName = function (indicatorId) {
	Knoema.Helpers.get(this.indicatorsUrl, function (datasetIndicators) {
		$.each(datasetIndicators.items, function () {
			if (this.key == indicatorId)
				$('div#header div').text(this.name);
		});
	});	
};

apps.forecastTrackingTool.prototype.setCountryName = function (countryId) {
	Knoema.Helpers.get(this.countriesUrl, function (datasetCountries) {
		$.each(datasetCountries.items, function () {
			if (this.key == countryId)
				$('div#header div').text(this.name); 
		});
	});
};

apps.forecastTrackingTool.prototype.getSources = function (container, baseSource) {

	var sources = [];
	$(container).find('span.source').each(function () {
		if (baseSource != $(this).attr('id'))
			sources.push($(this).attr('id'));
	});

	return sources;
};

apps.forecastTrackingTool.prototype.pushData = function(array, parameter, source){
	
	var exists = false;
	for(i=0;i<array.length;i++){
		if (array[i].Parameter == parameter) {
			exists = true;
			break;
		}
	}
	
	if (!exists)
		array.push({
			"Parameter": parameter,
			"Sources": []
			});
	
	for(i=0;i<array.length;i++){
		if (array[i].Parameter == parameter && $.inArray(source, array[i].Sources) == -1)
			array[i].Sources.push(source)
	}
};

apps.forecastTrackingTool.prototype.pushErrorForecastingData = function (array, item){
	
	var measureYear = this.getMeasureAbsoluteErrorForOneYear();
	var measureTwoYears = this.getMeasureAbsoluteErrorForTwoYears();
	
	var exists = false;
	$.each(array, function () {
		if (this.Country == item.Country)
			exists = true;
	});

	if (!exists)
		array.push(
			{
				Country: item.Country,
				MinErrorOne: {
					Source: '',
					Value: 1000
				},
				MinErrorTwo: {
					Source: '',
					Value: 1000
				}
			}
		);
		
	$.each(array, function () {
		if (this.Country == item.Country && item.Value != null) {
			if (item.Measure == measureYear.key) {
				if (this.MinErrorOne.Value > item.Value) {
					this.MinErrorOne.Value = item.Value;
					this.MinErrorOne.Source = item.Source;
				};
			}
			else if (item.Measure == measureTwoYears.key) {
				if (this.MinErrorTwo.Value > item.Value) {
					this.MinErrorTwo.Value = item.Value;
					this.MinErrorTwo.Source = item.Source;
				};
			}
		}
	});
};

apps.forecastTrackingTool.prototype.pushStatistics = function(array, item, title){

	var app = this;
	var exists = false;						
	$.each(array, function () {							
		if (app.isEqualSources(this.seriesId, item.Source))
			exists = true;
	});

	if (!exists)
		array.push(
		{
			seriesId: app.getSourceShortName(item.Source),
			unit: 'countries',
			data: [],
		});
							
	$.each(array, function () {
		if (app.isEqualSources(this.seriesId, item.Source))
			if (this.data.length > 0)
				this.data[0][1]++;
			else
				this.data.push([title ,1]);
	});
};

apps.forecastTrackingTool.prototype.getKeys = function (array) {
	
	var result = [];
	$.each(array, function () {
		result.push(this.key.toString());
	});
	return result;
};

apps.forecastTrackingTool.prototype.getKey = function (array, value) {
	var key;
	var i;
	for (i = 0; i < array.length; i++) {
		if (array[i].name == value) {
			key = array[i].key;
			break;
		}
	}
	return key;
};

apps.forecastTrackingTool.prototype.getConstant = function (key) {

	var result = null;

	$.each(this.constants, function () {
		if (this.key == key)
			result = this.value;
	});

	return result;
};

apps.forecastTrackingTool.prototype.getMeasureLatestFigures = function () {

	var result = null;

	$.each(this.constants, function () {
		if (this.key == 'Latest figures')
			result = this;
	});

	return result;
};

apps.forecastTrackingTool.prototype.getMeasureAbsoluteErrorForOneYear = function (){
	
	var result = null;
	
	$.each(this.constants, function(){
		if (this.key == 'Absolute error, forecast for the year ahead, percentage points')
			result = this;
	});

	return result;
};

apps.forecastTrackingTool.prototype.getMeasureAbsoluteErrorForTwoYears = function (){
	
	var result = null;
	
	$.each(this.constants, function(){
		if (this.key == 'Absolute error, forecast for two years ahead, percentage points')
			result = this;
	});

	return result;
};

apps.forecastTrackingTool.prototype.getCountries = function () {
	return [
		this.getConstant('US'),
		this.getConstant('Japan'),
		this.getConstant('Germany'),
		this.getConstant('UK'),
		this.getConstant('France'),
		this.getConstant('Italy'),
		this.getConstant('Canada')
	];
};

apps.forecastTrackingTool.prototype.getTimeRange = function (start, end) {

	var time = [];
	for (var i = start; i < end; i++)
		time.push(i);
	return time;
};

apps.forecastTrackingTool.prototype.getSourceShortName = function (name) {
	return name.split(' ')[0];
};

apps.forecastTrackingTool.prototype.isEqualSources = function (source1, source2) {
	return this.getSourceShortName(source1) == this.getSourceShortName(source2);
};

apps.forecastTrackingTool.prototype.svg = function(){
	ns = {'svg': 'http://www.w3.org/2000/svg'};
	return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
};

apps.forecastTrackingTool.prototype.showNoDataMessage = function(element) {
	$(element).text('Your current selection does not contain any data.');
};

apps.forecastTrackingTool.prototype.showNoSVGMessage = function(element) {
	var link = '<a href="/notsupportedbrowser" target="_blank">link</a>';
	var text = "Your browser doesn't support graphics functionality required for map gadget. Please use the following " + link + " to get additional information";
	$(element).append('<span>' + text + '</span>');
};


apps.forecastTrackingTool.prototype.getSource = function (name) {

	var options = [
	{
		"Name": "IMF World Economic Outlook",
		"Color": "366092"
	},
	{
		"Name": "WB Global Economic Prospects",
		"Color": "262626"
	},
	{
		"Name": "UN LINK Global Economic Outlook",
		"Color": "76933c"
	},
	{
		"Name": "OECD Economic Outlook",
		"Color": "e26b0a"
	},
	{
		"Name": "EC European Economic Forecast",
		"Color": "800000"
	}];

	var result = null;
	$.each(options, $.proxy(function (index, option) {
		if (this.getSourceShortName(option.Name) == name)
			result = option;
	}, this));
	return result;
};

apps.forecastTrackingTool.prototype.constants = function () {
	return [
		{
			key: "US",
			value: "1001780"
		},
		{
			key: "Japan",
			value: "1000830"
		},
		{
			key: "Germany",
			value: "1000620"
		},
		{
			key: "UK",
			value: "1001770"
		},
		{
			key: "France",
			value: "1000580"
		},
		{
			key: "Italy",
			value: "1000810"
		},
		{
			key: "Canada",
			value: "1000290"
		},
		{
			key: "GDP",
			value: "1000010"
		},
		{
			key: "CPI",
			value: "1000040"
		},
		{
			key: "IMF",
			value: "1000000"
		},
		{
			key: "Latest figures",
			value: "1000000"
		},
		{
			key: "Absolute error, forecast for the year ahead, percentage points",
			value: "1000020"
		},
		{
			key: "Absolute error, forecast for two years ahead, percentage points",
			value: "1000040"
		},
		{
			key: 'Latest year with actual data',
			value: 2010
		},
		{
			key: 'First year for getting sources',
			value: 2005
		},
		{
			key: 'First year',
			value: 2000
		},
		{
			key: 'Last year',
			value: 2016
		},
		{
			key: 'No data color',
			value: 'E5E4E4'
		},		
		{
			key: 'Precision',
			value: 2
		}
	];
};

apps.forecastTrackingTool.prototype.getDataDescriptor = function (time, sources, countries, indicators, measures) {

	return {
		"Frequencies": ["A"],
		"Header": [
			{
				"dimensionId": "Time",
				"members": time
			}],
		"Stub": [
			{
				"dimensionId": "Source",
				"members": $.isArray(sources) ? sources : [sources]
			},
			{
				"dimensionId": "Country",
				"members": $.isArray(countries) ? countries : [countries]
			},
			{
				"dimensionId": "Indicator",
				"members": $.isArray(indicators) ? indicators : [indicators]
			},
			{
				"dimensionId": "Measure",
				"members": $.isArray(measures) ? measures : [measures]
			}],
		"Filter": [
			],
		"Dataset": "AEF2011OCT"
	};
};

apps.forecastTrackingTool.prototype.getTimeSeries = function (dataDescriptor, pivotResponse, isDateTimeSeries) {
	return this.getSeriesDataFromPivotDimensions(pivotResponse.data,  dataDescriptor.Header,  pivotResponse.stub, isDateTimeSeries);
};

apps.forecastTrackingTool.prototype.getSeriesDataFromPivotDimensions = function (data, headerDim, stubDim, isDateTimeXaxis) {
	var seriesData = [];
	var i, j;

	function getDimName(tuple, dimension, isDateTimeXaxis) {
		var allDimName = "", dimId, isCalculatedMember;
		var frequency = tuple.frequency;
		if (dimension.length == 1) {
			dimId = dimension[0].dimensionId;
			allDimName = tuple[dimId];
			if (dimId == 'Time') {
				if (allDimName.toUpperCase().indexOf('Date'.toUpperCase()) != -1) {
					if (isDateTimeXaxis) {
						allDimName = parseInt(allDimName.substr(6));
					} else {
						allDimName = new Date(parseInt(allDimName.substr(6))).getUTCFullYear();
					}
				}
			}
		} else {
			for (var j = 0; j < dimension.length; j++) {
				dimId = dimension[j].dimensionId;
				var dimName = tuple[dimId];
				if (dimId == 'Time') {
					if (allDimName.toUpperCase().indexOf('Date'.toUpperCase()) != -1) {
						dimName =  new Date(parseInt(dimName.substr(6))).getUTCFullYear();
					}
				}
				if (!allDimName) {
					allDimName += dimName;
					continue;
				}
				allDimName += " - " + dimName;
			}
		}
		return allDimName;
	};
	function getAllSeriesNames(data, stubDimension) {
		var seriesNames = [];
		for (i = 0; i < data.length; i++) {
			var tuple = data[i];
			if (tuple.Value == null) continue;
			var currentName = getDimName(tuple, stubDimension, false);
			if (-1 == $.inArray(currentName, seriesNames)) {
				seriesNames.push(currentName);
			}
		}
		return seriesNames;
	};
	var seriesNames = getAllSeriesNames(data, stubDim);
	for (j = 0; j < seriesNames.length; j++) {
		seriesData[j] = {};
		seriesData[j].seriesId = seriesNames[j]; //this remains unchanged unlike names
		seriesData[j].name = seriesNames[j];
		seriesData[j].data = [];
		for (i = 0; i < data.length; i++) {
			var tuple = data[i];
			if (tuple.Value == null) continue;
			var currentName = getDimName(tuple, stubDim, false);
			if (currentName == seriesData[j].name) {
				var xTick = getDimName(tuple, headerDim, isDateTimeXaxis);
				seriesData[j].data.push([xTick, tuple.Value]);
				seriesData[j].unit = tuple.Unit;
				seriesData[j].scale = tuple.Scale;
				seriesData[j].frequency = tuple.Frequency;
			}
		}
	}
	return seriesData;
};

apps.forecastTrackingTool.prototype.setLoadingState = function (container) {

		var div = $('<div class="loading"><img src="img/loading.gif"/></div>');

		var initialPosition = $(container).css("position");
		if (initialPosition == "static") {
			$(container).css("position", "relative");
		}
		$(div).appendTo($(container));

		var img = div.find("img");
		img.css("position", "relative").css("top", ($(container).height() - img.height()) / 2);

		div.fadeIn(1000);
};	

apps.forecastTrackingTool.prototype.removeLoadingState= function (container) {
		$(container).find('div.loading').remove();
};

apps.forecastTrackingTool.prototype.getUrlVar = function (name) {
	var vars = [], hash;
	var url = window.location.href;
	if (window.location.hash.length > 0)
		url = window.location.href.split('#')[0];

	var hashes = url.slice(window.location.href.indexOf('?') + 1).split('&');
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	};
	
	return vars[name];
};

var filter = '';
apps.forecastTrackingTool.prototype.bindEvents = function () {	
	
	var app = this;
	
	$('div#ftt-index h3 span').click(function () {

		$('div#ftt-index h3 span').removeClass('selected');
		$(this).toggleClass('selected');

		app.loadGroupOfSeven(app.getConstant($(this).text()));
	});	
	
	$('input#selection-filter').on('keyup', function () {
		var val = $(this).val().toLowerCase();
		if (filter != val) {
			filter = val;
			$('div#countries').find('div').each(function () {
				if ((filter == '') || $(this).find('a').text().toLowerCase().indexOf(filter) != -1)
					$(this).show();
				else
					$(this).hide();
			});
		}
	});
	
	$('input#explore-filter').on('keyup', function () {
		var val = $(this).val().toLowerCase();
		if (filter != val) {
			filter = val;
			$('div#countries').find('div.country').each(function () {
				var id = $(this).attr('id');
				if ((filter == '') || $(this).text().toLowerCase().indexOf(filter) != -1)
					$('div[id="' + $(this).attr('id') + '"]').show();
				else
					$('div[id="' + $(this).attr('id') + '"]').hide();
			});
		};
	});	

	$('div#tabs ul li').live('click', function () {
		if (!$(this).hasClass('active')) {
			$(this).closest("ul").find('li').removeClass('active');
			$(this).addClass('active');

			$('div.tab-content').addClass('hidden');
			switch ($(this).text()) {
				case 'List':
					$('div#filter').show();
					$('div#list').removeClass('hidden');
					break;
				case 'Table':					
					// Show table container
					$('div#filter').hide();
					$('div#table').removeClass('hidden');

					// IF the first time, load table
					if ($('div#ftt-explore div#table table').find('tr').length == 1)
						app.table();
					break;
				case 'Map':
					// Show maps container
					$('div#filter').hide();
					$('div#map').removeClass('hidden');

					// IF the first time, load map
					if ($('div#map').find('svg').length == 0) {

						var measure = app.getMeasureAbsoluteErrorForOneYear();
						app.map(measure.value);

						$('div#map div#map-header span').click(function () {

							$('div#map div#map-header span').removeClass('selected');
							$(this).toggleClass('selected');

							measure = app.getMeasureAbsoluteErrorForOneYear();
							if ($(this).text() == '2 years')
								measure = app.getMeasureAbsoluteErrorForTwoYears();

							app.map(measure.value);
						});
					}
					break;
				default:
					break;
			};
		};
		return false;
	});
		
	$(document).ready(function () {		
	}).mousemove(function (e) {
		$('div#tooltip').css({ left: e.clientX + 15, top: e.clientY + 15 });
	});
};