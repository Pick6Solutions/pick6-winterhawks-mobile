import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    selectCoupon: function(selected_coupon) {
      this.transitionToRoute('coupon', selected_coupon);
    }
  }
});
