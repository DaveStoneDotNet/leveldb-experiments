const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')

const schedulesJson = require('./schedules')
const recurringJson = require('./recurring')

const constants = require('./constants')

const schedulesDb = level('./schedules', {
    valueEncoding: 'json'
})
const recurringDb = level('./recurring', {
    valueEncoding: 'json'
})

// ----------------------------------------------------------------------------------

function seedSchedules() {

    forEachPromise(schedulesJson, insertSchedule)
        .then(() => {
            console.log('DONE');
        })
        .catch((err) => {
            console.log('ERROR', err);
        })
}

function forEachPromise(items, fn) {
    return items.reduce((promise, item) => {
        return promise.then(() => {
            return fn(item);
        });
    }, Promise.resolve());
}

function insertSchedule(jsonSchedule) {

    const encodedDbStartKey = getEncodedDbKey(jsonSchedule.start)

    return new Promise((resolve, reject) => {

        getNextDbKey(encodedDbStartKey)
            .then((nextDbKey, err) => {
                putSchedule(nextDbKey, jsonSchedule)
                    .then((putDbKey) => resolve(putDbKey))
                    .catch((putErr) => reject(putErr))
            })
            .catch((err) => {
                console.log('GET NEXT KEY ERROR', err)
                reject(err)
            })

    })

}

// ----------------------------------------------------------------------------------

function getUnixKey(dbKey) {
    return bytewise.decode(dbKey)
}

function getDbKey(unixKey) {
    return bytewise.encode(unixKey).toString()
}

function getNextDbKey(encodedDbStartKey) {

    let nextUnixKey = encodedDbStartKey
    const encodedDbEndKey = getNextSecondEncodedDbKey(encodedDbStartKey)

    return new Promise((resolve, reject) => {
        getSchedules(encodedDbStartKey, encodedDbEndKey)                          // encodedDbStartKey, encodedDbEndKey
            .then((jsonSchedules, err) => {

                if (err) { console.log('LIST SCHEDULE ERROR', err) }

                // If any schedules exist in the provided one-second time-frame, 
                // get the last one and increment it by one. Otherwise, just 
                // return the DbKey version of the 'unixKey' provided.

                // if (jsonSchedules && jsonSchedules.size > 0) {
                //     nextUnixKey = getUnixKey([...jsonSchedules.keys()].sort().pop()) + 1 // CAUTION: The key is returned as a STRING
                // }

                const nextDbKey = encodedDbStartKey

                resolve(nextDbKey)

            })
            .catch((err) => {
                reject(err)
            })
    })

}

function unixKeyToDateTimeText(unixKey) {
    return moment(unixKey).format(constants.MILLISECONDFORMAT)
}

function unixKeyFromDateTimeText(dateTimeText) {
    return moment(dateTimeText, constants.MILLISECONDFORMAT).valueOf()
}

// ----------------------------------------------------------------------------------

function putSchedule(dbKey, jsonSchedule) {

    const validatedDbKey = getDbKey(dbKey)

    return new Promise((resolve, reject) => {
        schedulesDb.put(validatedDbKey, jsonSchedule, (err) => {
            if (err) {
                console.log('PUT ERROR', err)
                reject(err)
            }
            resolve(validatedDbKey)
        })
    })

}

function getSchedule(encodedDbKey) {

    return new Promise((resolve, reject) => {
        schedulesDb.get(encodedDbKey, (err, value) => {
            if (err) {
                if (err.notFound) {
                    resolve({
                        exists: false
                    })
                } else {
                    console.log('GET ERROR', err)
                    resolve({
                        exists: false,
                        err: err
                    })
                }
            }
            resolve({
                exists: true,
                jsonSchedule: value
            })
        })
    })

}

function getNextSecondEncodedDbKey(encodedDbKey) {
    return getEncodedDbKey(getDecodedDbKeyMoment(encodedDbKey).add(1, 'ms'))      // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< BUG
}

function getSchedules(encodedDbStartKey, encodedDbEndKey) {

    let options = {}
    if (encodedDbStartKey) {

        if (!encodedDbEndKey) {
            encodedDbEndKey = getNextSecondEncodedDbKey(encodedDbStartKey)
        }

        console.log(`DB SEARCH KEYS: ${encodedDbStartKey} : ${encodedDbEndKey} : ${getDecodedDbKeyDateText(encodedDbStartKey)} : ${getDecodedDbKeyDateText(encodedDbEndKey)}`)

        options = {
            gte: encodedDbStartKey,
            lt:  encodedDbEndKey
        }
    }

    return new Promise((resolve, reject) => {
        const schedules = new Map()
        schedulesDb.createReadStream(options)
            .on('data', (jsonSchedule) => {
                const decodedDbKey = getDecodedDbKeyDateText(jsonSchedule.key)
                console.log(`DB RESULT KEYS: ${jsonSchedule.key} : ${decodedDbKey}`)
                schedules.set(jsonSchedule.key, jsonSchedule.value)
            })
            .on('error', (err) => {
                reject(err)
            })
            .on('end', () => {
                resolve(schedules)
            })
    })

}

function delSchedule(dbKey) {

    return new Promise((resolve, reject) => {
        schedulesDb.del(dbKey, (err, value) => {
            if (err) {
                console.log('GET ERROR', err)
                reject(err)
            }
            resolve(dbKey)
        })
    })

}

function updateSchedule(dbKey, jsonSchedule) {

    const validatedDbKey = getDbKey(dbKey)

    return new Promise((resolve, reject) => {

        delSchedule(validatedDbKey)
            .then((deletedDbKey) => {
                putSchedule(deletedDbKey, jsonSchedule)
                    .then((putDbKey) => {
                        resolve(jsonSchedule)
                    })
                    .catch((err) => {
                        reject(err)
                    })
            })
            .catch((err) => {
                reject(err)
            })
    })

}


function getEncodedDbKey(dateTime) {
    if (typeof dateTime === 'string') { return bytewise.encode(moment(dateTime, constants.MILLISECONDFORMAT).toDate()) }
    if (moment.isMoment(dateTime)) { return bytewise.encode(dateTime.toDate()) }
    return bytewise.encode(dateTime)
}

/**
 * Returns date text in millisecond format. e.g. '10/06/2017 07:00:0.0001 PM'
 * @param {*} encodedDbKey 
 */
function getDecodedDbKeyDateText(encodedDbKey) {
    return moment(bytewise.decode(encodedDbKey)).format(constants.MILLISECONDFORMAT)
}

function getDecodedDbKeyMoment(encodedDbKey) {
    return moment(bytewise.decode(encodedDbKey))
}

function tester() {

    // ---
    const d1 = '10/06/2017 07:00 PM'
    const m1 = moment(d1, constants.MILLISECONDFORMAT).toDate()
    const e1 = bytewise.encode(m1)
    // ---
    const e2 = bytewise.decode(e1)
    const m2 = moment(e2)
    const d2 = m2.add(1, 'ms').format(constants.MILLISECONDFORMAT)
    // ---

    const t1 = getEncodedDbKey('10/06/2017 07:00 PM')
    const t2 = getDecodedDbKeyDateText(t1)

    // ---
    const x1 = getEncodedDbKey('10/06/2017 07:00 PM')
    const x2 = getEncodedDbKey(moment('10/06/2017 07:00 PM', constants.MILLISECONDFORMAT))
    const x3 = getEncodedDbKey(moment('10/06/2017 07:00 PM', constants.MILLISECONDFORMAT).toDate())
    // ---
    const y1 = getDecodedDbKeyDateText(x1).valueOf()
    const y2 = getDecodedDbKeyDateText(x2).valueOf()
    const y3 = getDecodedDbKeyDateText(x3).valueOf()
    // ---
    
}

function main() {

    seedSchedules()
    //tester()

    // console.log(unixKeyToDateTimeText(1507584632692))
    // console.log(unixKeyToDateTimeText(1507584600000))
    // console.log(unixKeyToDateTimeText(1507584600001))

    // ----------------------------------------------------------------------------------
    // PUT
    // ----------------------------------------------------------------------------------

    // const jsonSchedule = schedulesJson[0]
    // const unixKey = moment(jsonSchedule.start, constants.MILLISECONDFORMAT).valueOf()

    // putSchedule(unixKey, jsonSchedule)
    //     .then((unixKey, err) => { console.log('PUT COMPLETE')   })
    //     .catch((err)         => { console.log('PUT ERROR', err) })

    // ----------------------------------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------------------------------

    // const jsonSchedule = schedulesJson[0]
    // const unixKey = moment(jsonSchedule.start, constants.MILLISECONDFORMAT).valueOf()

    // jsonSchedule.name = 'UPDATED NAME 222'

    // updateSchedule(unixKey, jsonSchedule)
    //     .then((unixKey, err) => { console.log('UPDATE COMPLETE')   })
    //     .catch((err)         => { console.log('UPDATE ERROR', err) })

    // ----------------------------------------------------------------------------------
    // GET
    // ----------------------------------------------------------------------------------

    // const jsonSchedule = schedulesJson[0]
    // const unixKey = moment(jsonSchedule.start, constants.MILLISECONDFORMAT).valueOf()

    // getSchedule(unixKey)
    //     .then((response, err) => {
    //         if (err) console.log('GET SCHEDULE ERROR', err)
    //         if (response.exists) {
    //             console.log('GET COMPLETE:', response.jsonSchedule)
    //         } else {
    //             console.log('GET COMPLETE:', `${unixKey} DOES NOT EXIST`)
    //         }
    //     })
    //     .catch((err) => { console.log('GET ERROR', err) })

    // ----------------------------------------------------------------------------------
    // DEL
    // ----------------------------------------------------------------------------------

    // const jsonSchedule = schedulesJson[0]
    // const unixKey = moment(jsonSchedule.start, constants.MILLISECONDFORMAT).valueOf()

    // delSchedule(unixKey)
    //     .then((jsonSchedule, err) => {
    //         if (err) console.log('DEL SCHEDULE ERROR', err)
    //         console.log('DEL COMPLETE', jsonSchedule)
    //     })
    //     .catch((err) => { console.log('DEL ERROR', err)})

    // ----------------------------------------------------------------------------------
    // LIST
    // ----------------------------------------------------------------------------------

    // const encodedDbStartKey = getEncodedDbKey('10/06/2017 07:00 PM')
    // const encodedDbEndKey = getEncodedDbKey('10/06/2018 08:00 PM')

    // getSchedules()
    //     .then((jsonSchedules, err) => {
    //         if (err) console.log('LIST SCHEDULE ERROR', err)
    //         jsonSchedules.forEach((value, key) => console.log(`LIST KEY: ${key} : ${typeof key} : VALUE: ${value.start} : ${value.name}`))
    //     })
    //     .catch((err) => { console.log('LIST ERROR', err) })

    // ----------------------------------------------------------------------------------
    // GET NEXT KEY
    // ----------------------------------------------------------------------------------

    // const unixStartKey = moment('10/06/2017 07:00 PM', constants.MILLISECONDFORMAT).valueOf()

    // getNextDbKey(unixStartKey)
    //     .then((nextUnixKey, err) => {
    //         if (err) console.log('GET NEXT KEY ERROR', err)
    //         console.log('GET NEXT KEY COMPLETE', nextUnixKey)
    //     })
    //     .catch((err) => { console.log('GET NEXT KEY ERROR', err) })

    // ----------------------------------------------------------------------------------
    // SEED
    // ----------------------------------------------------------------------------------

    //seedSchedules()
}

main()


module.exports = {
    seedSchedules,
    forEachPromise,
    insertSchedule,
    getUnixKey,
    getDbKey,
    getNextDbKey,
    putSchedule,
    getSchedule,
    getSchedules,
    delSchedule,
    updateSchedule
}