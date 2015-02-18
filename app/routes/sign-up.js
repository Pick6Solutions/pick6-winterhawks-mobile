import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return this.store.createRecord('user');
  },
  
  beforeModel: function() {
    var controller = this.controllerFor('sign-up');
    var session = controller.get('session');
    if (session.isAuthenticated) {
      this.transitionTo('/');
    }
  }
});
