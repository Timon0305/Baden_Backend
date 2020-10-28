const Offer = require('../Models/Offer');
const Driver = require('../Models/Driver');

const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const tag = 'Controllers::Offer';

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
        let {vehicleId, offerLocation, offerTime} = req.body;
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
