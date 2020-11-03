const Offer = require('../Models/Offer');
const Driver = require('../Models/Driver');
const Vehicle = require('../Models/Vehicle')

const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const tag = 'Controllers::Offer';

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
        console.log('Get Vehicle Name Exception =>', e.message)
    }
})

exports.getDriverById = asyncHandler(async (req, res, next) => {
  try {
    let vehicles = [];

    await Driver.find({status: 'ACTIVE'})
        .then(vehicle => {
           for(let item of vehicle) {
               let items = {}
                  items.id = item._id;
                  items.fullName = item.fullName;
                  items.carName = item.carName;
                  items.carUrl = item.carUrl;
                  items.date = item.updatedAt;
             vehicles.push(items)
           }
        });

      const clientId = req.user._id;

      let offers = [];

      await Offer.find({clientId: clientId})
          .then(myOffer => {
              for (let item of myOffer) {
                  let items = {};
                  items.clientId = item.clientId;
                  items.vehicleId = item.vehicleId;
                  items.offerLocation = item.offerLocation;
                  items.offerTime = item.offerTime;
                  items.offerPrice = item.offerPrice;
                  items.offerStatus = item.offerStatus;
                  items.createdAt = item.createdAt;
                  offers.push(items)
              }
          })

    res.status(200).json({
        vehicles,
        offers
    })
  } catch (e) {
    console.log(tag, 'fetchDoctorById', e.message);
    next(e)
  }
});

exports.sentOffer = asyncHandler(async (req, res, next) => {
    try {
        let {vehicleId, offerLocation, offerGeocoder, offerTime} = req.body;
        const clientId = req.user._id;
        const clientName = req.user.fullName;

        let driver = await Driver.findById(vehicleId)

        if (!driver || driver.accountType !== 'Driver') {
            return next(new ErrorResponse('Driver doesn\'t exist', 404))
        }

        const offer =  await Offer.create({
            clientName: clientName,
            clientId: clientId,
            vehicleId: vehicleId,
            offerLocation: offerLocation,
            offerGeocoder: offerGeocoder,
            offerTime: offerTime,
        })

        await offer.save();

        let offers = [];

        await Offer.find({clientId: clientId})
            .then(myOffer => {
                for (let item of myOffer) {
                    let items = {};
                    items.clientId = item.clientId;
                    items.vehicleId = item.vehicleId;
                    items.offerLocation = item.offerLocation;
                    items.offerTime = item.offerTime;
                    items.offerStatus = item.offerStatus;
                    items.createdAt = item.createdAt;
                    offers.push(items)
                }
            })
        res.status(200).json({
            offers
        })
    } catch (e) {
        console.log('Sent Offer Exception =>',e.message);
        next(e)
    }
});
