SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `setmeal_dish`;
DROP TABLE IF EXISTS `setmeal`;
DROP TABLE IF EXISTS `dish_flavor`;
DROP TABLE IF EXISTS `dish`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `employee`;

CREATE TABLE `employee` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `name` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'employee name',
  `username` varchar(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'username',
  `password` varchar(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'password',
  `phone` varchar(11) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'phone',
  `sex` varchar(2) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'sex',
  `id_number` varchar(18) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'id number',
  `status` int(11) NOT NULL DEFAULT 1 COMMENT '0 disabled, 1 enabled',
  `create_time` datetime NOT NULL COMMENT 'create time',
  `update_time` datetime NOT NULL COMMENT 'update time',
  `create_user` bigint(20) NOT NULL COMMENT 'create user',
  `update_user` bigint(20) NOT NULL COMMENT 'update user',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_username` (`username`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='employee';

INSERT INTO `employee` (
  `id`,
  `name`,
  `username`,
  `password`,
  `phone`,
  `sex`,
  `id_number`,
  `status`,
  `create_time`,
  `update_time`,
  `create_user`,
  `update_user`
) VALUES (
  1,
  '管理员',
  'admin',
  'e10adc3949ba59abbe56e057f20f883e',
  '13812345678',
  '1',
  '110101199001011009',
  1,
  '2022-02-15 15:51:20',
  '2022-02-17 09:16:20',
  1,
  1
);

CREATE TABLE `category` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `type` int(11) DEFAULT NULL COMMENT '1 dish category, 2 setmeal category',
  `name` varchar(64) COLLATE utf8_bin NOT NULL COMMENT 'category name',
  `sort` int(11) NOT NULL DEFAULT '0' COMMENT 'sort order',
  `status` int(11) DEFAULT NULL COMMENT '0 disabled, 1 enabled',
  `create_time` datetime DEFAULT NULL COMMENT 'create time',
  `update_time` datetime DEFAULT NULL COMMENT 'update time',
  `create_user` bigint(20) DEFAULT NULL COMMENT 'create user',
  `update_user` bigint(20) DEFAULT NULL COMMENT 'update user',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_category_name` (`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='category';

CREATE TABLE `dish` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `name` varchar(32) COLLATE utf8_bin NOT NULL COMMENT 'dish name',
  `category_id` bigint(20) NOT NULL COMMENT 'category id',
  `price` decimal(10,2) DEFAULT NULL COMMENT 'price',
  `image` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'image',
  `description` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'description',
  `status` int(11) DEFAULT '1' COMMENT '0 stopped, 1 enabled',
  `create_time` datetime DEFAULT NULL COMMENT 'create time',
  `update_time` datetime DEFAULT NULL COMMENT 'update time',
  `create_user` bigint(20) DEFAULT NULL COMMENT 'create user',
  `update_user` bigint(20) DEFAULT NULL COMMENT 'update user',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_dish_name` (`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='dish';

CREATE TABLE `dish_flavor` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `dish_id` bigint(20) NOT NULL COMMENT 'dish id',
  `name` varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT 'flavor name',
  `value` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'flavor values',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='dish flavor';

CREATE TABLE `setmeal` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `category_id` bigint(20) NOT NULL COMMENT 'category id',
  `name` varchar(32) COLLATE utf8_bin NOT NULL COMMENT 'setmeal name',
  `price` decimal(10,2) NOT NULL COMMENT 'price',
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

CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `openid` varchar(64) COLLATE utf8_bin NOT NULL COMMENT 'wechat openid',
  `name` varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT 'name',
  `phone` varchar(11) COLLATE utf8_bin DEFAULT NULL COMMENT 'phone',
  `sex` varchar(2) COLLATE utf8_bin DEFAULT NULL COMMENT 'sex',
  `id_number` varchar(18) COLLATE utf8_bin DEFAULT NULL COMMENT 'id number',
  `avatar` varchar(500) COLLATE utf8_bin DEFAULT NULL COMMENT 'avatar',
  `create_time` datetime DEFAULT NULL COMMENT 'create time',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_openid` (`openid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='user';

CREATE TABLE `shopping_cart` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `name` varchar(64) COLLATE utf8_bin DEFAULT NULL COMMENT 'item name',
  `image` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'image',
  `user_id` bigint(20) NOT NULL COMMENT 'user id',
  `dish_id` bigint(20) DEFAULT NULL COMMENT 'dish id',
  `setmeal_id` bigint(20) DEFAULT NULL COMMENT 'setmeal id',
  `dish_flavor` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'dish flavor',
  `number` int(11) NOT NULL DEFAULT '1' COMMENT 'quantity',
  `amount` decimal(10,2) NOT NULL COMMENT 'amount',
  `create_time` datetime DEFAULT NULL COMMENT 'create time',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_shopping_cart_user` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='shopping cart';

CREATE TABLE `address_book` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `user_id` bigint(20) NOT NULL COMMENT 'user id',
  `consignee` varchar(50) COLLATE utf8_bin NOT NULL COMMENT 'consignee',
  `sex` varchar(2) COLLATE utf8_bin DEFAULT NULL COMMENT 'sex',
  `phone` varchar(11) COLLATE utf8_bin NOT NULL COMMENT 'phone',
  `province_code` varchar(12) COLLATE utf8_bin DEFAULT NULL COMMENT 'province code',
  `province_name` varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT 'province name',
  `city_code` varchar(12) COLLATE utf8_bin DEFAULT NULL COMMENT 'city code',
  `city_name` varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT 'city name',
  `district_code` varchar(12) COLLATE utf8_bin DEFAULT NULL COMMENT 'district code',
  `district_name` varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT 'district name',
  `detail` varchar(255) COLLATE utf8_bin NOT NULL COMMENT 'detail address',
  `label` varchar(32) COLLATE utf8_bin DEFAULT NULL COMMENT 'label',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'default flag',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_address_book_user` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='address book';

CREATE TABLE `orders` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `number` varchar(50) COLLATE utf8_bin NOT NULL COMMENT 'order number',
  `status` int(11) NOT NULL COMMENT 'order status',
  `user_id` bigint(20) NOT NULL COMMENT 'user id',
  `address_book_id` bigint(20) NOT NULL COMMENT 'address book id',
  `order_time` datetime NOT NULL COMMENT 'order time',
  `checkout_time` datetime DEFAULT NULL COMMENT 'checkout time',
  `pay_method` int(11) DEFAULT NULL COMMENT 'pay method',
  `pay_status` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'pay status',
  `amount` decimal(10,2) NOT NULL COMMENT 'order amount',
  `remark` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'remark',
  `phone` varchar(11) COLLATE utf8_bin DEFAULT NULL COMMENT 'phone',
  `address` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'address',
  `consignee` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT 'consignee',
  `cancel_reason` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'cancel reason',
  `rejection_reason` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'rejection reason',
  `cancel_time` datetime DEFAULT NULL COMMENT 'cancel time',
  `estimated_delivery_time` datetime DEFAULT NULL COMMENT 'estimated delivery time',
  `delivery_status` tinyint(1) DEFAULT NULL COMMENT 'delivery status',
  `delivery_time` datetime DEFAULT NULL COMMENT 'delivery time',
  `pack_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'pack amount',
  `tableware_number` int(11) DEFAULT NULL COMMENT 'tableware number',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_orders_number` (`number`) USING BTREE,
  KEY `idx_orders_user` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='orders';

CREATE TABLE `order_detail` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `name` varchar(64) COLLATE utf8_bin DEFAULT NULL COMMENT 'item name',
  `image` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'image',
  `order_id` bigint(20) NOT NULL COMMENT 'order id',
  `dish_id` bigint(20) DEFAULT NULL COMMENT 'dish id',
  `setmeal_id` bigint(20) DEFAULT NULL COMMENT 'setmeal id',
  `dish_flavor` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT 'dish flavor',
  `number` int(11) NOT NULL DEFAULT '1' COMMENT 'quantity',
  `amount` decimal(10,2) NOT NULL COMMENT 'amount',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order_detail_order` (`order_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='order detail';

SET FOREIGN_KEY_CHECKS = 1;
