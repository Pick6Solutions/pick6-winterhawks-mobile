import Ember from 'ember';

export default Ember.Controller.extend({
  radioPlaying: false,
  actions: {
    openRadio: function() {
      var radioStream = document.getElementById('radio_stream');
      if (this.radioPlaying) {
        radioStream.pause();
        this.set('radioPlaying', false);
      } else {
        radioStream.play();
        this.set('radioPlaying', true);
      }
    },
    openStats: function() {
      window.open('http://media.whl.ca/mobile/statdisplay.php?bblh=mSafari&type=skaters&team_id=208&season_id=249&tournament_id=0&leagueId=26&division_id=-1&confId=0', "_blank");
    },
    playGame: function(player_id) {
      if (player_id !== 0) {
        var player = this.store.find('player', player_id);
        this.transitionToRoute('player', player);
      } else {
        this.transitionToRoute('instructions');
      }
    },
    loyalFan: function(game_id) {
      if (typeof game_id === 'number' && game_id !== 0) {
        var currentGame = this.store.find('game', game_id);
        this.transitionToRoute('loyal-fan', currentGame);
      } else {
        this.transitionToRoute('loyal-fan', null);
      }
    }
  }
});
