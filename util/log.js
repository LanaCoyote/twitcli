function Logger( logfile ) {
  this.logfile = logfile;
}

Logger.prototype.print = function() {
  for ( var k in arguments ) {
    if ( arguments[k] === null ) continue;
    if ( arguments[k].size ) {
      while ( arguments[k].data.length < arguments[k].size ) {
        arguments[k].data += " ";
      }
      arguments[k] = arguments[k].data;
    }
  }
  console.log.apply( null, arguments );
}

Logger.prototype.log = function() {
  console.log.apply( null, arguments );
  // to-do: log the string to a file
}

Logger.prototype.error = function() {
  console.error.apply( null, arguments );
  // to-do: log the string to a file
}

module.exports = Logger;
