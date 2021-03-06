var fs = require('fs');
var path = require('path');
var config = require('../config');
var Gpio = require('onoff').Gpio;
var relay = new Gpio(config.gpio.relay, 'in');
var contact = new Gpio(config.gpio.contact, 'in');

var logFile = path.join(__dirname, '../', 'log', 'log.txt');

var Status = function(value, text) {
    this.value = value,
    this.text = text;
};

function exit() {
  contact.unexport();
  relay.unexport();
  process.exit();
}

process.on('SIGINT', exit);

//get contact status
function status() {
  return new Promise((resolve, reject) => {
    contact.read((err, value) => {
      if (err) {
        console.log('Error reading status');
        reject();
      }

      var status = value === 1 ? 'open' : 'closed';

      resolve(new Status(value, status));
    });
  });
}

//toggle door
function toggleDoor() {
  return new Promise((resolve, reject) => {
    relay.setDirection('out');

    setTimeout(() => {
      relay.setDirection('in');
      resolve(new Status(3, 'toggled'));
    }, 300);
  });
}

function log(message) {
  if (message) {
    var msg = new Date().toString() + '\t' + message + '\n';
    fs.appendFile(logFile, msg, (err) => {
      if (err) {
        console.log('Error writing to log file.');
        console.log(err);
      }
    });
  } else {
    return new Promise((resolve, reject) => {
      fs.readFile(logFile, (err, data) => {
        if (err) {
          console.log('Error reading log file');
          reject(err);
        }
        resolve(data);
      });
    });
  }
}

module.exports = {
  log: log,
  status: status,
  toggle: toggleDoor
};
