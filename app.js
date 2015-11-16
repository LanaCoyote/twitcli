var chalk = require('chalk');
var clui = require('clui');
var clicolor = require('cli-color');
var commands = require('./commands');
var twitter = require('./twitter');
var keypress = require('keypress');

var buffer = require('./buffer');
var log = require('./util/log');

var logger = new log();

function padZero( time ) {
  if ( time < 10 ) return '0' + time;
  else return time;
}

function getTimestamp( tweet ) {
  var created = new Date( tweet.created_at );
  return created.getHours() + ':' + padZero( created.getMinutes() ) + ':' + padZero( created.getSeconds() );

}

function getByline( tweet ) {
  return chalk.blue( '@' + tweet.user.screen_name ) + ' ' + tweet.user.name;
}

function getRetweetByline( rt_status, tweet ) {
  return chalk.blue( '@' + tweet.user.screen_name) + ' RT ' + getByline( rt_status );
}

function headerLine( text ) {
  var line = ' ' + text;
  while ( line.length < process.stdout.columns ) line += ' ';
  return line;
}

var scrollbackBuffer = null;
var readBuffer = '';
function redrawScreen() {
  
  var screen = new clui.LineBuffer( {x:0,y:0,width:'console',height:1} );
  var header = new clui.Line( screen ).
        column( headerLine(' TwitCLI - ' + new Date()), 'console', [clicolor.bgBlueBright] ).fill().store();

  var subscreen = new clui.LineBuffer( {x:0,y:1,width:'console',height:process.stdout.rows-3,scroll:0} );
  var infoline = new clui.LineBuffer( {x:0,y:process.stdout.rows-2,width:'console',height:1} );
  new clui.Line( infoline ).column( headerLine( 'INFOLINE!!' ), 'console', [clicolor.bgBlueBright] ).fill().store();

  var curbuffer = scrollbackBuffer;
  while( curbuffer !== null ) {
    if ( curbuffer.isTweet ) {
      new clui.Line( subscreen ).
            column( curbuffer.header() ).
            fill().store();

      curbuffer.textArray().forEach( function( line ) {
        new clui.Line( subscreen ).
          column( line ).fill().store();
      } );
    } else {
      new clui.Line( subscreen ).column( curbuffer.header() ).fill().store();
    }

    var scrolldist = Math.max( 0, subscreen.lines.length - (process.stdout.rows - 3) );
    subscreen.userOptions.scroll = scrolldist;
    curbuffer = curbuffer.next;
  }

  process.stdout.write( clicolor.reset );
  subscreen.output();
  screen.output();
  infoline.output();
  printFooter();
}

function printFooter() {
  var username = "@LanceCoyote";
  var readlen = readBuffer[0] === '/' ? readBuffer.split(' ').slice(1).join(' ').length : readBuffer.length;
  while ( readlen.toString().length < 3 ) {
    readlen = ' ' + readlen;
  }
  var nameblock = '[' + chalk.blue(username) + ' ' + readlen + '] ';

  var spaceleft = process.stdout.columns - nameblock.length + 9;
  var shift = Math.max( 0, insertOffset - spaceleft );
  spaceleft += shift;
  var visbuffer = shift-1 > 0 ? readBuffer.slice( -spaceleft, -(shift-1) ) : readBuffer.slice( -spaceleft );

  process.stdout.write( nameblock + visbuffer );
  process.stdout.write( clicolor.move.left( insertOffset - Math.max(0,shift-1) ) );
}

//twitter.attach( function( tweet ) {
function handleTweet( tweet ) {
  if ( !tweet.user ) return;
  var head = tweet.id_str + " " + getTimestamp( tweet );
  var byline = getByline( tweet );
  var text = tweet.text;

  // add retweets to the byline
  if ( tweet.retweeted_status ) {
    byline = getRetweetByline( tweet.retweeted_status, tweet );
    text = tweet.retweeted_status.text;
  }

  // if there's a replied tweet, we'll show it in context
  if ( tweet.in_reply_to_status_id_str ) {
    twitter.get( tweet.in_reply_to_status_id_str, function( err, reply ) {
      if ( err ) return console.log( err );

      var repl_head = "Reply> " + reply.id_str + " " + getTimestamp( reply );
      var repl_byline = getByline( reply );
      var repl_text = reply.text;

      // get reply retweet info
      if ( reply.retweeted_status ) {
        repl_byline = getRetweetByline( reply.retweeted_status, reply );
        repl_text = reply.retweeted_status.text;
      }

      text = chalk.inverse( repl_head ) + ' ' + repl_byline + '\n' + repl_text + '\n' + text;
    } );
  } 

  var sbel = new buffer.ScrollbackElement( head, byline + ':', text, process.stdout.columns );
  sbel.isTweet = true;
  if ( scrollbackBuffer ) scrollbackBuffer.chain( sbel );
  else scrollbackBuffer = sbel;

  redrawScreen();
}

var sline = null;
var insertOffset = 0;
keypress( process.stdin );
process.stdin.setEncoding( 'utf8' );
process.stdin.setRawMode( true );
process.stdin.resume();
process.stdin.on( 'keypress', function( ch, key ) {
  if ( key === undefined ) {
    readBuffer += ch;
  } else if ( key.name === 'c' && key.ctrl ) {
    process.exit(0);
  } else if ( key.name === 'backspace' ) {
    readBuffer = readBuffer.slice( 0, readBuffer.length - 1 );
  } else if ( key.name === 'space' ) {
    readBuffer += ' ';
  } else if ( key.name === 'up' ) {
    if (sline) {
      sline.selected = false;
      sline = sline.previous;
    } else sline = scrollbackBuffer.last();
    if (sline) sline.selected = true;
  } else if ( key.name === 'down' ) {
    if (sline) {
      sline.selected = false;
      sline = sline.next;
      if (sline) sline.selected = true;
    }
  } else if ( key.name === 'left' ) {
    insertOffset = Math.min( readBuffer.length, insertOffset + 1 );
  } else if ( key.name === 'right' ) {
    insertOffset = Math.max( 0, insertOffset - 1 );
  } else if ( key.name === 'return' ) {
    if (sline) {
      if (sline.isTweet) {
        readBuffer += " " + sline.lead.split(' ')[0];
      }
      sline.selected = false;
      sline = null;
    } else {
      var cmd = readBuffer.trim().split(' ');
      if ( readBuffer[0] === '/' ) {
        cmd[0] = cmd[0].slice( 1 );
        if ( commands[ cmd[0] ] ) {
          commands[ cmd[0] ]( cmd[0], cmd.slice(1), scrollbackBuffer );
        } else {
          var sbe = new buffer.ScrollbackElement( 
            "ERROR:", "Command not found \"" + cmd[0] + "\"", null, process.stdout.columns );
          scrollbackBuffer ? scrollbackBuffer.chain( sbe ) : scrollbackBuffer = sbe;
        }
      } else {
        if ( readBuffer.length ) commands['tweet']( 'tweet', cmd, scrollbackBuffer );
      }
      readBuffer = '';
      insertOffset = 0;
    }
  } else {
    var k = key.shift ? key.name.toUpperCase() : key.name;
    //readBuffer += k;
    var cutpoint = readBuffer.length - insertOffset;
    readBuffer = readBuffer.slice( 0, cutpoint ) + k + readBuffer.slice( cutpoint );
  }
  redrawScreen();

    //var cmd = process.stdin.read().trim().split(' ');

    //if ( cmd[0][0] === '/' ) {
      //cmd[0] = cmd[0].slice( 1 );
      //if ( commands[ cmd[0] ] ) {
        //commands[ cmd[0] ]( cmd[0], cmd.slice(1) );
      //}
    //}
//
    //prompt_ready = false;
    //twitter.resume();
} );


twitter.attach( handleTweet );
redrawScreen();

