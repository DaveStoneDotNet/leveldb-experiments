const level = require('level')
const moment = require('moment')

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

    const unixKey = moment(jsonSchedule.start, constants.DATETIMEFORMAT).valueOf()

    return new Promise((resolve, reject) => {

        getNextDbKey(unixKey)
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

    if (typeof dbKey === 'number') { return dbKey }
    if (typeof dbKey !== 'string') { throw new Error('NOT A STRING') }
    return dbKey.startsWith('0') ? -(dbKey.substring(1)) : Number(dbKey.substring(1))
}

function getDbKey(unixKey) {
    return typeof unixKey === 'number' ? (unixKey < 0 ? `0${(-unixKey).toString().padStart(constants.DBKEYPADDING, '0')}` : `1${unixKey.toString().padStart(constants.DBKEYPADDING, '0')}`) : unixKey
}

function getUnixDate(unixKey) {
    return 'TODO'
}

function getNextDbKey(unixKey) {

    const validatedUnixKey = getUnixKey(unixKey)

    let nextUnixKey = validatedUnixKey
    const unixStartKey = validatedUnixKey
    const unixEndKey = unixStartKey + constants.SECOND

    return new Promise((resolve, reject) => {
        getSchedules(unixStartKey, unixEndKey)
            .then((jsonSchedules, err) => {

                if (err) { console.log('LIST SCHEDULE ERROR', err) }

                if (jsonSchedules && jsonSchedules.size > 0) {
                    nextUnixKey = getUnixKey([...jsonSchedules.keys()].sort().pop()) + 1 // CAUTION: The key is returned as a STRING
                }

                const nextDbKey = getDbKey(nextUnixKey)

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
    return moment(dateTimeText, constants.DATETIMEFORMAT).valueOf()
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

function getSchedule(unixKey) {

    const dbKey = getDbKey(unixKey)

    return new Promise((resolve, reject) => {
        schedulesDb.get(dbKey, (err, value) => {
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

function getSchedules(unixStartKey, unixEndKey) {

    let options = {}
    if (unixStartKey) {

        if (!unixEndKey) {
            unixEndKey = unixStartKey + constants.SECOND
        }
        const dbStartKey = getDbKey(unixStartKey)
        const dbEndKey = getDbKey(unixEndKey)
        options = {
            gte: dbStartKey,
            lt:  dbEndKey
        }
    }

    return new Promise((resolve, reject) => {
        const schedules = new Map()
        schedulesDb.createReadStream(options)
            .on('data', (jsonSchedule) => {
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

    const validatedDbKey = getDbKey(dbKey)

    return new Promise((resolve, reject) => {
        schedulesDb.del(validatedDbKey, (err, value) => {
            if (err) {
                console.log('GET ERROR', err)
                reject(err)
            }
            resolve(validatedDbKey)
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

function tester() {

    const startUnixKey = moment('10/09/2017 07:52 AM', constants.DATETIMEFORMAT).valueOf()
    const endUnixKey = moment('10/09/2017 08:00 AM', constants.DATETIMEFORMAT).valueOf()
    getSchedules(startUnixKey)
        .then((schedules) => {
            schedules.forEach((schedule, key) => {
                const unixKey = getUnixKey(key)
                const unixDate = moment(unixKey).format(constants.MILLISECONDFORMAT)
                console.log(`${unixKey} : ${unixDate} : ${schedule.start}`)
            })
        })
}

function main() {

    //tester()

    // console.log(unixKeyToDateTimeText(1507584632692))
    // console.log(unixKeyToDateTimeText(1507584600000))
    // console.log(unixKeyToDateTimeText(1507584600001))

    // ----------------------------------------------------------------------------------
    // PUT
    // ----------------------------------------------------------------------------------

    // const jsonSchedule = schedulesJson[0]
    // const unixKey = moment(jsonSchedule.start, constants.DATETIMEFORMAT).valueOf()

    // putSchedule(unixKey, jsonSchedule)
    //     .then((unixKey, err) => { console.log('PUT COMPLETE')   })
    //     .catch((err)         => { console.log('PUT ERROR', err) })

    // ----------------------------------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------------------------------

    // const jsonSchedule = schedulesJson[0]
    // const unixKey = moment(jsonSchedule.start, constants.DATETIMEFORMAT).valueOf()

    // jsonSchedule.name = 'UPDATED NAME 222'

    // updateSchedule(unixKey, jsonSchedule)
    //     .then((unixKey, err) => { console.log('UPDATE COMPLETE')   })
    //     .catch((err)         => { console.log('UPDATE ERROR', err) })

    // ----------------------------------------------------------------------------------
    // GET
    // ----------------------------------------------------------------------------------

    // const jsonSchedule = schedulesJson[0]
    // const unixKey = moment(jsonSchedule.start, constants.DATETIMEFORMAT).valueOf()

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
    // const unixKey = moment(jsonSchedule.start, constants.DATETIMEFORMAT).valueOf()

    // delSchedule(unixKey)
    //     .then((jsonSchedule, err) => {
    //         if (err) console.log('DEL SCHEDULE ERROR', err)
    //         console.log('DEL COMPLETE', jsonSchedule)
    //     })
    //     .catch((err) => { console.log('DEL ERROR', err)})

    // ----------------------------------------------------------------------------------
    // LIST
    // ----------------------------------------------------------------------------------

    // const unixStartKey = moment('10/06/2017 07:00 PM', constants.DATETIMEFORMAT).valueOf()
    // const unixEndKey = unixStartKey + constants.SECOND

    // getSchedules(unixStartKey, unixEndKey)
    //     .then((jsonSchedules, err) => {
    //         if (err) console.log('LIST SCHEDULE ERROR', err)
    //         jsonSchedules.forEach((value, key) => console.log(`LIST KEY: ${key} : ${typeof key} : VALUE: ${value.start} : ${value.name}`))
    //     })
    //     .catch((err) => { console.log('LIST ERROR', err) })

    // ----------------------------------------------------------------------------------
    // GET NEXT KEY
    // ----------------------------------------------------------------------------------

    // const unixStartKey = moment('10/06/2017 07:00 PM', constants.DATETIMEFORMAT).valueOf()

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
    getUnixDate,
    getNextDbKey,
    putSchedule,
    getSchedule,
    getSchedules,
    delSchedule,
    updateSchedule
}