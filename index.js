var self = require("sdk/self");
var URL = require("sdk/url");
var tabs = require('sdk/tabs');
var {setInterval} = require("sdk/timers");
var Request = require("sdk/request").Request;
var ss = require("sdk/simple-storage");
var _ = require("sdk/l10n").get;

var { Cc, Ci} = require('chrome');
var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Ci.nsIPromptService);

const UPDATE_INTERVAL = 86400000;
const UNMEDIA_URL = "https://gist.githubusercontent.com/yradunchev/3cecf6fba6b74d582d30/raw/c7af610c1467f62f8a292785137d8224093f7f9b/unmedia.txt";

if (!ss.storage.russianpropagandadetector) {
	ss.storage.russianpropagandadetector  = {};
}
if(!ss.storage.russianpropagandadetector.sites) {
	ss.storage.russianpropagandadetector.sites  = [];
}
if(!ss.storage.russianpropagandadetector.ignore) {
	ss.storage.russianpropagandadetector.ignore  = [];
}

var isPropaganda = function(domain) {
	return ss.storage.russianpropagandadetector.sites.includes(domain);
}

var addSite = function(domain) {
	return ss.storage.russianpropagandadetector.sites.push(domain);
}

var ignoreSite = function(domain) {
	return ss.storage.russianpropagandadetector.ignore.push(domain);
}

var shouldIgnore = function(domain) {
	return ss.storage.russianpropagandadetector.ignore.includes(domain);
}

var unmedia = Request({
	url: UNMEDIA_URL,
	overrideMimeType: "text/plain; charset=utf8",
	onComplete: function (response) {
		text = response.text;
		lines = text.split("\n");
		for(var i=0; i < lines.length; i++) {
			line = lines[i].trim();
			if(!isPropaganda(line) && URL.isValidURI('http://'+ line)) {
				addSite(line);
			}
		}
	}
});

unmedia.get();
setInterval(unmedia.get, UPDATE_INTERVAL);

tabs.on('ready', function(tab) {
	domain = URL.URL(tab.url).hostname.replace(/^www\./, "");
	if(isPropaganda(domain) && !shouldIgnore(domain)) {
		tab.activate();
		var warnAgain = {value: true};
		var result = prompts.confirmCheck(null,
			_("warning_title"),
			[_('this_site'), domain, _('contains_propaganda'), _('leave_now_question')].join(' '),
			_("warn_again_checkbox"), warnAgain);
		if(result) {
			tab.close()
		}
		if(!warnAgain.value) {
			ignoreSite(domain);
		}
	}
});

