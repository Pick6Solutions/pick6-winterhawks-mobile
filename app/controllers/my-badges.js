import Ember from 'ember';

export default Ember.Controller.extend({
	titleVisible: false,
	badgeCode: 'nothing',

	badgeCodeCheck: function() {
	    var code = this.get('code');
	    if (code === "") {
	      this.set('badgeCode', "error");
	    } else {
	      this.set('badgeCode', code);
	    }
	  }.observes('code'),
	actions: {
	    viewTitle: function() {
	    	if (this.titleVisible) {
	    	  this.set('titleVisible', false);
	    	} else {
	    	  this.set('titleVisible', true);
	    	}
	    },
	    sendCode: function() {
	      var controller = this;
	      var userId = controller.get('session').get('id');
	      var code = this.badgeCode;
	      var userBadge = this.store.createRecord('user-badge', {
	        code: code,
	        user_id: userId
	      });
	      userBadge.save().then(function() {
	        controller.set('code', '');
	        controller.set('redeemed', true);
	        controller.notify.alert('Code Redeemed!');
	        setTimeout(function() {
	          controller.set('redeemed', false);
	        }, 2500);
	      }).catch(function(response) {
	        var badgeErrors = response.errors.badge;
	        if (Ember.isEmpty(badgeErrors) === false) {
	          badgeErrors.forEach(function(message) {
	            controller.notify.alert("Badge: " + message);
	          });
	        }
	        console.log(response.errors);
	        setTimeout(function() {
	          controller.set('errors', undefined);
	        }, 10000);
	      });
	    }
	  }
});
