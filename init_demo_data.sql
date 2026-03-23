USE sky_take_out;

SET NAMES utf8mb4;

-- Demo categories
INSERT INTO category (type, name, sort, status, create_time, update_time, create_user, update_user)
SELECT 1, 'Demo Hot', 10, 1, NOW(), NOW(), 1, 1
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM category WHERE name = 'Demo Hot'
);

INSERT INTO category (type, name, sort, status, create_time, update_time, create_user, update_user)
SELECT 1, 'Demo Drink', 20, 1, NOW(), NOW(), 1, 1
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM category WHERE name = 'Demo Drink'
);

INSERT INTO category (type, name, sort, status, create_time, update_time, create_user, update_user)
SELECT 2, 'Demo Setmeal', 30, 1, NOW(), NOW(), 1, 1
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM category WHERE name = 'Demo Setmeal'
);

-- Demo dishes
INSERT INTO dish (name, category_id, price, image, description, status, create_time, update_time, create_user, update_user)
SELECT 'Kung Pao Chicken', c.id, 28.00, '', 'Demo dish: Kung Pao Chicken', 1, NOW(), NOW(), 1, 1
FROM category c
WHERE c.name = 'Demo Hot'
  AND NOT EXISTS (
      SELECT 1 FROM dish WHERE name = 'Kung Pao Chicken'
  );

INSERT INTO dish (name, category_id, price, image, description, status, create_time, update_time, create_user, update_user)
SELECT 'Iced Black Tea', c.id, 6.00, '', 'Demo dish: Iced Black Tea', 1, NOW(), NOW(), 1, 1
FROM category c
WHERE c.name = 'Demo Drink'
  AND NOT EXISTS (
      SELECT 1 FROM dish WHERE name = 'Iced Black Tea'
  );

-- Demo flavors
INSERT INTO dish_flavor (dish_id, name, value)
SELECT d.id, 'Spice', '["mild","medium","hot"]'
FROM dish d
WHERE d.name = 'Kung Pao Chicken'
  AND NOT EXISTS (
      SELECT 1 FROM dish_flavor df
      WHERE df.dish_id = d.id AND df.name = 'Spice'
  );

INSERT INTO dish_flavor (dish_id, name, value)
SELECT d.id, 'Ice', '["no_ice","less_ice","regular"]'
FROM dish d
WHERE d.name = 'Iced Black Tea'
  AND NOT EXISTS (
      SELECT 1 FROM dish_flavor df
      WHERE df.dish_id = d.id AND df.name = 'Ice'
  );

-- Demo setmeal
INSERT INTO setmeal (category_id, name, price, status, description, image, create_time, update_time, create_user, update_user)
SELECT c.id, 'Demo Combo', 34.00, 1, 'Demo setmeal for API verification', '', NOW(), NOW(), 1, 1
FROM category c
WHERE c.name = 'Demo Setmeal'
  AND NOT EXISTS (
      SELECT 1 FROM setmeal WHERE name = 'Demo Combo'
  );

INSERT INTO setmeal_dish (setmeal_id, dish_id, name, price, copies)
SELECT s.id, d.id, d.name, d.price, 1
FROM setmeal s
JOIN dish d ON d.name = 'Kung Pao Chicken'
WHERE s.name = 'Demo Combo'
  AND NOT EXISTS (
      SELECT 1 FROM setmeal_dish sd
      WHERE sd.setmeal_id = s.id AND sd.dish_id = d.id
  );
