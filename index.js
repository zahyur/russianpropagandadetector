var self = require("sdk/self");
var URL = require("sdk/url");
var tabs = require('sdk/tabs');
var ss = require("sdk/simple-storage");
var _ = require("sdk/l10n").get;

var { Cc, Ci} = require('chrome');
var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
	.getService(Ci.nsIPromptService);

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

var unmedia = self.data.load('unmedia.txt');
var	domains = unmedia.split("\n");
for(var i=0; i < domains.length; i++) {
	var	domain = domains[i].trim();
	if(!isPropaganda(domain) && URL.isValidURI('http://'+ domain)) {
		addSite(domain);
	}
}

tabs.on('ready', function(tab) {
	var domain = URL.URL(tab.url).hostname.replace(/^www\./, "");
	if(domain && isPropaganda(domain) && !shouldIgnore(domain)) {
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

