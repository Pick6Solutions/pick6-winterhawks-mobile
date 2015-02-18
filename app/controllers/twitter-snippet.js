import Ember from 'ember';

export default Ember.ObjectController.extend({
  needs: 'twitter',
  alreadyInserted: false,
  actions: {
    insert: function() {
      var tweetController = this.get('controllers.twitter');
      tweetController.set('text', tweetController.get('text') + ' ' + this.get('name'));
      this.set('alreadyInserted', true);
    }
  }
});
