const express = require('express');
const router = express.Router();
const cors = require('cors');

const {
  login,
  logout,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../Controllers/admin');

const { registered } = require('../middleware/auth');

//----------------------------------------------------------
// @endpoint    POST, OPTIONS /user/login
router
  .route('/login')
  .post(login);

router
  .route('/login')
  .post(logout);

router
  .route('/users')
  .get(registered, getUsers)
  .put(registered, createUser);

router
  .route('/users/:id')
  .post(registered, updateUser)
  .delete(registered, deleteUser);

router
  .route('/vehicles')
  .get(registered, getVehicle)
  .put(registered, createVehicle);

router
  .route('/vehicles/:id')
  .post(registered, updateVehicle)
  .delete(registered, deleteVehicle);


module.exports = router;


