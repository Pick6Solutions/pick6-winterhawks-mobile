import Ember from 'ember';

export default Ember.ObjectController.extend({
  actions: {
    redeem: function() {
      var controller = this;
      var userId = controller.get('session').get('id');
      var purchase = this.store.createRecord('purchase', {
        coupon_id: controller.get('model').get('id'),
        user_id: userId
      });

      purchase.save().then(function() {
        controller.transitionToRoute('redeemed');
      }).catch(function(response) {
        controller.set('controller-errors', response.errors);
        setTimeout(function() {
          controller.set('controller-errors', undefined);
        }, 10000);
      });
    }
  }
});
