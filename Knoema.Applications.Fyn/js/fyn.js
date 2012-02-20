'use strict'
var apps = apps || {};

apps.findYourNumber = function () {

 	this.start = 1960;
 	this.end = 2010;

 	this.country = null;
 	this.indicator = null;
 	this.time = null;
 	this.unit = null;
 	this.dataset = null;
 	this.dimension = null;

 	this.datasets =
		[
			{
				name: 'WBWDIGDF2011Apr',
				dimension: 'Series'
			},
			{
				name: 'IMFWEO2011Sep',
				dimension: 'Subject'
			}
		];

 	this.indicators = [
		'Population density (people per sq. km of land area)',
		'Rural population (% of total population)',
		'Population, total',
		'Population, female (% of total)',
		'Birth rate, crude (per 1,000 people)',
		'Death rate, crude (per 1,000 people)',
		'Fertility rate, total (births per woman)',
		'Life expectancy at birth, total (years)',
		'CO2 emissions (kt)',
		'CO2 emissions (metric tons per capita)',
		'CO2 emissions (kg per 2005 PPP $ of GDP)',
		'Energy production (kt of oil equivalent)',
		'Electricity production (kWh)',
		'Energy use (kg of oil equivalent per capita)',
		'Water productivity, total (constant 2000 US$ GDP per cubic meter of total freshwater withdrawal)',
		'Annual freshwater withdrawals, total (billion cubic meters)',
		'Agricultural land (sq. km)',
		'Forest area (sq. km)',
		'Land area (sq. km)',
		'Organic water pollutant (BOD) emissions (kg per day)',
		'Organic water pollutant (BOD) emissions (kg per day per worker)',
		'Foreign direct investment, net inflows (BoP, current US$)',
		'Foreign direct investment, net inflows (% of GDP)',
		'Current account balance (BoP, current US$)',
		'Current account balance (% of GDP)',
		'Goods exports (BoP, current US$)',
		'Service exports (BoP, current US$)',
		'Goods imports (BoP, current US$)',
		'Service imports (BoP, current US$)',
		'Total reserves (includes gold, current US$)',
		'Official exchange rate (LCU per US$, period average)',
		'Improved water source (% of population with access)',
		'Hospital beds (per 1,000 people)',
		'Community health workers (per 1,000 people)',
		'Nurses and midwives (per 1,000 people)',
		'Physicians (per 1,000 people)',
		'Health expenditure per capita (current US$)',
		'Health expenditure, total (% of GDP)',
		'Mortality rate, under-5 (per 1,000)',
		'Mortality rate, neonatal (per 1,000 live births)',
		'Mobile cellular subscriptions (per 100 people)',
		'Internet users (per 100 people)',
		'Roads, total network (km)',
		'Rail lines (total route-km)',
		'Passenger cars (per 1,000 people)',
		'Vehicles (per km of road)',
		'International migrant stock, total',
		'International migrant stock (% of population)',
		'Battle-related deaths (number of people)',
		'Income share held by highest 10%',
		'Income share held by lowest 10%',
		'GINI index',
		'Poverty headcount ratio at $2 a day (PPP) (% of population)',
		'Poverty headcount ratio at $1.25 a day (PPP) (% of population)',
		'Ease of doing business index (1=most business-friendly regulations)',
		'Armed forces personnel, total',
		'Armed forces personnel (% of total labor force)',
		'Military expenditure (% of GDP)',
		'Military expenditure (% of central government expenditure)',
		'Gross domestic product, constant prices (Percent change)',
		'Gross domestic product based on purchasing-power-parity (PPP) valuation of country GDP (Current international dollar)',
		'Gross domestic product based on purchasing-power-parity (PPP) per capita GDP (Current international dollar)',
		'Gross domestic product based on purchasing-power-parity (PPP) share of world total (Percent)',
		'Inflation, average consumer prices (Percent change)',
		'Employment (Persons)',
		'Unemployment rate (Percent of total labor force)',
		'General government revenue (Percent of GDP)',
		'General government total expenditure (Percent of GDP)',
		'General government gross debt (Percent of GDP)',
		'External debt, total (U.S. dollars)',
		'External debt, total (Percent of GDP)',
		'Crude Oil (petroleum), Simple average of three spot prices (APSP); Dated Brent, West Texas Intermediate, and the Dubai Fateh (Dollars per barrel)'
	];
	
 };

apps.findYourNumber.prototype.init = function () {

	utils.clientId = 'fsSa7bQ=';
	this.appStart();
};

apps.findYourNumber.prototype.appStart = function(){
	this.getCountries();
	this.getIndicators();
	this.getTime();

	$('div.step-container ul li').click($.proxy(function (item) {
		this.selectionChanged(item.target);
	}, this));

	$('div#options div').click($.proxy(function (item) {
		this.visualizationChanged(item.target);
	}, this));
};

apps.findYourNumber.prototype.getCountries = function () {

	var container = $('div#list-country');
	utils.setLoadingState(container);

	$(container).getRequest('/api/1.0/meta/dataset/' + this.datasets[0].name + '/dimension/Country', $.proxy(function (result) {

		var countries = [];
		$.each(result.items, function () {
			countries.push(this.name);
		});

		if (countries.length > 0) {

			countries.sort();
			var ul = $(utils.buildHTML('ul', { 'id': 'countries' })).appendTo(container);

			var capital = '';
			$.each(countries, $.proxy(function (index, item) {

				if (item.substring(0, 1) != capital) {
					capital = item.substring(0, 1);
					$(utils.buildHTML('li', { 'class': 'capital' }))
						.appendTo(ul)
							.append(capital);
				};

				$(utils.buildHTML('li', { 'id': this.getKey(result, item) }))
					.appendTo(ul)
						.append(item);
			}, this));

			$('ul#countries li').click($.proxy(function (item) {
				this.selectionChanged(item.target);
			}, this));
		};

		utils.removeLoadingState(container);

	}, this));
};

apps.findYourNumber.prototype.getIndicators = function (i) {

	if (i == undefined)
		i = 0;

	var container = $('div#list-indicator');
	utils.setLoadingState(container);

	var ul = $(utils.buildHTML('ul', { 'id': 'indicators' })).appendTo(container);

	var dataset = this.datasets[i].name;
	var dimension = this.datasets[i].dimension;

	$(container).getRequest('/api/1.0/meta/dataset/' + dataset + '/dimension/' + dimension, $.proxy(function (result) {
		$.each(result.items, $.proxy(function (index, item) {

			if (this.inIndicators(item.name))
				$(utils.buildHTML('li',
					{
						'id': item.key,
						'unit': this.getUnits(item.name),
						'dataset': dataset,
						'dimension': dimension
					})).appendTo(ul)
							.append(item.name)
								.click($.proxy(function (item) {
									this.selectionChanged(item.target);
								}, this));

		}, this));

		if (i < this.datasets.length - 1) {
			i++;
			this.getIndicators(i);
		};

		utils.removeLoadingState(container);

	}, this));
};

apps.findYourNumber.prototype.getTime = function () {

	var container = $('div#list-time');
	var ul = $(utils.buildHTML('ul', { 'id': 'time' })).appendTo(container);
	for (var i = this.end; i > this.start; i--) {
		$(utils.buildHTML('li', { 'id': i }))
			.appendTo(ul)
				.append(i);
	};
};

apps.findYourNumber.prototype.getNumber = function () {

	if (this.isValidParameters()) {

		// Get data descriptor 
		var dataDescriptor = this.getDataDescriptor([this.country], [this.indicator], [this.time]);

		// Get number
		var container = $('div#result');
		utils.setLoadingState(container);

		$(container).postRequest(dataDescriptor, $.proxy(function (pivotResponse) {

			$(container).html('');
			$(container).removeClass();

			if (pivotResponse.data.length > 0) {

				$(container).addClass('number');

				// Round number and devide into digits
				var number = utils.roundToNDecimalPlaces(pivotResponse.data[0].Value, 2);
				$(container).append(number.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 '))

				// Append to container
				$(utils.buildHTML('div', { 'class': 'unit' }))
					.appendTo(container)
						.text(this.unit);

			}
			else {

				// Show no result message
				$(utils.buildHTML('div', { 'class': 'no-number' }))
				.appendTo(container)
					.html('Your current selection does not contain any data');
			};

			utils.removeLoadingState(container);

		}, this));
	};
};

apps.findYourNumber.prototype.inIndicators = function (indicator) {

	var result = false;
	$.each(this.indicators, function (index, item) {
		if (indicator.toLowerCase().indexOf(item.toLowerCase()) != -1)
			result = true;
	});

	return result;
};

apps.findYourNumber.prototype.getUnits = function (indicator) {

	var result = '';
	var start = indicator.lastIndexOf('(');
	var end = indicator.lastIndexOf(')');

	if (start != -1 && end != -1) 		
		result = indicator.substring(start + 1, end);
	
	return result;
};

apps.findYourNumber.prototype.visualizationChanged = function (item) {

	if (this.isValidParameters())
		this.visualize($(item).text().toLowerCase());
};

apps.findYourNumber.prototype.visualize = function (type) {
	
	var container = $('div#visualization');
	$(container).removeClass();
	$(container).html('');

	switch (type) {
		case 'chart':			
			this.chart(container);
			break;
		case 'table':
			this.table(container)
			break;
		case 'map':
			this.map(container);
			break;
		default:
			break;
	};
};

apps.findYourNumber.prototype.chart = function (container) {

	var time = [];
	for (var i = this.start; i < this.end; i++)
		time.push(i.toString());

	var data =
	{
		gadget: {
			dataDescriptor: this.getDataDescriptor([this.country], [this.indicator], time),
			gadgetClass: "Knoema.Chart",
			viewState: { ignoreUnit: "checked" },
			naked: true
		},
		size: {
			width: 245,
			height: 150
		}
	};

	$(container).gadgetRequest(data);
};

apps.findYourNumber.prototype.table = function (container) {

	var time = [];
	for (var i = this.end; i > this.start; i--) 
		time.push(i.toString());

	var dataDescriptor =
	{
		"Header": [
			{
				"DimensionId": "Country",
				"Members": [this.country]

			}],
		"Stub": [
			{
				"DimensionId": "Time",
				"Members": time,
				"UiMode": "range"
			}],
		"Filter": [
			{
				"DimensionId": this.dimension,
				"Members": [this.indicator]
			}],
		"Frequencies": ["A"],
		"Dataset": this.dataset
	};

	var data =
	{
		gadget: {
			dataDescriptor: dataDescriptor,
			gadgetClass: "Knoema.HtmlTable",
			viewState: {},
			naked: true
		},
		size: {
			width: 245,
			height: 330
		}
	};

	$(container).gadgetRequest(data);
};

apps.findYourNumber.prototype.map = function (container) {
	
	utils.setLoadingState(container);
	$(container).getRequest('/api/1.0/meta/dataset/' + this.dataset + '/dimension/Country', $.proxy(function (result) {

		var countries = [];
		$.each(result.items, function () {
			countries.push(this.key.toString());
		});

		var data =
		{
			gadget: {
				dataDescriptor: this.getDataDescriptor(countries, [this.indicator], this.time),
				gadgetClass: "Knoema.Map",
				viewState: {},
				naked: true
			},
			size: {
				width: 245,
				height: 160
			}
		};

		$(container).gadgetRequest(data);
		utils.removeLoadingState(container);

	}, this));
};

apps.findYourNumber.prototype.getDataDescriptor = function (countries, indicators, time) {
	var dataDescriptor =
	{
		"Header": [
			{
				"DimensionId": "Time",
				"Members": time,
				"UiMode": "range"
			}],
		"Stub": [
			{
				"DimensionId": "Country",
				"Members": countries
			},
			{
				"DimensionId": this.dimension,
				"Members": indicators
			}],
		"Filter": [],
		"Frequencies": ["A"],
		"Dataset": this.dataset
		};
	return dataDescriptor;
};

apps.findYourNumber.prototype.getKey = function (array, name) {

	var result = null;
	$.each(array.items, function () {
		if (this.name == name) {
			result = this.key;
		};
	});

	return result;
};

apps.findYourNumber.prototype.selectionChanged = function (item) {

	$('div#visualization').html('');
	
	$(item).parent().find('li').each(function (index, item) {
		$(item).removeClass('selected');
	});
	$(item).addClass('selected');

	// Define country, indicator or time 
	var id = $(item).parent().attr('id')
	var value = $(item).attr('id');

	switch (id) {
		case 'countries':
			this.country = value;
			break;
		case 'indicators':
			this.indicator = value;
			this.unit = $(item).attr('unit');
			this.dimension = $(item).attr('dimension');
			this.dataset = $(item).attr('dataset');
			break;
		case 'time':
			this.time = value;
			break;
		default:
			break;
	};

	this.getNumber();
};

var filter = '';	
apps.findYourNumber.prototype.isValidParameters = function () {

	if (this.country != null && this.indicator != null && this.time != null)
		return true;
	else return false;
};

apps.findYourNumber.prototype.applyFilters = function(){
	$('input#filter-country, input#filter-indicator, input#filter-time').mousedown(function () {
		$(this).css('color', '#222');
		if ($(this).val() == 'Just type...')
			$(this).val('');
	});

	$('input#filter-country, input#filter-indicator, input#filter-time').live('keyup', function () {
		var val = $(this).val().toLowerCase();
		if (filter != val) {
			filter = val;
			$(this).parent().find('ul li').each(function () {
				if ((filter == '') || $(this).text().toLowerCase().indexOf(filter) != -1)
					$(this).show();
				else
					$(this).hide();
			});
		};
	});
};

