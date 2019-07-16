#!/bin/bash

database="identity"

# Must create UserAccess table first
mysql --host=localhost --user=root --password=root --database=$database -N < /generated/UserAccess-schema.sql
mysql --host=localhost --user=root --password=root --database=$database -N < /generated/UserProfile-schema.sql
mysql --host=localhost --user=root --password=root --database=$database -N < /generated/Device-schema.sql
mysql --host=localhost --user=root --password=root --database=$database -N < /generated/GoogleAccount-schema.sql
mysql --host=localhost --user=root --password=root --database=$database -N < /generated/FacebookAccount-schema.sql
mysql --host=localhost --user=root --password=root --database=$database -N < /generated/EmailAccount-schema.sql