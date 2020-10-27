const Hospital = require('../Models/Hospital');
const User = require('../Models/User');
const Review = require('../Models/Review');
const Booking = require('../Models/Booking');

const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const tag = 'Controllers::UserDoctor';

/**
 * @route POST /userDoctor/:doctorId
 * @group UserDoctor
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not Found
 */
exports.getDriverById = asyncHandler(async (req, res, next) => {
  try {
    console.log('get Driver',req.params);
    const {id} = req.params;

    if (!id) {
      return res.json(400).json({
        success: false,
        error: 'Id is required'
      })
    }

    const dbDoctor = await User.findById(id);
    if (!dbDoctor || dbDoctor.accountType !== 'Doctor') {
      return next(new ErrorResponse('Doctor doesn\'t exist', 404))
    }

    let doctor = {
      avatarUrl: dbDoctor.avatarUrl,
      street: dbDoctor.street,
      city: dbDoctor.city,
      country: dbDoctor.country,
      fullName: dbDoctor.fullName,
      id: dbDoctor.id,
      language: dbDoctor.language,
      speciality: dbDoctor.speciality,
    };
    const dbReviews = await Review.find({
      doctor: doctor.id,
    });
    doctor.reviews = [];

    for (let dbReview of dbReviews) {
      let review = {
        rating: dbReview.rating,
        description: dbReview.description,
        createdAt: dbReview.createdAt,
      };
      let author = await User.findById(dbReview.author);
      review.author = {
        fullName: author.fullName,
        avatarUrl: author.avatarUrl,
        createdAt: author.createdAt,
      };
      doctor.reviews.push(review);
    }

    doctor.availableTime = {
      from: 8,
      to: 18,
    };
    doctor.hospital = {
      name: 'Abbey Road Hospital',
      location: 'ABC City, WonderCountry',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80',
        'https://cdn.pixabay.com/photo/2016/11/18/17/46/architecture-1836070__340.jpg',
        'https://archello.s3.eu-central-1.amazonaws.com/images/2018/10/11/Contemporary-Modern-House-Design-6.1539270983.8601.jpg',
        'https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80',
        'https://q4g9y5a8.rocketcdn.me/wp-content/uploads/2020/02/home-banner-2020-02-min.jpg'
      ]
    };

    res.status(200).json({
      doctor
    })

  } catch (e) {
    console.log(tag, 'fetchDoctorById', e.message);
    next(e)
  }
});
