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
    if ( err ) return console.error( err );
    cb( tweet );
  });
}

module.exports.pause = pauseStream;
module.exports.resume = resumeStream;
module.exports.attach = attachStream;
module.exports.get = getTweet;
