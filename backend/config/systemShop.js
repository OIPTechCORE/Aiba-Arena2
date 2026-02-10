/**
 * System shop catalog: brokers, cars, and bikes sold by the system for AIBA.
 * Users buy from this catalog; a new item is created and assigned to them.
 */

const { CAR_CLASSES } = require('../models/RacingCar');
const { BIKE_CLASSES } = require('../models/RacingMotorcycle');

/** System broker types: id, name, intelligence, speed, risk, priceAiba */
const SYSTEM_BROKERS = [
    { id: 'scout', name: 'Scout', intelligence: 55, speed: 55, risk: 45, priceAiba: 50 },
    { id: 'pro', name: 'Pro', intelligence: 65, speed: 65, risk: 55, priceAiba: 120 },
    { id: 'elite', name: 'Elite', intelligence: 75, speed: 75, risk: 65, priceAiba: 250 },
    { id: 'champion', name: 'Champion', intelligence: 85, speed: 85, risk: 75, priceAiba: 500 },
];

/** System car types: id, name, carClass, topSpeed, acceleration, handling, durability, priceAiba */
const SYSTEM_CARS = [
    { id: 'touring', name: 'Touring Pro', carClass: 'touring', topSpeed: 55, acceleration: 52, handling: 58, durability: 55, priceAiba: 80 },
    { id: 'gt1', name: 'GT1 Racer', carClass: 'gt1', topSpeed: 62, acceleration: 58, handling: 60, durability: 55, priceAiba: 150 },
    { id: 'formula1', name: 'Formula 1', carClass: 'formula1', topSpeed: 70, acceleration: 68, handling: 72, durability: 50, priceAiba: 300 },
    { id: 'lemans', name: 'Le Mans Hypercar', carClass: 'lemans', topSpeed: 72, acceleration: 70, handling: 70, durability: 58, priceAiba: 400 },
];

/** System bike types: id, name, bikeClass, topSpeed, acceleration, handling, durability, priceAiba */
const SYSTEM_BIKES = [
    { id: 'supersport', name: 'Supersport 600', bikeClass: 'supersport', topSpeed: 52, acceleration: 55, handling: 60, durability: 52, priceAiba: 80 },
    { id: 'superbike', name: 'Superbike', bikeClass: 'superbike', topSpeed: 60, acceleration: 62, handling: 65, durability: 55, priceAiba: 150 },
    { id: 'motogp', name: 'MotoGP Racer', bikeClass: 'motogp', topSpeed: 68, acceleration: 70, handling: 72, durability: 50, priceAiba: 300 },
    { id: 'hyperTrack', name: 'Hyper Track', bikeClass: 'hyperTrack', topSpeed: 72, acceleration: 72, handling: 70, durability: 52, priceAiba: 400 },
];

function getSystemBroker(catalogId) {
    return SYSTEM_BROKERS.find((b) => b.id === catalogId) || null;
}

function getSystemCar(catalogId) {
    return SYSTEM_CARS.find((c) => c.id === catalogId) || null;
}

function getSystemBike(catalogId) {
    return SYSTEM_BIKES.find((b) => b.id === catalogId) || null;
}

module.exports = {
    SYSTEM_BROKERS,
    SYSTEM_CARS,
    SYSTEM_BIKES,
    getSystemBroker,
    getSystemCar,
    getSystemBike,
};
