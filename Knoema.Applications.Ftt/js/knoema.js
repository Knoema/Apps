'use strict'
$(document).ready(function () {

	var iframe = '<iframe  style="display:none" src="' + utils.knoemaUrl + '/apps/ftt/proxy" id="iframe" onload="InitApplication();"></iframe>';
	$(iframe).appendTo('body');

	if (window.addEventListener) {
		window.addEventListener("message", utils.recieveMessage, false);
	} else {
		window.attachEvent("onmessage", utils.recieveMessage);
	}	
});

$(window).load(function () {

	var interval = setInterval(function () {
		utils.sendMessage('resize_' + $('body').height(), document.getElementById("iframe"));
	}, 1000);

	setTimeout(function () {
	}, 120000);
});

var utils = {

	buildHTML: function (tag, html, attrs) {
		if (typeof (html) != 'string') {
			attrs = html;
			html = null;
		}
		var h = '<' + tag;
		for (var attr in attrs) {
			if (attrs[attr] === false) continue;
			h += ' ' + attr + '="' + attrs[attr] + '"';
		}
		return h += html ? ">" + html + "</" + tag + ">" : "/>";
	},

	isInt: function (object) {
		return !!(typeof (object) == 'number');
	},

	isDate: function (object) {
		if (isNaN && isNaN(object)) return false;
		return !!(object && object.setUTCMilliseconds && object.setUTCFullYear);
	},

	roundToNDecimalPlaces: function (number, N) {
		if (!isFinite(number))
			throw new ReferenceError('Invalid Number');
		else if (!utils.isInt(N))
			throw new ReferenceError('Specify an Integer for decimal place');
		else {
			var factor = Math.pow(10, N);
			if (factor) {
				return (Math.round(number * factor) / factor).toFixed(N);
			}
		}
	},

	getUrlVars: function () {
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for (var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	},

	getUrlVar: function (name) {
		return utils.getUrlVars()[name];
	},	

	sendMessage: function (message, frame){
		
		var win = frame.contentWindow;
		win.postMessage(message, utils.knoemaUrl);
	},

	sendRequest: function (data, prefix, container, callback) {

		var message =  prefix + '_';

		if (container != undefined) {

			if (callback != null) {
				var guid = utils.getGuid();
				utils.callbacks.push({ guid: guid, callback: callback, container: container });
			}

			message += guid + '_' + data;

			// Show loading image
			utils.setLoadingState(container);
		}

		utils.sendMessage(message, document.getElementById("iframe"));
	},

	recieveMessage: function (event) {

		if (event.origin == utils.knoemaUrl) {

			var entry = '_post_';
			if (event.data.indexOf(entry) == -1)
				entry = '_get_';

			if (event.data.indexOf(entry) != -1) {

				var result = event.data.split(entry)[1];
				var guid = event.data.split(entry)[0]

				utils.getCallBack(guid)($.parseJSON(result));
				utils.getContainer(guid).find('div.loading').remove();

			};
		}
	},

	gadgetLoaded: function () {
		utils.sendMessage(JSON.stringify(utils.data), document.getElementById("gadget"));
	},

	getCallBack: function (guid) {

		var result = null;
		$.each(utils.callbacks, function (index, item) {
			if (item.guid == guid)
				result = item.callback;
		});

		return result;
	},

	getContainer: function (guid) {

		var result = null;

		$.each(utils.callbacks, function () {
			if (this.guid == guid)
				result = this.container;
		});

		return result;
	},

	getGuid: function () {
		function S4() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		}
		return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
	},

	setLoadingState: function (container) {

		var div = $('<div class="loading"><img src="img/loading.gif"/></div>');

		var initialPosition = $(container).css("position");
		if (initialPosition == "static") {
			$(container).css("position", "relative");
		}
		$(div).appendTo($(container));

		var img = div.find("img");
		img.css("position", "relative").css("top", ($(container).height() - img.height()) / 2);

		div.fadeIn(1000);
	},

	knoemaUrl: 'http://test.knoema.org',
	callbacks: [],
	data: null
};

jQuery.fn.extend({
	postRequest: function (data, callback) {
		utils.sendRequest(JSON.stringify(data),'post', this, callback);
	},

	getRequest: function (data, callback) {
		utils.sendRequest(data, 'get', this, callback);
	},

	gadgetRequest: function (data) {
		utils.data = data;
		var iframe = '<iframe src="' + utils.knoemaUrl + '/apps/fyn/gadget" id="gadget" onload="utils.gadgetLoaded();" width="270" height="350" frameborder="0" ></iframe>';
		$(iframe).appendTo(this);
	}
});
