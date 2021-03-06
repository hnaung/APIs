CREATE TABLE `FacebookAccount` (
 `id` varchar(255) NOT NULL,
 `user_id` varchar(36) NOT NULL COMMENT 'Uuid v4',
 `email` varchar(255) NOT NULL,
 `first_name` varchar(255) NOT NULL,
 `last_name` varchar(255) NOT NULL,
 `picture` varchar(2048) DEFAULT NULL,
 `web_long_lived_token` varchar(255) DEFAULT NULL,
 `mobile_long_lived_token` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`id`),
 UNIQUE KEY `user_id_UNIQUE` (`user_id`),
 UNIQUE KEY `email_UNIQUE` (`email`),
 KEY `FacebookAccount_UserAccess_id_idx` (`user_id`),
 CONSTRAINT `FacebookAccount_UserAccess_user_id` FOREIGN KEY (`user_id`) REFERENCES `UserAccess` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
