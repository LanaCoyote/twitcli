var chalk = require('chalk');

var buffer = require('./buffer');
var logger = require('./util/log');
var twitter = require('./twitter');

var log = new logger();

function printToBuffer( head, text, sbb ) {
  var sbe = new buffer.ScrollbackElement( head, text, null, process.stdout.columns );
  sbb ? sbb.chain( sbe ) : sbb = sbe;
}

module.exports = {
  tweet: function( cmd, args, sbb ) {
    var tweet_text = args.join( ' ' );
    if ( tweet_text.length > 140 ) return console.error( "That tweet is longer than 140 characters" );

    twitter.update( tweet_text, function( err, tweet ) {
      if (err) return console.error( err );

      log.print( chalk.inverse( 'Successfully Tweeted:' ), tweet.id_str );
    } );
  },

  reply: function( cmd, args, sbb ) {

  },
  
  like: function( cmd, args, sbb ) {
    args.forEach( function( tweet_id ) {
      twitter.like( tweet_id, function( err, tweet ) {
        if (err) return console.error( err );

        //log.print( chalk.inverse( 'Successfully Liked:' ), tweet.id_str );
        printToBuffer( "Successfully Liked:", tweet.id_str, sbb );
      } );
    } );
  },

  retweet: function( cmd, args, sbb ) {
    args.forEach( function( tweet_id ) {
      twitter.retweet( tweet_id, function( err, tweet ) {
        if (err) return console.error( err );

        log.print( chalk.inverse( 'Successfully Retweeted:' ), tweet.id_str );
      } );
    } );
  },

  info: function( cmd, args, sbb ) {

  },

  who: function( cmd, args, sbb ) {

  },
};
