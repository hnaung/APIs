/* eslint-disable no-unused-vars */
const dateFns = require('date-fns');

const { MAX_CUISINES_BUCKETS, ALIASES, DISTANCE_UNITS } = require('../constants');
const { logger } = require('../utils/logging');

const esService = require('../services/elasticsearch');

/**
 * Get a list of unique cuisine types using terms aggregation
 * See: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html
 */
exports.getCuisines = async (ctx) => {
  const result = await esService.getClient().search({
    index: ALIASES.RESTAURANTS,
    body: {
      _source: false,
      aggregations: {
        CuisineTypes: {
          terms: {
            field: 'CuisineTypes.raw',
            size: MAX_CUISINES_BUCKETS,
          },
        },
      },
    },
  });

  const { body, statusCode, headers, warnings, meta } = result;

  // took: ms, timed_out: boolean, shards: { total, successful, skipped, failed }
  const { took, timed_out: timedOut, shards, hits, aggregations } = body;

  // total: { value, relation }, results: array, aggregations
  const { total, hits: results } = hits;

  // bucketsNotIncludedCount(sum of the document counts that are not part of the response)
  // maxExcludedCount(the maximum potential document count for a term which did not make it into the final list of terms.)
  const {
    CuisineTypes: {
      doc_count_error_upper_bound: maxExcludedCount,
      sum_other_doc_count: bucketsNotIncludedCount,
      buckets,
    },
  } = aggregations;

  const cuisineTypes = buckets.map((bucket) => bucket.key);
  logger.info(`The query took ${took} ms to complete, and returned ${total.value} results.`);

  ctx.body = cuisineTypes;
};

/**
 * Get a list of restaurants that are open within a specific start date and end date
 */
exports.searchRestaurants = async (ctx) => {
  // TODO: mock start date and end date from client.
  // Client will send in time offset info using .getTimezoneOffset()
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset

  // 2019-06-17 is monday
  const { startDate = '2019-06-17T21:00+01:00', endDate = '2019-06-17T22:00+01:00' } = ctx.query;

  // Date fns's day start on sunday, i.e. sunday = 0, monday = 1, saturday = 6
  let dayOfWeek = dateFns.getDay(startDate);
  if (dayOfWeek === 0) {
    // Set sunday to 7
    dayOfWeek = 7;
  }

  const startHour = dateFns.format(startDate, 'HH');
  const startMinute = dateFns.format(startDate, 'mm');
  const endHour = dateFns.format(endDate, 'HH');
  const endMinute = dateFns.format(endDate, 'mm');

  const result = await esService.getClient().search({
    index: ALIASES.RESTAURANTS,
    body: {
      from: 0,
      size: 1000,
      query: {
        bool: {
          filter: [
            {
              nested: {
                path: 'OpeningPeriods.Days',
                query: {
                  term: {
                    'OpeningPeriods.Days.Day': dayOfWeek,
                  },
                },
              },
            },
          ],
          should: [
            {
              nested: {
                path: 'OpeningPeriods.Days',
                query: {
                  range: {
                    'OpeningPeriods.Days.Timeslot': {
                      gte: `${startHour}:${startMinute}`,
                      lte: `${endHour}:${endMinute}`,
                      relation: 'contains',
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  });

  const { body, statusCode, headers, warnings, meta } = result;

  const { took, timed_out: timedOut, _shards: shards, hits } = body;
  const { total, max_score: maxScore } = hits;

  logger.info(
    `The query took ${took} ms to complete, searched ${shards.total} shards, and returned ${
      total.value
    } results.`
  );

  let { hits: results } = hits;
  results = results.map((result) => ({
    id: result._id,
    score: result._score,
    ...result._source,
  }));

  ctx.body = results;
};

/**
 * Search for restaurants given a location(lat, lon) and search radius, sorted by nearest restaurants
 */
exports.searchNearbyRestaurants = async (ctx) => {
  // TODO: Mock location and radius(km) from client
  const { lat = 55.9510486, lon = -3.1902174, radius = 100 } = ctx.query;

  const result = await esService.getClient().search({
    index: ALIASES.RESTAURANTS,
    body: {
      query: {
        bool: {
          filter: {
            geo_distance: {
              distance: `${radius}${DISTANCE_UNITS}`,
              'Address.Location': `${lat},${lon}`,
            },
          },
        },
      },
      sort: {
        _geo_distance: {
          'Address.Location': `${lat},${lon}`,
          order: 'asc',
          unit: `${DISTANCE_UNITS}`,
        },
      },
    },
  });

  const { body, statusCode, headers, warnings, meta } = result;

  const { took, hits } = body;
  const { total } = hits;
  let { hits: results } = hits;

  results = results.map((result) => ({
    id: result._id,
    distance: result.sort[0],
    ...result._source,
  }));

  ctx.body = results;

  logger.info(`Query took ${took} ms to complete, returned ${total.value} results`);
};
