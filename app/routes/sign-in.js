import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel: function() {
    var controller = this.controllerFor('sign-in');
    var session = controller.get('session');
    if (session.isAuthenticated) {
      this.transitionTo('/');
    }
  }
});
