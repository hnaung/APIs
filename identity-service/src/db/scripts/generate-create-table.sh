#!/bin/bash

start_match="CREATE TABLE"
end_match="ai_ci"

env=$1
if [ -z "$env" ]; then
  database="identity"
else
  database="identity_test"
fi

run () {
  rm -f generated/*

  # Get a list of tables in database
  query="SHOW TABLES"
  result=$(mysql --login-path=local --protocol=tcp --database=$database -N --execute="$query")
  tables=($(echo "$result" | tr " " "\n"))

  # Generate the create table script
  for table in "${tables[@]}"
  do
    query="SHOW CREATE TABLE $table"
    result=$(mysql --login-path=local --protocol=tcp --database=$database -N --execute="$query")
    echo -e $result | sed -E "s/.*($start_match.*)/\1/" > "generated/${table}-schema.sql"
  done
}

run
