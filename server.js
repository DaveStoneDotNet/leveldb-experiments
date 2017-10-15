const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')
const DbKeys = require('./dbKeys')

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

    const encodedDbStartKey = DbKeys.getEncodedDbKey(jsonSchedule.start)

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

function getNextDbKey(encodedDbStartKey) {

    const encodedDbEndKey = DbKeys.getNextMinuteEncodedDbKey(encodedDbStartKey)

    return new Promise((resolve, reject) => {
        getSchedules(encodedDbStartKey, encodedDbEndKey)
            .then((jsonSchedules, err) => {

                // If any schedules exist in the provided one-minute time-frame, 
                // get the last one and increment it by one. Otherwise, just 
                // return the DbKey version of the 'unixKey' provided.

                let nextDbKey = encodedDbStartKey

                if (jsonSchedules && jsonSchedules.size > 0) {
                    const lastEncodedDbKey = [...jsonSchedules.keys()].sort().pop()
                    nextDbKey = DbKeys.getNextMillisecondEncodedDbKey(lastEncodedDbKey)
                }

                resolve(nextDbKey)

            })
            .catch((err) => {
                reject(err)
            })
    })

}

// ----------------------------------------------------------------------------------

function putSchedule(dbKey, jsonSchedule) {

    return new Promise((resolve, reject) => {
        schedulesDb.put(dbKey.toString(), jsonSchedule, (err) => {
            if (err) {
                console.log('PUT ERROR', err)
                reject(err)
            }
            resolve(dbKey)
        })
    })

}

function getSchedule(encodedDbKey) {

    return new Promise((resolve, reject) => {
        schedulesDb.get(encodedDbKey.toString(), (err, value) => {
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
                schedule: value
            })
        })
    })

}

function getSchedules(encodedDbStartKey, encodedDbEndKey) {

    let options = {}
    if (encodedDbStartKey) {

        if (!encodedDbEndKey) {
            encodedDbEndKey = DbKeys.getNextMinuteEncodedDbKey(encodedDbStartKey)
        }

        options = {
            gte: encodedDbStartKey.toString(),
            lt:  encodedDbEndKey.toString()
        }
    }

    return new Promise((resolve, reject) => {
        const schedules = new Map()
        schedulesDb.createReadStream(options)
            .on('data', (jsonSchedule) => {
                const decodedDbKey = DbKeys.getDecodedDateText(jsonSchedule.key)
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
        schedulesDb.del(dbKey.toString(), (err, value) => {
            if (err) {
                console.log('GET ERROR', err)
                reject(err)
            }
            resolve(dbKey)
        })
    })

}

function updateSchedule(dbKey, jsonSchedule) {

    return new Promise((resolve, reject) => {

        delSchedule(dbKey)
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

// ----------------------------------------------------------------------------------

function tester() {


}

function main() {

    //seedSchedules()
    //tester()

}

main()


module.exports = {
    insertSchedule,
    getNextDbKey,
    putSchedule,
    getSchedule,
    getSchedules,
    delSchedule,
    updateSchedule
}