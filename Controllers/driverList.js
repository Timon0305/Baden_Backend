const Offer = require('../Models/Offer');
const Driver = require('../Models/Driver');
const Vehicle = require('../Models/Vehicle')

const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const distance = require('google-distance-matrix');
distance.key('AIzaSyD8LVZs12SZOf5za-1Z5x3CqKrQ3oVCesY');
distance.units('imperial');

const tag = 'Controllers::Offer';

exports.getVehicleName = asyncHandler(async (req, res, next) => {
    try {
        let vehicles = [];
        let i = 0;
       const dbVehicle =  await Vehicle.find({status: 'ACTIVE'});
       const dbDriver = await Driver.find({status: 'ACTIVE'});
       for (let item of dbVehicle) {
           let vehicleData = {}
           const vehicleId = item._id;
           for (let driverItem of dbDriver) {
              if (await vehicleId.toString() === driverItem.carName.toString()) {
                  i++;
               }
           }
          vehicleData.id = vehicleId;
          vehicleData.name = item.fullName;
          vehicleData.carUrl = item.carUrl
          vehicleData.number = i;
          await vehicles.push(vehicleData)
           i = 0
       }
        res.status(200).json({
            vehicles
        })
    } catch (e) {
        console.log('Get Vehicle Name Exception =>', e.message)
    }
})

exports.getDriverById = asyncHandler(async (req, res, next) => {
  let {vehicleId, geoCoder} = req.body;
  const origins = [geoCoder.split(',')[0] + ',' + geoCoder.split(',')[1]];
  const mode = 'DRIVING';
  console.log(vehicleId, geoCoder)
    try {
        const dbVehicleName = await Vehicle.findOne({_id: vehicleId})
        let vehicles = [];
        const dbVehicle = await Driver.find({carName: vehicleId, status: 'ACTIVE'});
        for (let i = 0; i < dbVehicle.length; i++) {
            const destinations = [dbVehicle[i]['location']];
            try {
                let distanceRes = await getDistance(origins, destinations, mode);
                if (distanceRes.success) {
                    vehicles.push({
                        id: dbVehicle[i]['_id'],
                        carUrl : dbVehicle[i]['carUrl'],
                        name: dbVehicle[i]['fullName'],
                        vehicleName: dbVehicleName.fullName,
                        address: dbVehicle[i]['address'],
                        location: dbVehicle[i]['location'],
                        distance : distanceRes.data.distance.value.toString(),
                        duration: distanceRes.data.duration.text,
                    })
                }
            } catch (exp) {
                console.log(exp.message)
            }
        }
        vehicles.sort((a, b) => {
            return parseInt(a.distance) - parseInt(b.distance)
        });
        res.status(200).json({
            vehicles
        });
  } catch (e) {
    console.log(tag, 'fetchDoctorById', e.message);
    next(e)
  }
});

let getDistance = async (origins, destinations, mode) => {
    return new Promise(async (resolve, reject) => {
        let result = {
            success : false,
            data: null
        };
        try {
            distance.matrix(origins, destinations, mode, (err, distances) => {
                if (!err) {
                    result.success = true;
                    result.data = distances.rows[0].elements[0];
                    resolve(result)
                } else {
                    result.data = err;
                    resolve(result)
                }
            })
        } catch (e) {
            console.log('distance exception', e.message)
            result.data = e.message;
            resolve(result)
        }
    })
}

exports.sentOffer = asyncHandler(async (req, res, next) => {
    try {
        let {vehicleId, offerLocation, offerGeocoder, offerTime, spendingTime} = req.body;
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
            spendingTime: spendingTime,
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
