import Ember from 'ember';

export default Ember.ObjectController.extend({
  actions: {
    signUp: function() {
      var controller = this;
      var model = this.get('model');
      var password = this.get('password'); // password gets cleared on save

      model.save().then(function() {
        var session = controller.get('session');
        session.authenticate('simple-auth-authenticator:devise', {
          identification: model.get('username'),
          password: password
        }).then(function() {
          controller.transitionToRoute('landing');
        });
      }).catch(function(response) {
        var emailErrors = response.errors.email;
        var usernameErrors = response.errors.username;
        var passwordErrors = response.errors.password;
        
        if (Ember.isEmpty(emailErrors) === false) {
          emailErrors.forEach(function(message) {
            controller.notify.alert("Email: " + message);
          });
        }

        if (Ember.isEmpty(usernameErrors) === false) {
          usernameErrors.forEach(function(message) {
            controller.notify.alert("Username: " + message);
          });
        }

        if (Ember.isEmpty(usernameErrors) === false) {
          passwordErrors.forEach(function(message) {
            controller.notify.alert("Password: " + message);
          });
        }
      });
    }
  }
});
