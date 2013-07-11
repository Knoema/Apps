'use strict'
Knoema.Helpers.ready(function () {
	var app = new apps.findYourNumber();
});

var apps = apps || {};
apps.findYourNumber = function () {

	Knoema.Helpers.clientId = 'fsSa7bQ=';
	
 	this.start = 2001;
 	this.end = 2012;

 	this.company = null;
 	this.indicator = null;
 	this.time = null;
 	this.unit = null;
 	this.dataset = 'US500COMPFINST2012R';
 	this.dimension = 'indicator'; 	
 	this.meta = null;
	this.indicators = null;
	this.visualization = 'chart';
	
	$.get('/js/meta.json?version=1.0', $.proxy(function(result){
		this.meta = result;
		this.load();
	}, this));
 };


apps.findYourNumber.prototype.load = function(){
	this.getCompanies();
	this.getIndicators();
	this.getTime();
	this.bindEvents();
};

apps.findYourNumber.prototype.getCompanies = function () {

	var container = $('div#list-company');
	this.setLoadingState(container);

	Knoema.Helpers.get('/api/1.0/meta/dataset/US500COMPFINST2012R/dimension/company', $.proxy(function (result) {

		var companies = [];
		$.each(result.items, function () {
			companies.push(this);
		});

		if (companies.length > 0) {

			//companies.sort();
			var ul = $(Knoema.Helpers.buildHTML('ul', { 'id': 'companies' })).appendTo(container);

			var capital = '';
			$.each(companies, $.proxy(function (index, item) {

				var addCompany = true;
				if(item.level==0)
				{
					$(Knoema.Helpers.buildHTML('li', { 'class': 'capital' }))
						.appendTo(ul)
							.append(item.name);
				}
				else
				{
					$(Knoema.Helpers.buildHTML('li', { 'id': this.getKey(result, item.name) }))
						.appendTo(ul)
							.append(item.name).click($.proxy(function (item) {
						this.selectionChanged(item.target);
						this.visualize(this.visualization);
					}, this));
					
				}
			}, this));
			
		};

		this.removeLoadingState(container);

	}, this));
};

apps.findYourNumber.prototype.getIndicators = function () {

	var container = $('div#list-indicator');
	this.setLoadingState(container);

	var ul = $(Knoema.Helpers.buildHTML('ul', { 'id': 'indicators' })).appendTo(container);
	Knoema.Helpers.get('/api/1.0/meta/dataset/US500COMPFINST2012R/dimension/indicator', $.proxy(function (result) {		
		
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
						'unit': indicator.fields.unit					
					})).appendTo(ul)
							.append(item.name)
								.click($.proxy(function (item) {
									this.selectionChanged(item.target);
									this.visualize(this.visualization);
								}, this));
			};

		}, this));
		this.removeLoadingState(container);
	}, this));
};

apps.findYourNumber.prototype.getTime = function () {

	var container = $('div#list-time');
	var ul = $(Knoema.Helpers.buildHTML('ul', { 'id': 'time' })).appendTo(container);
	var quater='';
	var first=true;
	for (var i = this.end; i > this.start; i--) {
		$(Knoema.Helpers.buildHTML('li', { 'id': i,'style':'display:list-item; font-size: 26px'}))
				.appendTo(ul)
					.append(i);
		if(i>2006)
		{
			for(var j=1;j<5;j++)
			{
				if(j==4)
				{
					quater=i+'Q'+j;
					$(Knoema.Helpers.buildHTML('li', { 'id': i+'Q'+j }))
						.appendTo(ul)
							.append('Q'+j);								
				}
				else
				{
					quater=i+'Q'+j;
					$(Knoema.Helpers.buildHTML('li', { 'id': i+'Q'+j }))
							.appendTo(ul)
								.append('Q'+j);	
				}
			}		
		}
		
	};
};

apps.findYourNumber.prototype.getNumber = function () {

	if (this.isValidParameters()) {

		// Get data descriptor 
		var dataDescriptor = this.getDataDescriptor([this.company], [this.indicator], [this.time]);

		// Get number
		var container = $('div#result');
		this.setLoadingState(container);

		Knoema.Helpers.post('/api/1.0/data/pivot', dataDescriptor, $.proxy(function (pivotResponse) {

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
}

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
	{
		this.visualization=$(item).text().toLowerCase();
		this.visualize($(item).text().toLowerCase());
	}
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
			dataDescriptor: this.getDataDescriptor([this.company], [this.indicator], time),
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
				"DimensionId": "Company",
				"Members": [this.company]

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
		"Frequencies": ["A","Q"],
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
/*
apps.findYourNumber.prototype.map = function (container) {
	
	this.setLoadingState(container);
	Knoema.Helpers.get('/api/1.0/meta/dataset/US500COMPFINST2012R/dimension/company', $.proxy(function (result) {

		var companies = [];
		$.each(result.items, function () {
			companies.push(this.key.toString());
		});

		var data =
		{
			gadget: {
				dataDescriptor: this.getDataDescriptor(companies, [this.indicator], this.time),
				gadgetClass: "Knoema.Map",
				viewState: {},
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
*/
apps.findYourNumber.prototype.getDataDescriptor = function (companies, indicators, time) {
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
				"DimensionId": "Company",
				"Members": companies
			},
			{
				"DimensionId": this.dimension,
				"Members": indicators
			}],
		"Filter": [],
		"Frequencies": ["A","Q"],
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

	// Define company, indicator or time 
	var id = $(item).parent().attr('id')
	var value = $(item).attr('id');

	switch (id) {
		case 'companies':
			this.company = value;
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

	if (this.company != null && this.indicator != null && this.time != null)
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
	
	$('input#filter-company, input#filter-indicator, input#filter-time').mousedown(function () {
		$(this).css('color', '#222');
		if ($(this).val() == 'Just type...')
			$(this).val('');
	});

	$('input#filter-company, input#filter-indicator, input#filter-time').live('keyup', function () {
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
