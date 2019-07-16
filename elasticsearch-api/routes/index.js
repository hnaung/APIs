const Router = require('koa-router');
const router = new Router();

const controllers = require('../controllers');

router.get('/health', (ctx) => {
  ctx.body = {
    status: 'search context service is up and running!',
  };
});

router.get('/cuisines', controllers.getCuisines);
router.get('/restaurants/near', controllers.searchNearbyRestaurants);
router.get('/restaurants', controllers.searchRestaurants);

module.exports = router;
