import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    selectPlayer: function(selected_player) {
      var selection = this.store.createRecord('player-selection');
      var userId = this.get('session').get('id');
      selection.set('player_id', selected_player.get('id'));
      selection.set('user_id', userId);
      var controller = this;

      selection.save().then(function() {
        var players = controller.get('model').get('players');
        players.forEach(function(player) {
          player.set('picked_by_current_user', false);
        });
        console.log(selected_player);
        selected_player.set('picked_by_current_user', true);
        controller.transitionToRoute('player', selected_player);
      }).catch(function() {
        controller.notify.alert("You can't switch players at this time.");
      });
    }
  }
});
