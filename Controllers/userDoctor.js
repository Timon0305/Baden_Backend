const Hospital = require('../Models/Hospital');
const User = require('../Models/User');
const Review = require('../Models/Review');
const Booking = require('../Models/Booking');

const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const tag = 'Controllers::UserDoctor';
/** Find a hospital by doctor's id
 * @route GET /userDoctor/:id/hospital
 * @group UserDoctor
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 */
exports.getHospital = asyncHandler(async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id) {
      return next(new ErrorResponse('DoctorId is required', 400))
    }

    const doctor = await User.findById(id);
    if (!doctor) {
      return next(new ErrorResponse('Doctor doesn\'t exist', 404))
    }

    // console.log(hospital);
    const hospital = await Hospital.findById(doctor.hospital);

    if (!hospital) {
      return next(new ErrorResponse('Doctor doesn\'t have any hospital', 404))
    }

    res.status(200).json({
      ...hospital
    })
  } catch (e) {
    next(e)
  }
});

/**
 * @route GET /userDoctor/:id/review
 * @group UserDoctor
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 */
exports.getReviews = asyncHandler(async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id) {
      return next(new ErrorResponse('DoctorId is required', 400))
    }

    const doctor = await User.findById(id);
    if (!doctor || doctor.accountType !== 'Doctor') {
      return next(new ErrorResponse('Doctor doesn\'t exist', 404))
    }

    // console.log(hospital);
    const reviews = await Review.find({doctor: doctor.id});

    if (!reviews) {
      return next(new ErrorResponse('Doctor doesn\'t have any reviews', 404))
    }
    res.status(200).json(
      reviews
    )
  } catch (e) {
    next(e)
  }
});

/**
 * @route POST /userDoctor/:id/review
 * @group UserDoctor
 * @param {string} id.params.required
 * @param {string} medicineName.body.required
 * @param {string} dosage.body.required
 * @param {string} frequency.body.required
 * @param {number} timeToTake.body.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not found
 */
exports.createReview = asyncHandler(async (req, res, next) => {
  try {
    const {rating, description} = req.body;
    const {id} = req.params;

    let doctor = await User.findById(id);
    if (!doctor || doctor.accountType !== 'Doctor') {
      return next(new ErrorResponse('Doctor doesn\'t exist', 404))
    }

    const review = await Review.create({
      doctor: doctor,
      author: req.user,
      rating,
      description
    });

    await review.save();

    res.status(200).json({
      ...review
    })
  } catch (e) {
    next(e)
  }
});

/**
 * @route POST /userDoctor/:id/booking
 * @group UserDoctor
 * @param {string} id.params.required
 * @param {string} medicineName.body.required
 * @param {string} dosage.body.required
 * @param {string} frequency.body.required
 * @param {number} timeToTake.body.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not found
 */
exports.requestBooking = asyncHandler(async (req, res, next) => {
  try {
    const {timestamp} = req.body;
    const {id} = req.params;

    if (!id || !timestamp) {
      return next(new ErrorResponse('Doctor Id and Timestamp are required', 400))
    }

    let doctor = await User.findById(id);
    if (!doctor || doctor.accountType !== 'Doctor') {
      return next(new ErrorResponse('Doctor doesn\'t exist', 404))
    }

    let _booking = await Booking.find({
      user: req.user.id,
      doctor: id,
      timestamp: timestamp
    });

    if (_booking) {
      return next(new ErrorResponse('Booking already exists!', 400))
    }

    const booking = await Booking.create({
      user: req.user,
      doctor,
      timestamp
    });

    await booking.save();

    res.status(200).json({
      booking
    })
  } catch (e) {
    next(e)
  }
});

/**
 * @route DELETE /userDoctor/:id/booking
 * @group UserDoctor
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not Found
 */
exports.cancelBooking = asyncHandler(async (req, res, next) => {
  try {
    const {id} = req.params;

    let booking = await Booking.findById(id);
    if (!booking) {
      return next(new ErrorResponse('Booking doesn\'t exist', 404))
    }


    res.status(200).json({})
  } catch (e) {
    next(e)
  }
});

/**
 * @route POST /userDoctor/searchDoctorsByCategory
 * @group UserDoctor
 * @param {string} category.body.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not Found
 */
exports.searchDoctorsByCategory = asyncHandler(async (req, res, next) => {
  try {
    const {category} = req.body;

    if (!category) {
      return res.json(400).json({
        success: false,
        error: 'Category is required'
      })
    }

    let dbDoctors = await User.find({
      accountType: 'Doctor',
      speciality: category,
      status: 'ACTIVE',
    });

    let doctors = [];
    for (let dbDoctor of dbDoctors) {
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
      doctor.reviews = await Review.find({doctor: dbDoctor.id});
      doctor.availableTime = {
        from: 8,
        to: 18,
      };
      doctors.push(doctor);
    }

    res.status(200).json({
      doctors
    })

  } catch (e) {
    next(e)
  }
});

/**
 * @route POST /userDoctor/searchDoctors
 * @group UserDoctor
 * @param {string} category.body.optional
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not Found
 */
exports.searchDoctors = asyncHandler(async (req, res, next) => {
  try {
    const {name, speciality, address} = req.body;

    console.log(req.body);
    let query = {
      accountType: 'Doctor',
      status: 'ACTIVE'
    };

    if (name) {
      query.fullName = {
        "$regex": name,
        "$options": "i"
      }
    }

    if (speciality) {
      query.speciality = speciality;
    }

    if (address) {

    }

    let dbDoctors = await User.find(query);

    let doctors = [];
    for (let dbDoctor of dbDoctors) {
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
      doctor.reviews = await Review.find({doctor: dbDoctor.id});
      doctor.availableTime = {
        from: 8,
        to: 18,
      };
      doctors.push(doctor);
    }

    res.status(200).json({
      doctors
    })

  } catch (e) {
    console.log(tag, e.message);
    next(e)
  }
});

/**
 * @route POST /userDoctor/:doctorId
 * @group UserDoctor
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not Found
 */
exports.getDoctorById = asyncHandler(async (req, res, next) => {
  try {
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
