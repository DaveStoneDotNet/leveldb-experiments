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
    return items.reduce(function (promise, item) {
        return promise.then(function () {
            return fn(item);
        });
    }, Promise.resolve());
}

function insertSchedule(jsonSchedule) {

    const unixKey = moment(jsonSchedule.start, constants.DATETIMEFORMAT).valueOf()

    return new Promise((resolve, reject) => {

        //let nextUnixKey = unixKey

        getNextDbKey(unixKey)
            .then((nextDbKey, err) => {
                putSchedule(nextDbKey, jsonSchedule)
                    .then((putDbKey) => resolve(putDbKey))
                    .catch((err) => reject(err))
            })
            .catch((err) => {
                console.log('GET NEXT KEY ERROR', err)
                reject(err)
            })

    })

}

// ----------------------------------------------------------------------------------

function getUnixKey(dbKey) {

    if (typeof dbKey === 'number') return dbKey
    if (typeof dbKey !== 'string') throw ('NOT A STRING')
    return dbKey.startsWith('0') ? -(dbKey.substring(1)) : +(dbKey.substring(1))
}

function getDbKey(unixKey) {
    return typeof unixKey === 'number' ? (unixKey < 0 ? `0${(-unixKey).toString().padStart(14, '0')}` : `1${unixKey.toString().padStart(14, '0')}`) : unixKey
}

function getUnixDate(unixKey) {
    return 'TODO'
}

function getNextDbKey(unixKey) {

    unixKey = getUnixKey(unixKey)

    let nextUnixKey = unixKey
    const unixStartKey = unixKey
    const unixEndKey = unixStartKey + constants.SECOND

    return new Promise((resolve, reject) => {
        getSchedules(unixStartKey, unixEndKey)
            .then((jsonSchedules, err) => {

                if (err) console.log('LIST SCHEDULE ERROR', err)

                if (jsonSchedules && jsonSchedules.size > 0) {
                    nextUnixKey = getUnixKey(([...jsonSchedules.keys()].sort().pop())) + 1 // CAUTION: The key is returned as a STRING
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
// ----------------------------------------------------------------------------------

function putSchedule(dbKey, jsonSchedule) {

    dbKey = getDbKey(dbKey)

    return new Promise((resolve, reject) => {
        schedulesDb.put(dbKey, jsonSchedule, (err) => {
            if (err) {
                console.log('PUT ERROR', err)
                reject(err)
            }
            resolve(dbKey)
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

    const dbStartKey = getDbKey(unixStartKey)
    const dbEndKey = getDbKey(unixEndKey)

    return new Promise((resolve, reject) => {
        const schedules = new Map()
        schedulesDb.createReadStream({
                gte: dbStartKey,
                lte: dbEndKey
            })
            .on('data', (jsonSchedule) => {
                schedules.set(jsonSchedule.key, jsonSchedule.value)
            })
            .on('error', (err) => {
                reject(err)
            })
            .on('close', () => {})
            .on('end', () => {
                resolve(schedules)
            })
    })

}

function delSchedule(dbKey) {

    dbKey = getDbKey(dbKey)

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

    const dbKey = getDbKey(dbKey)

    return new Promise((resolve, reject) => {

        delSchedule(dbKey)
            .then((dbKey, err) => {
                putSchedule(dbKey, jsonSchedule)
                    .then((dbKey, err) => {
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

    const month = moment().month()
    const day = moment().month()
    const year = moment().year()
    const hour = moment().hour()
    const minute = moment().minute()

    const now = moment().year(year).month(month).date(day).hour(hour).minute(minute).seconds(0).milliseconds(0)
    const nowText = now.format(constants.DATETIMEFORMAT)
    const nowUnix = now.valueOf()
    const hourLater = now.add(1, 'hour')
    const hourLaterText = hourLater.format(constants.DATETIMEFORMAT)

    const dbKey = getDbKey(nowUnix)

    const schedule = {
        "name": "meeting 1",
        "type": "user",
        "start": nowText,
        "end": hourLaterText
    }

    delSchedule(nowUnix)
        .then((dbKey_O) => { return insertSchedule(schedule) })
        .then((dbKey_A) => { return insertSchedule(schedule) })
        .then((dbKey_B) => { return insertSchedule(schedule) })
        .then((dbKey_C) => {
                               const unixStartKey = nowUnix
                               const unixEndKey = unixStartKey + constants.SECOND
                               return getSchedules(unixStartKey, unixEndKey)
                           }
             )
        .then((scheduleMap) => console.log('DONE', scheduleMap.size))
        .catch((err) => console.log('ERR:', err))
}

function main() {

    tester()

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