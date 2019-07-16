require('dotenv').config({ path: '.env.test' });

const { expect } = require('chai');
const sinon = require('sinon');
const dateFns = require('date-fns');

const { getCuisines, searchRestaurants, searchNearbyRestaurants } = require('../../controllers');
const esService = require('../../services/elasticsearch');

// mock data
const mockCuisine = require('../mock-data/cuisines');
const mockRestaurant = require('../mock-data/restaurants');

const sandbox = sinon.createSandbox();

describe('Unit tests', () => {
  let ctx;

  beforeEach(() => {
    ctx = {};
  })

  afterEach(() => {
    sandbox.restore();
  })

  describe('Get cuisines', () => {
    it('should get cuisines successfully', async() => {
      sandbox.stub(esService, 'getClient').returns({
        search: () => mockCuisine.cuisinesResult
      });
  
      await getCuisines(ctx);
  
      expect(ctx.body.length).equal(mockCuisine.aggregatedCuisines.length);
    })
  
    it('should throw error while getting cuisines', async() => {
      const errorMessage = 'Error occurred while getting cuisines';
      sandbox.stub(esService, 'getClient').returns({
        search: () => { throw new Error(errorMessage) }
      });
  
      try {
        await getCuisines(ctx);
      } catch(err) {
        expect(err.message).to.equal(errorMessage)
      }
    })
  })
  
  describe('Search restaurants by opening hours', () => {
    const startDate = '2019-06-17T21:00+01:00';
    const endDate = '2019-06-17T22:00+01:00';

    beforeEach(() => {
      ctx = {
        query: {
          startDate,
          endDate
        }
      }
    })

    it('should search for restaurants and rank those that are open higher than those closed', async () => {
      sandbox.stub(dateFns, 'getDay').returns(1);
      const formatStub = sandbox.stub(dateFns, 'format');
      // server stores date in UTC
      formatStub.onCall(0).returns(20);
      formatStub.onCall(1).returns(0);
      formatStub.onCall(2).returns(21);
      formatStub.onCall(3).returns(0);
  
      sandbox.stub(esService, 'getClient').returns({
        search: () => mockRestaurant.openingPeriodsResult
      })
  
      await searchRestaurants(ctx);
  
      expect(ctx.body.length).equal(mockRestaurant.openingPeriods.length);
    })

    it('should throw error while searching for restaurants', async() => {
      const errorMessage = 'Error occurred while searching for restaurants';
      const formatStub = sandbox.stub(dateFns, 'format');
      // server stores date in UTC
      formatStub.onCall(0).returns(20);
      formatStub.onCall(1).returns(0);
      formatStub.onCall(2).returns(21);
      formatStub.onCall(3).returns(0);
  
      sandbox.stub(esService, 'getClient').returns({
        search: () => { throw new Error(errorMessage) }
      });
  
      try {
        await searchRestaurants(ctx);
      } catch(err) {
        expect(err.message).to.equal(errorMessage)
      }
    })
  })

  describe('Search nearby restaurants', () => {
    const lat = 55.9510486;
    const lon = -3.1902174;
    const radius = 100;

    beforeEach(() => {
      ctx = {
        query: {
          lat, lon, radius
        }
      };
    })

    it('should search for nearby restaurants', async () => {
      sandbox.stub(esService, 'getClient').returns({
        search: () => mockRestaurant.nearbyRestaurantsResult
      });
  
      await searchNearbyRestaurants(ctx);
  
      expect(ctx.body.length).equal(mockRestaurant.nearbyRestaurants.length);
    })

    it('should throw error while searching for nearby restaurants', async() => {
      const errorMessage = 'Error encountered while searching for nearby restaurants';
      sandbox.stub(esService, 'getClient').returns({
        search: () => { throw new Error(errorMessage) }
      });

      try {
        await searchRestaurants(ctx);
      } catch(err) {
        expect(err.message).to.equal(errorMessage)
      }
    })
  })
});
