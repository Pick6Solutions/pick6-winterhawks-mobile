import Ember from 'ember';

export default Ember.Controller.extend({
  text: '',
  charactersLeft: function() {
    return 140 - this.get('text').length;
  }.property('text'),

  actions: {
    signIn: function() {
      var controller = this;
      var userId = controller.get('session').get('id');
      this.set('twitterAuthentication', this.store.createRecord('twitter-authentication', {
        user_id: userId
      }));
      this.get('twitterAuthentication').save().then(function() {
        var oauth_request_token = controller.twitterAuthentication.get('oauth_request_token');
        var authWindow = window.open('https://api.twitter.com/oauth/authorize?oauth_token=' + oauth_request_token, "_blank");

        // for phonegap
        authWindow.addEventListener('loadstart', function(event) {
          var url = event.url;
          console.log(event.url);
          var code = /oauth_verifier=(.+)$/.exec(url);
          console.log(code);
          var error = /error=(.+)$/.exec(url);

          if (code) {
            authWindow.close();
            controller.get('twitterAuthentication').set('oauth_verifier', code[1]);
            controller.get('twitterAuthentication').save();
          }

          if (error) {
            authWindow.close();
            alert('Oops! Something went wrong:\n' + error[1]);
          }
        });

      });
    },

    // for real browsers
    afterAuthentication: function() {
      this.get('twitterAuthentication').set('oauth_verifier', this.get('oauth_verifier'));
      this.get('twitterAuthentication').save();
    },
    sendTweet: function() {
      var controller = this;
      var tweet = this.store.createRecord('tweet', {
        text: this.get('text')
      });
      tweet.save().then(function() {
        controller.set('text', '');
        controller.transitionToRoute('tweet-confirm');
      });
    }
  }
});
