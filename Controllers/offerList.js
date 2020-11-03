const Driver = require('../Models/Driver');
const Offer = require('../Models/Offer');
const Vehicle = require('../Models/Vehicle');

const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const tag = 'Controllers::OfferDoctor';
/** Find a hospital by doctor's id
 * @route GET /OfferDoctor/:id/hospital
 * @group OfferDoctor
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 */
exports.getVehicleName = asyncHandler(async (req, res, next) => {
  try {
    let vehicles = [];
    await Vehicle.find({status: 'ACTIVE'})
        .then(dbVehicle => {
          for (let item of dbVehicle) {
            let items = {}
            items.id = item._id;
            items.fullName = item.fullName;
            vehicles.push(items)
          }
        })
    res.status(200).json({
      vehicles
    })
  } catch (e) {
    console.log('Get Vehicle Name Exception =>', e.message);
    next(e)
  }
});

/**
 * @route GET /OfferDoctor/:id/review
 * @group OfferDoctor
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 */
exports.getReviews = asyncHandler(async (req, res, next) => {
  try {
    const {id} = req.params;
    if (!id) {
      return next(new ErrorResponse('DoctorId is required', 400))
    }

    const doctor = await Offer.findById(id);
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
 * @route POST /OfferDoctor/:id/review
 * @group OfferDoctor
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

    let doctor = await Offer.findById(id);
    if (!doctor || doctor.accountType !== 'Doctor') {
      return next(new ErrorResponse('Doctor doesn\'t exist', 404))
    }

    const review = await Review.create({
      doctor: doctor,
      author: req.Offer,
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
 * @route POST /OfferDoctor/:id/booking
 * @group OfferDoctor
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

    let doctor = await Offer.findById(id);
    if (!doctor || doctor.accountType !== 'Doctor') {
      return next(new ErrorResponse('Doctor doesn\'t exist', 404))
    }

    let _booking = await Booking.find({
      Offer: req.Offer.id,
      doctor: id,
      timestamp: timestamp
    });

    if (_booking) {
      return next(new ErrorResponse('Booking already exists!', 400))
    }

    const booking = await Booking.create({
      Offer: req.Offer,
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
 * @route DELETE /OfferDoctor/:id/booking
 * @group OfferDoctor
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
 * @route POST /OfferDoctor/searchDoctorsByCategory
 * @group OfferDoctor
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

    let dbDoctors = await Offer.find({
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
 * @route POST /OfferDoctor/searchDoctors
 * @group OfferDoctor
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

    let dbDoctors = await Offer.find(query);

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
 * @route POST /OfferDoctor/:doctorId
 * @group OfferDoctor
 * @param {string} id.params.required
 * @returns {object} 200 - {}
 * @returns {object} 404 - Not Found
 */
exports.getOfferById = asyncHandler(async (req, res, next) => {
  try {
    const {id} = req.user;
    if (!id) {
      return res.json(400).json({
        success: false,
        error: 'Id is required'
      })
    }

    const dbOffer = await Offer.find({vehicleId: id});
    if (!dbOffer ) {
      return next(new ErrorResponse('Offer doesn\'t exist', 404))
    }

    let offers = [];
    for (let item of dbOffer) {
        let items = {}
        items.clientName = item.clientName;
        items.clientId = item.clientId;
        items.offerLocation = item.offerLocation;
        items.offerGeocoder = item.offerGeocoder;
        items.offerTime = item.offerTime;
        items.offerPrice = item.offerPrice;
        items.offerStatus = item.offerStatus;
        offers.push(items)
    }

    res.status(200).json({
      offers
    })

  } catch (e) {
    console.log(tag, 'fetchOfferById', e.message);
    next(e)
  }
});

exports.setOfferPrice = asyncHandler(async (req, res, next) => {
  try {
    const {id} = req.user;
    if (!id) {
      return res.json(400).json({
        success: false,
        error: 'Id is required'
      })
    }
    const {offerId, offerPrice} = req.body;

    const dbOfferOne = await Offer.findOne({clientId: offerId, vehicleId: id})
    dbOfferOne.offerPrice = offerPrice;
    dbOfferOne.offerStatus = 'Response';
    await dbOfferOne.save();

    const dbOffer = await Offer.find({vehicleId: id});
    let offers = [];
    for (let item of dbOffer) {
      let items = {}
      items.clientName = item.clientName;
      items.clientId = item.clientId;
      items.offerLocation = item.offerLocation;
      items.offerGeocoder = item.offerGeocoder;
      items.offerTime = item.offerTime;
      items.offerPrice = item.offerPrice;
      items.offerStatus = item.offerStatus;
      offers.push(items)
    }
    console.log(offers)
    res.status(200).json({
      offers
    })
  } catch (err) {
    console.log('Sent Offer Price Exception =>', err.message);
    next(err)
  }
})
