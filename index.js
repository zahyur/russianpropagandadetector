var self = require("sdk/self");
var data = require("sdk/self").data;
var URL = require("sdk/url");
var tabs = require('sdk/tabs');
var {setInterval} = require("sdk/timers");
var pageMod = require("sdk/page-mod");
var Request = require("sdk/request").Request;
var ss = require("sdk/simple-storage");
var _ = require("sdk/l10n").get;

const UPDATE_INTERVAL = 86400000;
const UNMEDIA_URL = "https://gist.githubusercontent.com/yradunchev/3cecf6fba6b74d582d30/raw/c7af610c1467f62f8a292785137d8224093f7f9b/unmedia.txt";

if (!ss.storage.russianpropagandadetector) {
	  ss.storage.russianpropagandadetector  = {};
	}
if(!ss.storage.russianpropagandadetector.sites) {
	  ss.storage.russianpropagandadetector.sites  = [];
}

var isPropaganda = function(domain) {
 return ss.storage.russianpropagandadetector.sites.includes(domain);
}

var addSite = function(domain) {
  return ss.storage.russianpropagandadetector.sites.push(domain);
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

pageMod.PageMod({
  include: "*",
  contentScriptFile: self.data.url("warning_script.js"),
  contentScriptWhen: 'ready',
  onAttach: function(worker) {
    worker.port.on('checkSite', function(site) {
domain = URL.URL(site).hostname.replace(/^www\./, "").trim();
if(isPropaganda(domain)) {
      worker.port.emit('warning', [_('this_site'), domain, _('contains_propaganda'), _('leave_now_question')].join(' '));
}
    });
    worker.port.on("closeTab", function() {
      tabs.activeTab.close();
    });
  },
});

