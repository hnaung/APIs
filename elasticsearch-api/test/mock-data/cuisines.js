exports.aggregatedCuisines = [
  {
    "key": "Afternoon Tea",
    "doc_count": 1
  },
  {
      "key": "Cafe",
      "doc_count": 1
  },
  {
      "key": "Cocktails",
      "doc_count": 1
  },
  {
      "key": "Contemporary",
      "doc_count": 1
  },
  {
      "key": "French",
      "doc_count": 1
  },
  {
      "key": "Indian",
      "doc_count": 1
  },
  {
      "key": "Japanese",
      "doc_count": 1
  },
  {
      "key": "Modern Australian",
      "doc_count": 1
  },
  {
      "key": "Scottish",
      "doc_count": 1
  },
  {
      "key": "Small Plates",
      "doc_count": 1
  },
  {
      "key": "Tapas",
      "doc_count": 1
  },
  {
      "key": "Wine Bar",
      "doc_count": 1
  }
];

exports.cuisinesResult = {
  "body": {
    "took": 2,
        "timed_out": false,
        "_shards": {
            "total": 1,
            "successful": 1,
            "skipped": 0,
            "failed": 0
        },
        "hits": {
            "total": {
                "value": 9,
                "relation": "eq"
            },
            "max_score": 1,
            "hits": [
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "1",
                    "_score": 1
                },
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "2",
                    "_score": 1
                },
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "3",
                    "_score": 1
                },
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "4",
                    "_score": 1
                },
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "5",
                    "_score": 1
                },
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "6",
                    "_score": 1
                },
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "7",
                    "_score": 1
                },
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "8",
                    "_score": 1
                },
                {
                    "_index": "restaurants-2019-06-20-135233",
                    "_type": "_doc",
                    "_id": "9",
                    "_score": 1
                }
            ]
        },
        "aggregations": {
            "CuisineTypes": {
                "doc_count_error_upper_bound": 0,
                "sum_other_doc_count": 0,
                "buckets": exports.aggregatedCuisines
            }
        }
  },
  "statusCode": 200,
  "headers": {},
  "warnings": null,
  "meta": {}
}