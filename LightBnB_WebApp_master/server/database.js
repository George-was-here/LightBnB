/* eslint-disable camelcase */
const properties = require('./json/properties.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
//-----------NEW REFACTORED CODE BELOW----------------//
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// }
// exports.getUserWithId = getUserWithId;
//-----------NEW REFACTORED CODE BELOW----------------//
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};


exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
//-----------NEW REFACTORED CODE BELOW----------------//
const addUser = function(user) {
  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3)
    RETURNING *;`, [user.name, user.email, user.password])
    .then((res) => {
      return res.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(` SELECT reservations.id, properties.title, cost_per_night, reservations.start_date, AVG(property_reviews.rating) AS average_rating, properties.thumbnail_photo_url, properties.cover_photo_url, properties.number_of_bedrooms, properties.number_of_bathrooms, properties.parking_spaces
  FROM reservations
  JOIN properties ON properties.id = property_id
  JOIN property_reviews ON reservations.id = reservation_id
  WHERE properties.owner_id = $2
  GROUP BY reservations.id, properties.title, properties.cost_per_night, properties.thumbnail_photo_url, properties.cover_photo_url, properties.number_of_bedrooms, properties.number_of_bathrooms, properties.parking_spaces
  ORDER BY start_date desc LIMIT $1;`, [limit, guest_id])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.getAllReservations = getAllReservations;

const buildAllPropertiesQuery = (options) => {
  const select = 'properties.id, title, cost_per_night, avg(property_reviews.rating) as average_rating, properties.thumbnail_photo_url, properties.cover_photo_url, properties.number_of_bedrooms, properties.number_of_bathrooms, properties.parking_spaces';
  const from = 'properties';
  const join = 'property_reviews ON properties.id = property_id';
  const groupBy = 'properties.id, properties.thumbnail_photo_url, properties.cover_photo_url, properties.number_of_bedrooms, properties.number_of_bathrooms, properties.parking_spaces';
  const orderBy = 'cost_per_night';
  const where = [];
  let having;

  if (options.city) {
    where.push(`city LIKE '%${options.city}%'`);
  }

  if (options.minimum_price_per_night) {
    where.push(`cost_per_night >= ${options.minimum_price_per_night}`);
  }

  if (options.maximum_price_per_night) {
    where.push(`cost_per_night <= ${options.maximum_price_per_night}`);
  }

  if (options.minimum_rating) {
    having = `AVG(property_reviews.rating) >= ${options.minimum_rating}`;
  }

  if (options.owner_id) {
    where.push(`owner_id = ${options.owner_id}`);
  }

  let query = `SELECT ${select}
  FROM ${from}
  LEFT JOIN ${join}`;

  if (where.length > 0) {
    query += ` WHERE ${where.join(' AND ')}`;
  }

  query += ` GROUP BY ${groupBy}`;

  if (having) {
    query += ` HAVING ${having}`;
  }

  query +=  ` ORDER BY ${orderBy}`;

  query += ' LIMIT $1;';


  return query;
};

/// Properties
const getAllProperties = (options, limit = 10) => {
  return pool
    .query(buildAllPropertiesQuery(options), [limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

exports.addProperty = addProperty;