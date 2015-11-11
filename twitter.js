var cfg = require('./config');
var twitter = require('twitter');

var twit_client = new twitter( {
  consumer_key: cfg.consumer_key,
  consumer_secret: cfg.consumer_secret,
  access_token_key: cfg.access_token_key,
  access_token_secret: cfg.access_token_secret
} );
