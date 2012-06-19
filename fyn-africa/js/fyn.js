'use strict'
Knoema.Helpers.ready(function () {
	var app = new apps.findYourNumber();
});

var apps = apps || {};
apps.findYourNumber = function () {

	Knoema.Helpers.clientId = 'fsSa7bQ=';
	
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
	
	$.getJSON('js/meta.json?version=1.1', $.proxy(function(result){
		this.meta = result;
		this.load();
	}, this));
 };


apps.findYourNumber.prototype.load = function(){
	this.getCountries();
	this.getIndicators();
	this.getTime();
	this.bindEvents();
};

apps.findYourNumber.prototype.getCountries = function () {

	var container = $('div#list-country');
	this.setLoadingState(container);

	Knoema.Helpers.get('/api/1.0/meta/dataset/' + this.dataset + '/dimension/Country', $.proxy(function (result) {

		var countries = [];
		$.each(result.items, function () {
			countries.push(this.name);
		});

		if (countries.length > 0) {

			countries.sort();
			var ul = $(Knoema.Helpers.buildHTML('ul', { 'id': 'countries' })).appendTo(container);

			var capital = '';
			$.each(countries, $.proxy(function (index, item) {

				var addCountry = true;
				if (this.meta.countries.length > 0)
					if ($.inArray(item, this.meta.countries) == -1)
						addCountry = false;
				
				if (addCountry){
					if (item.substring(0, 1) != capital) {
						capital = item.substring(0, 1);
						$(Knoema.Helpers.buildHTML('li', { 'class': 'capital' }))
							.appendTo(ul)
								.append(capital);
					};

					$(Knoema.Helpers.buildHTML('li', { 'id': this.getKey(result, item) }))
						.appendTo(ul)
							.append(item);
				};
			}, this));

			$('ul#countries li').click($.proxy(function (item) {
				this.selectionChanged(item.target);
			}, this));
		};

		this.removeLoadingState(container);

	}, this));
};

apps.findYourNumber.prototype.getIndicators = function () {

	var container = $('div#list-indicator');
	this.setLoadingState(container);

	var ul = $(Knoema.Helpers.buildHTML('ul', { 'id': 'indicators' })).appendTo(container);
	Knoema.Helpers.get('/api/1.0/meta/dataset/' + this.dataset + '/dimension/' + this.dimension, $.proxy(function (result) {		
		
		this.indicators = result.items;		
		var topic = { "id" : -1};
		
		$.each(this.meta.indicators, $.proxy(function (index, item) {
			
			var indicator = this.getIndicator(item.name)
			if (indicator != null){
			
				if (topic.id != item.topic){
					topic = this.getTopic(item.topic);
					$(Knoema.Helpers.buildHTML('li', { 'class': 'capital'}))
						.appendTo(ul)
							.append(topic.name);
				};
				
				$(Knoema.Helpers.buildHTML('li',
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
		this.removeLoadingState(container);
	}, this));
};

apps.findYourNumber.prototype.getTime = function () {

	var container = $('div#list-time');
	var ul = $(Knoema.Helpers.buildHTML('ul', { 'id': 'time' })).appendTo(container);
	for (var i = this.end; i > this.start; i--) {
		$(Knoema.Helpers.buildHTML('li', { 'id': i }))
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
		this.setLoadingState(container);

		Knoema.Helpers.post(dataDescriptor, $.proxy(function (pivotResponse) {

			$(container).html('');
			$(container).removeClass();

			if (pivotResponse.data.length > 0) {
								
				$(container).addClass('number');

				// Round number and devide into digits
				var number = Knoema.Helpers.roundToNDecimalPlaces(pivotResponse.data[0].Value, 2);
				$(container).append(number.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 '))

				// Append to container
				$(Knoema.Helpers.buildHTML('div', { 'class': 'unit' }))
					.appendTo(container)
						.text(this.unit);		
			
			}
			else {

				// Show no result message
				$(Knoema.Helpers.buildHTML('div', { 'class': 'no-number' }))
				.appendTo(container)
					.html('Your current selection does not contain any data');
			};

			this.removeLoadingState(container);

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
	var container = $(Knoema.Helpers.buildHTML('div', {'class':'fields'})).appendTo($('div#visualization'));
	
	for (var prop in indicator.fields){
		if (prop == 'long definition'){
			var field = $(Knoema.Helpers.buildHTML('div', {'class':'field'})).appendTo(container);
			$(Knoema.Helpers.buildHTML('span', "Definition:", {'class': 'property'})).appendTo(field);
			$(Knoema.Helpers.buildHTML('span', indicator.fields[prop])).appendTo(field);
		}
		else if (prop == 'source'){
			var field = $(Knoema.Helpers.buildHTML('div', {'class':'field'})).appendTo(container);
			$(Knoema.Helpers.buildHTML('span', "Source:", {'class': 'property'})).appendTo(field);
			$(Knoema.Helpers.buildHTML('span', indicator.fields[prop])).appendTo(field);
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

	$(container).gadget(data);
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

	$(container).gadget(data);
};

apps.findYourNumber.prototype.map = function (container) {
	
	this.setLoadingState(container);
	Knoema.Helpers.get('/api/1.0/meta/dataset/' + this.dataset + '/dimension/Country', $.proxy(function (result) {

		var countries = [];
		$.each(result.items, function () {
			countries.push(this.key.toString());
		});

		var data =
		{
			gadget: {
				dataDescriptor: this.getDataDescriptor(countries, [this.indicator], this.time),
				gadgetClass: "Knoema.Map",
				viewState: {
					"visibleRegion":"africa",
					"colorSelection":{
						"startColor":"c3d69b",
						"endColor":"ff0000",
						"intervalCount":3
					}
				},
				naked: true
			},
			size: {
				width: 245,
				height: 160
			}
		};

		$(container).gadget(data);
		this.removeLoadingState(container);

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

apps.findYourNumber.prototype.bindEvents = function(){

	$('div.step-container ul li').click($.proxy(function (item) {
		this.selectionChanged(item.target);
	}, this));

	$('div#options div').click($.proxy(function (item) {
		this.visualizationChanged(item.target);
	}, this));
	
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

apps.findYourNumber.prototype.setLoadingState = function (container) {

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

apps.findYourNumber.prototype.removeLoadingState= function (container) {
		$(container).find('div.loading').remove();
};
