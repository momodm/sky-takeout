USE sky_take_out;

DROP TABLE IF EXISTS `setmeal_dish`;
DROP TABLE IF EXISTS `setmeal`;

CREATE TABLE `setmeal` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `category_id` bigint(20) NOT NULL COMMENT 'category id',
  `name` varchar(32) COLLATE utf8_bin NOT NULL COMMENT 'setmeal name',
  `price` decimal(10,2) NOT NULL COMMENT 'setmeal price',
  `status` int(11) DEFAULT '1' COMMENT '0 disabled, 1 enabled',
  `description` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'description',
  `image` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'image',
  `create_time` datetime DEFAULT NULL COMMENT 'create time',
  `update_time` datetime DEFAULT NULL COMMENT 'update time',
  `create_user` bigint(20) DEFAULT NULL COMMENT 'create user',
  `update_user` bigint(20) DEFAULT NULL COMMENT 'update user',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_setmeal_name` (`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='setmeal';

CREATE TABLE `setmeal_dish` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `setmeal_id` bigint(20) DEFAULT NULL COMMENT 'setmeal id',
  `dish_id` bigint(20) DEFAULT NULL COMMENT 'dish id',
  `name` varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT 'dish name',
  `price` decimal(10,2) DEFAULT NULL COMMENT 'dish price',
  `copies` int(11) DEFAULT NULL COMMENT 'copies',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='setmeal dish';
