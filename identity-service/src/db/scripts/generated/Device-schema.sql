CREATE TABLE `Device` (
 `id` varchar(255) NOT NULL,
 `user_id` varchar(36) NOT NULL,
 `last_login` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`id`,`user_id`),
 UNIQUE KEY `user_id_UNIQUE` (`user_id`),
 CONSTRAINT `Device_UserAccess_id` FOREIGN KEY (`user_id`) REFERENCES `UserAccess` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
