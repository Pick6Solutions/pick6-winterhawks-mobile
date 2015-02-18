import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    listPlayers: function(game_id) {
      if (game_id !== 0) {
        var currentGame = this.store.find('game', game_id);
        this.transitionToRoute('player-selection', currentGame);
      } else {
        this.transitionToRoute('landing');
      }
    }
  }
});
