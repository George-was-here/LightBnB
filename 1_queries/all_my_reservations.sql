SELECT reservations.id, properties.title, cost_per_night, reservations.start_date, AVG(property_reviews.rating) AS average_rating
FROM reservations
JOIN properties ON properties.id = property_id
JOIN property_reviews ON reservations.id = reservation_id
WHERE properties.owner_id = 1
GROUP BY reservations.id, properties.title, properties.cost_per_night
ORDER BY start_date desc
LIMIT 10;  