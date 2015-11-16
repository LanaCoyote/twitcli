var cfg = require('./config');
var twitter = require('twitter');

var twit_client = new twitter( {
  consumer_key: cfg.consumer_key,
  consumer_secret: cfg.consumer_secret,
  access_token_key: cfg.access_token_key,
  access_token_secret: cfg.access_token_secret
} );
twit_client.reading = true;
twit_client.buffer = [];

function attachStream( tweet_cb, friends_cb ) {
  twit_client.stream( 'user', function( stream ) {
    stream.on( 'data', function( data ) {
      if ( twit_client.reading ) {
        tweet_cb( data );
      } else {
        twit_client.buffer.push( {cb:tweet_cb,data:data} );
      }
    } );
  } );
}

function pauseStream() {
  twit_client.reading = false;
}

function resumeStream() {
  while( twit_client.buffer.length ) {
    var buffEl = twit_client.buffer.shift();
    buffEl.cb( buffEl.data );
  }
  
  twit_client.reading = true;
}

function getTweet( id, cb ) {
  twit_client.get( '/statuses/show/' + id + '.json', {include_entities: true}, function( err, tweet ) {
    cb( err, tweet );
  });
}

function updateTweet( text, cb ) {
  twit_client.post( '/statuses/update.json', {status:text}, function( err, tweet ) {
    cb( err, tweet );
  });
}

function likeTweet( id, cb ) {
  twit_client.post( '/favorites/create.json', {id:id.trim(), include_entities:false},
    function( err, tweet ) {
    cb( err, tweet );
  });
}

function retweetTweet( id, cb ) {
  twit_client.post( '/statuses/retweet/' + id + '.json', {include_entities:false}, function( err, tweet ) {
    cb( err, tweet );
  } );
}

module.exports.pause = pauseStream;
module.exports.resume = resumeStream;
module.exports.attach = attachStream;
module.exports.get = getTweet;
module.exports.like = likeTweet;
module.exports.update = updateTweet;
module.exports.retweet = retweetTweet;
