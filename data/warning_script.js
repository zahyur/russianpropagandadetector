self.port.emit("checkSite", document.URL);

self.port.on("warning", function(message) {
  confirm(message) && self.port.emit("closeTab");
});
