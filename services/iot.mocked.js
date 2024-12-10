const SENSORS = {
    'sensor-1': {
        name: 'Living Room',
        description: 'Basic sensor in the middle of the living room.',
        groupName: 'Level 1',
        location: {
            "x": 1.2737443865427096,
            "y": 6.16515857059915,
            "z": -5.1788058280944895
        },
        objectId: 4252
    },
    // 'sensor-2': {
    //     name: 'Dining Table',
    //     description: 'Basic sensor at the dining table.',
    //     groupName: 'Level 1',
    //     location: {
    //         "x": 1.2737443865427096,
    //         "y": 6.16515857059915,
    //         "z": -5.1788058280944895
    //     },
    //     objectId: 4252
    // },
    // 'sensor-3': {
    //     name: 'Kitchen',
    //     description: 'Basic sensor in the kitchen.',
    //     groupName: 'Level 1',
    //     location: {
    //         "x": 1.2737443865427096,
    //         "y": 6.16515857059915,
    //         "z": -5.1788058280944895
    //     },
    //     objectId: 4252
    // },
    // 'sensor-4': {
    //     name: 'Bedroom',
    //     description: 'Basic sensor in the bedroom.',
    //     groupName: 'Level 1',
    //     location: {
    //         "x": -6.158405517712083,
    //         "y": 5.704175612634568,
    //         "z": -5.178805828094482
    //     },
    //     objectId: 4252
    // }
};

const CHANNELS = {
    'temp': {
        name: 'Temperature',
        description: 'External temperature in degrees Celsius.',
        type: 'double',
        unit: '°C',
        min: 18.0,
        max: 28.0
    },
    'co2': {
        name: 'CO₂',
        description: 'Level of carbon dioxide.',
        type: 'double',
        unit: 'ppm',
        min: 482.81,
        max: 640.00
    }
};

async function getSensors() {
    return SENSORS;
}

async function getChannels() {
    return CHANNELS;
}

async function getSamples(timerange, resolution = 32) {
    return {
        count: resolution,
        timestamps: generateTimestamps(timerange.start, timerange.end, resolution),
        data: {
            'sensor-1': {
                'temp': generateRandomValues(18.0, 28.0, resolution, 1.0),
                'co2': generateRandomValues(540.0, 600.0, resolution, 5.0)
            },
            'sensor-2': {
                'temp': generateRandomValues(20.0, 24.0, resolution, 1.0),
                'co2': generateRandomValues(540.0, 600.0, resolution, 5.0)
            },
            'sensor-3': {
                'temp': generateRandomValues(24.0, 28.0, resolution, 1.0),
                'co2': generateRandomValues(500.0, 620.0, resolution, 5.0)
            },
            'sensor-4': {
                'temp': generateRandomValues(20.0, 24.0, resolution, 1.0),
                'co2': generateRandomValues(600.0, 640.0, resolution, 5.0)
            }
        }
    };
}

function generateTimestamps(start, end, count) {
    const delta = Math.floor((end.getTime() - start.getTime()) / (count - 1));
    const timestamps = [];
    for (let i = 0; i < count; i++) {
        timestamps.push(new Date(start.getTime() + i * delta));
    }
    return timestamps;
}

function generateRandomValues(min, max, count, maxDelta) {
    const values = [];
    let lastValue = min + Math.random() * (max - min);
    for (let i = 0; i < count; i++) {
        values.push(lastValue);
        lastValue += (Math.random() - 0.5) * 2.0 * maxDelta;
        if (lastValue > max) {
            lastValue = max;
        }
        if (lastValue < min) {
            lastValue = min;
        }
    }
    return values;
}

module.exports = {
    getSensors,
    getChannels,
    getSamples
};
