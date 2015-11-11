function Logger( logfile ) {
  this.logfile = logfile;
}

Logger.prototype.print() {
  console.log.apply( null, arguments );
}

Logger.prototype.log() {
  console.log.apply( null, arguments );
  // to-do: log the string to a file
}

Logger.prototype.error() {
  console.error.apply( null, arguments );
  // to-do: log the string to a file
}

module.exports = Logger;
