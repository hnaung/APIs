#!/bin/bash

env=$1
if [ -z "$env" ]; then
  database="identity"
else
  database="identity_test"
fi

run () {
  mysql --login-path=local --protocol=tcp --database=$database -N --execute="DROP TABLE UserProfile"
  mysql --login-path=local --protocol=tcp --database=$database -N --execute="DROP TABLE EmailAccount"
  mysql --login-path=local --protocol=tcp --database=$database -N --execute="DROP TABLE FacebookAccount"
  mysql --login-path=local --protocol=tcp --database=$database -N --execute="DROP TABLE GoogleAccount"
  mysql --login-path=local --protocol=tcp --database=$database -N --execute="DROP TABLE Device"
  # Must drop UserAccess last
  mysql --login-path=local --protocol=tcp --database=$database -N --execute="DROP TABLE UserAccess"
}

run
