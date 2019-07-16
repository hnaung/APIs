CREATE TABLE `UserProfile` (
 `user_id` varchar(36) NOT NULL,
 `display_email` varchar(255) NOT NULL,
 `display_first_name` varchar(255) NOT NULL,
 `display_last_name` varchar(255) NOT NULL,
 `phone_number` varchar(45) DEFAULT NULL,
 `display_picture` varchar(2048) DEFAULT NULL,
 `country_code` varchar(45) DEFAULT NULL,
 `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
 `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 `onboarding_preference` json DEFAULT NULL,
 `is_email_verified` tinyint(1) DEFAULT '0',
 `email_verified_date` datetime DEFAULT NULL,
 `date_of_birth` date DEFAULT NULL,
 PRIMARY KEY (`user_id`),
 UNIQUE KEY `user_id_UNIQUE` (`user_id`),
 UNIQUE KEY `display_email_UNIQUE` (`display_email`),
 CONSTRAINT `UserProfile_UserAccess_user_id` FOREIGN KEY (`user_id`) REFERENCES `UserAccess` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
