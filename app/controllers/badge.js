import Ember from 'ember';

export default Ember.ObjectController.extend({
  actions: {
    showName: function() {
      this.set('badgeShowing', true);
      var controller = this;
      setTimeout(function() {
        controller.set('badgeShowing', false);
      }, 4000);
    }
  }
});
