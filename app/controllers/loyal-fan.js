import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    checkIn: function() {
      this.set('disable', true);
      var controller = this;
      var userId = controller.get('session').get('id');
      var checkIn = this.store.createRecord('check-in');
      console.log(checkIn);

      var success = function(position) {
        checkIn.set('latitude', position.coords.latitude);
        checkIn.set('longitude', position.coords.longitude);
        checkIn.set('user_id', userId);
        checkIn.save().then(function() {
          controller.get('session').get('currentUser').set('checked_in', true);
        }).catch(function(response) {
          controller.set('errors', response.errors);
          setTimeout(function() {
            controller.set('errors', undefined);
          }, 10000);
        });
      };

      var failure = function(error) {
        controller.notify.alert('Uh-oh. There was a problem' + "Error: " + error);
      };

      var options = { };

      navigator.geolocation.getCurrentPosition(success, failure, options);
    }
  }
});