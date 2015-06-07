"use strict";

module.exports = (function() {
  var DDPClient = require("ddp");

  function DDPSync(cfg) {
    this._config = cfg;
    this._connected = false;

    this._ddpclient = new DDPClient({
      host : cfg.syncServer,
      port : cfg.syncPort,
      ssl  : cfg.ssl || false,
      autoReconnect : true,
      autoReconnectTimer : cfg.autoReconnectTimer || 5000,
      maintainCollections : true,
      ddpVersion : '1',
      useSockJs: true
    });
  }

  DDPSync.prototype.initialise = function(cb) {
    var self = this;

    this._ddpclient.connect(function(error, reconnect) {
      if (error) {
        console.log("DDP connection error: " + error.toString());
        cb(error);
      } else {
        self._connected = true;
        if (reconnect) {
          console.log("DDP re-connected");
        }
        console.log("DDP connected");
        cb(error, reconnect);
      }
    });
  };

  DDPSync.prototype.sendData = function(dataIn, cb) {
    var self = this;

    var data = {
      hubId: this._config.hubId,
      payload: dataIn
    };

    if (self._connected) {
      console.log("sending data");
      this._ddpclient.call(
        self._config.path,
        [data],
        function(err, result) {
          if (err) {
            console.error("failed to send data: " + err.message);
          } else {
            console.log("dataset added, result is: " + JSON.stringify(result));
          }
          cb(err, result);
        },
        function() {
          console.log("updated");
        }
      );
    } else {
      console.log("not connected");
      process.nextTick(function() { cb(new Error("not connected")); });
    }
  };

  DDPSync.prototype.close = function() {
    this._ddpclient.close();
  };

  return DDPSync;
}());