import Ember from 'ember';
import LoginControllerMixin from 'simple-auth/mixins/login-controller-mixin';

export default Ember.Controller.extend(LoginControllerMixin, {
  authenticator: 'simple-auth-authenticator:devise',
  actions: {
    authenticate: function() {
      var controller = this;
      controller._super().then(function() {
        var userData = controller.get('session').content;
        // eventually this should be refactored to use store.pushPayload, when it is supported by the adapter
        userData.user.badges = userData.user.badge_ids;
        controller.store.pushMany('badge', userData.badges);
        controller.store.push('user', userData.user);
        controller.transitionToRoute('landing');
        controller.notify.success("Game On!");
      }).catch(function() {
        // this.get('signInError').alert('Wrong username or password.');
        controller.set('loginErrorMessage', 'Wrong username or password.');
        // console.log(controller.loginErrorMessage);
      });
    },

    resetPassword: function() {
      var controller = this;
      var username = this.get('identification');
      var reset = this.store.createRecord('password', {
        username: username
      });
      if (username === '') {
        controller.set('usernameBlank', true);
        controller.notify.alert("PLEASE ENTER YOUR USERNAME BEFORE SELECTING 'FORGOT PASSWORD'");
        setTimeout(function() {
          controller.set('usernameBlank', false);
        }, 2000);
      } else {
        reset.save().then(function() {
          controller.set('resetSent', true);
          controller.notify.alert("Password reset instructions have been sent to your account's email address");
          setTimeout(function() {
            controller.set('resetSent', false);
          }, 10000);
        }).catch(function(response) {
          controller.notify.alert("Invalid username");
          controller.set('errors', response.errors);
          setTimeout(function() {
            controller.set('errors', undefined);
          }, 10000);
        });
      }
    }
  }
});
