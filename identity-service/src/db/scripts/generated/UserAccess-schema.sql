CREATE TABLE `UserAccess` (
 `id` varchar(36) NOT NULL COMMENT 'uuid v4',
 `email_account_id` int(11) DEFAULT NULL,
 `facebook_account_id` varchar(255) DEFAULT NULL,
 `google_account_id` varchar(255) DEFAULT NULL,
 `refresh_token` varchar(1024) NOT NULL,
 `logged_in_provider` varchar(45) DEFAULT NULL,
 PRIMARY KEY (`id`),
 UNIQUE KEY `id_UNIQUE` (`id`),
 UNIQUE KEY `email_account_id_UNIQUE` (`email_account_id`),
 UNIQUE KEY `facebook_account_id_UNIQUE` (`facebook_account_id`),
 UNIQUE KEY `google_account_id_UNIQUE` (`google_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
