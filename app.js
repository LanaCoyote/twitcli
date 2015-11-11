var chalk = require('chalk');
var twitter = require('./twitter');
var log = require('./util/log');

var logger = new log();

function getTimestamp( tweet ) {
  var ts = tweet.created_at.split(' ');
  return ts[3];
}

function getByline( tweet ) {
  return chalk.blue( '@' + tweet.user.screen_name );
}

function getText( tweet, maxlen ) {
  // if we're not given a max length, we'll do 80
  if ( !maxlen ) maxlen = 80;

  var lines = [];
  var words = tweet.text.split( ' ' );
  
  // continue to operate until we've run out of words
  while( words.length ) {
    // start a new line
    lines[lines.length] = [];

    // the infinite loop looks like a crying face
    for (; ;) {
      // if we're used up every word we'll end the line
      if ( words.length === 0 ) break;

      // pull the next word off the queue
      var nextword = words.shift();

      // if there's a line break, we'll break the line
      if( nextword.indexOf('\n') > -1 ) {
        // take everything after the line break and push it back to the front
        // of the queue
        var nlstart = nextword.slice( nextword.indexOf('\n') + 1 );
        words.unshift( nlstart );

        // add the rest of the line and then break
        lines[lines.length-1] += " " + nextword.slice( 0, nextword.indexOf('\n') );
        break;
      }

      // check to see if the next word will overflow us
      if ( (lines[lines.length-1] + " " + nextword).length > maxlen ) {
        // return the word to the queue and break
        words.unshift( nextword );
        break;
      } else {
        // add the word to the line
        lines[lines.length-1] += " " + nextword;
      }
    }
  }

  return lines;
}

function getRetweetByline( rt_status ) {
  return ' RT ' + getByline( rt_status );
}

//twitter.attach( function( tweet ) {
function handleTweet( tweet ) {
  if ( !tweet.user ) return;
  var head = tweet.id_str + " " + getTimestamp( tweet );
  var byline = getByline( tweet );
  var text = getText( tweet, process.stdout.columns - 5 );

  // add retweets to the byline
  if ( tweet.retweeted_status ) {
    byline += getRetweetByline( tweet.retweeted_status );
    text = getText( tweet.retweeted_status, process.stdout.columns - 5 );
  }

  // print our tweet header
  logger.print( chalk.inverse( head ), byline, ':' );

  // if there's a replied tweet, we'll show it in context
  if ( tweet.in_reply_to_status_id_str ) {
    twitter.get( tweet.in_reply_to_status_id_str, function( reply ) {
      var repl_head = "Reply> " + reply.id_str + " " + getTimestamp( reply );
      var repl_byline = getByline( reply );
      var repl_text = getText( reply, process.stdout.columns - 11 );

      // get reply retweet info
      if ( reply.retweeted_status ) {
        repl_byline += getRetweetByline( reply.retweeted_status );
        repl_text += getText( reply.retweeted_status, process.stdout.columns - 11 );
      }

      // print the reply header and content
      logger.print( chalk.inverse( repl_head ), repl_byline, ':' );
      repl_text.forEach( function( line ) {
        logger.print( chalk.inverse( "     > " ), '  ', line );
      } );

      // dump the rest of our text
      text.forEach( function( line ) {
        logger.print( '  ', line );
      } );
    } );
  } else {
    // dump all our text
    text.forEach( function( line ) {
      logger.print( '  ', line );
    } );
  }
//} );
}

process.stdin.setEncoding( 'utf8' );
var prompt_ready = false;
process.stdin.on( 'readable', function() {
  if ( !prompt_ready ) {
    var temp = process.stdin.read();
    process.stdout.write( chalk.inverse("Enter Command:") );
    prompt_ready = true;
    twitter.pause();
  } else {
    var cmd = process.stdin.read().split(' ');

    if ( cmd[0] == '/like' ) {
      twitter.like( cmd[1], function( tweet ) {
        console.log( "operation was probably successful maybe" );
      } );
    }

    prompt_ready = false;
    twitter.resume();
  }
} );


twitter.attach( handleTweet );

