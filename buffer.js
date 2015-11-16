var chalk = require('chalk');

function wordWrapText( text, maxlen ) {
  if ( !maxlen ) maxlen = 80;

  var lines = [],
      words = text.split(' ');

  while( words.length ) {
    var nextline = [];

    while( nextline.join(' ').length < maxlen ) {
      // pull the next word off our queue
      var nextword = words.shift();

      if ( nextword === undefined ) {
        break;
      }

      // check for line breaks
      if ( nextword.indexOf('\n') > -1 ) {
        var nlsplit = nextword.split('\n');
        words = nlsplit.concat( words );  // return the rest of the word to the queue
        nextword = words.shift();
      }

      // check if the next line will overflow us
      if ( (nextline.join(' ') + ' ' + nextword).length > maxlen ) {
        words.unshift( nextword );
        break;
      } else {
        nextline.push( nextword );
      }
    }

    lines[lines.length] = nextline.join(' ');
  }

  return lines;
}

function ScrollbackElement( lead, head, content, maxlen ) {
  this.lead = lead;
  this.head = head;
  this.content = content;
  
  this.maxlen = maxlen;
  this.selected = false;
  this.next = null;
  this.previous = null;
}

ScrollbackElement.prototype.header = function() {
  var leadblock = this.selected ? chalk.bgBlue.white( this.lead ) : chalk.inverse( this.lead );

  return leadblock + ' ' + this.head;
}

ScrollbackElement.prototype.textArray = function() {
  return wordWrapText( this.content, this.maxlen - 2 ).
    map( function( line ) { return '  ' + line } );
}

ScrollbackElement.prototype.text = function() {
  return this.textArray().join('\n');
}

ScrollbackElement.prototype.render = function() {
  return this.header() + '\n' + this.text() + '\n';
}

ScrollbackElement.prototype.last = function() {
  var end = this;
  while ( end.next ) end = end.next;
  return end;
}

ScrollbackElement.prototype.chain = function( element ) {
  var end = this.last();

  end.next = element;
  element.previous = end;
  return element;
}



module.exports.ScrollbackElement = ScrollbackElement;
