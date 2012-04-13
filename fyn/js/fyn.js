'use strict'
var apps = apps || {};

apps.findYourNumber = function () {

 	this.start = 1960;
 	this.end = 2010;

 	this.country = null;
 	this.indicator = null;
 	this.time = null;
 	this.unit = null;
 	this.dataset = 'WBWDIGDF2012Mar';
 	this.dimension = 'Series'; 	
 	this.meta = null;
	this.indicators = null;
	
	$.get('/js/meta.json?version=1.0', $.proxy(function(result){
		this.meta = result;
	}, this));
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

	$(container).getRequest('/api/1.0/meta/dataset/' + this.dataset + '/dimension/Country', $.proxy(function (result) {

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

apps.findYourNumber.prototype.getIndicators = function () {

	var container = $('div#list-indicator');
	utils.setLoadingState(container);

	var ul = $(utils.buildHTML('ul', { 'id': 'indicators' })).appendTo(container);
	$(container).getRequest('/api/1.0/meta/dataset/' + this.dataset + '/dimension/' + this.dimension, $.proxy(function (result) {		
		
		this.indicators = result.items;		
		var topic = { "id" : -1};
		
		$.each(this.meta.indicators, $.proxy(function (index, item) {
			
			var indicator = this.getIndicator(item.name)
			if (indicator != null){
			
				if (topic.id != item.topic){
					topic = this.getTopic(item.topic);
					$(utils.buildHTML('li', { 'class': 'capital'}))
						.appendTo(ul)
							.append(topic.name);
				};
				
				$(utils.buildHTML('li',
					{
						'id': indicator.key,
						'unit': this.getUnits(item.name)					
					})).appendTo(ul)
							.append(item.name)
								.click($.proxy(function (item) {
									this.selectionChanged(item.target);
								}, this));
			};

		}, this));
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


apps.findYourNumber.prototype.getIndicator = function (query) {

	var result = null;
	$.each(this.indicators, function (index, item) {
		if (item.name == query)
			result = item;
	});

	return result;
};

apps.findYourNumber.prototype.getTopic = function (id) {
	
	var result = null;
	$.each(this.meta.topics, function (index, item) {
		if (id == item.id)		
			result = item;		
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

apps.findYourNumber.prototype.displayDimensionFields = function (indicator) {
	
	$('div#visualization').html('');	
	var container = $(utils.buildHTML('div', {'class':'fields'})).appendTo($('div#visualization'));
	
	for (var prop in indicator.fields){
		if (prop == 'long definition'){
			var field = $(utils.buildHTML('div', {'class':'field'})).appendTo(container);
			$(utils.buildHTML('span', "Definition:", {'class': 'property'})).appendTo(field);
			$(utils.buildHTML('span', indicator.fields[prop])).appendTo(field);
		}
		else if (prop == 'source'){
			var field = $(utils.buildHTML('div', {'class':'field'})).appendTo(container);
			$(utils.buildHTML('span', "Source:", {'class': 'property'})).appendTo(field);
			$(utils.buildHTML('span', indicator.fields[prop])).appendTo(field);
		}
	};
};

apps.findYourNumber.prototype.visualize = function (type) {
	
	var container = $('div#visualization');	
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
			this.displayDimensionFields(this.getIndicator($(item).text()));
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

