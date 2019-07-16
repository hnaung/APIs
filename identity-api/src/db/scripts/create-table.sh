#!/bin/bash

env=$1
if [ -z "$env" ]; then
  database="identity"
else
  database="identity_test"
fi

run () {
  # Must create UserAccess table first
  mysql --login-path=local --protocol=tcp --database=$database -N < generated/UserAccess-schema.sql
  mysql --login-path=local --protocol=tcp --database=$database -N < generated/UserProfile-schema.sql
  mysql --login-path=local --protocol=tcp --database=$database -N < generated/Device-schema.sql
  mysql --login-path=local --protocol=tcp --database=$database -N < generated/GoogleAccount-schema.sql
  mysql --login-path=local --protocol=tcp --database=$database -N < generated/FacebookAccount-schema.sql
  mysql --login-path=local --protocol=tcp --database=$database -N < generated/EmailAccount-schema.sql
}

run
