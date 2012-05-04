Knoema.Helpers.ready(function(){
	new sampleApp();
});

var sampleApp = function () {
		
	/* Authentication via access token 	
	var params = Knoema.Helpers.parseHashParams();
	if (params == null)
		Knoema.Helpers.getAccessToken('VWYp7V1QmWqSCA', window.location, true, 'read_resources');		
	else{
		if (params["access_token"] != undefined)
			Knoema.Helpers.accessToken = params["access_token"];
	}
	*/	
	
	/* Authentication via client id	
	Knoema.Helpers.clientId = 'VWYp7V1QmWqSCA';
	*/
	
	this.getCountries();
	this.getProducts();
	this.bindEvents();
};

sampleApp.prototype.bindEvents = function () {	
	var app = this;	
	$('#country').change(function(){
		app.getChart();
	});	
	$('#product').change(function(){
		app.getChart();
	});
};

sampleApp.prototype.getCountries = function () {
	var container = $('#country');
	Knoema.Helpers.get('/api/1.0/meta/dataset/UNFAOPS2011Aug/dimension/Country', function (result) {
		$.each(result.items, function () {
			$(Knoema.Helpers.buildHTML('option', this.name, { 'value': this.key })).appendTo(container);
		});
	});
};

sampleApp.prototype.getProducts = function () {
	var container = $('#product');
	Knoema.Helpers.get('/api/1.0/meta/dataset/UNFAOPS2011Aug/dimension/Item', function (result) {
		$.each(result.items, function () {
			$(Knoema.Helpers.buildHTML('option', this.name, { 'value': this.key })).appendTo(container);
		});
	});
};

sampleApp.prototype.getChart = function () {	
	
	var data =
	{
		gadget: {
			dataDescriptor: this.getDataDescriptor($('#country').val(), $('#product').val()),
			gadgetClass: "Knoema.Chart",
			viewState: { ignoreUnit: "checked" },
			naked: true
		},
		size: {
			width: 400,
			height: 250
		}
	};
	$('#chart').gadget(data);
};

sampleApp.prototype.getDataDescriptor = function (country, product) {		
	return {
		'Header': [
			{
				'DimensionId': 'Time',
				'Members': ['1999-2009'], 
				'UiMode':'range'
			}],
		'Stub': [
			{
				'DimensionId': "Country",
				'Members': [country]
			},
			{
				'DimensionId': 'Item',
				'Members': [product]
			},
			{
				'DimensionId': 'Element',
				'Members': [1000020]
			}],
		'Filter': [],
		'Frequencies':['A'],
		'Dataset': 'UNFAOPS2011Aug'
	};
};

