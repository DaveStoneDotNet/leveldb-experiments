const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')

const constants = require('./constants')
const Common = require('./Common')
const DbKeys = require('./DbKeys')

const schedulesJson = require('./schedules')

class SchedulesDb {

    constructor() {

        this.db = level('./schedules', {
            valueEncoding: 'json'
        })

        this.getNextDbKey   = this.getNextDbKey.bind(this)
        this.insertSchedule = this.insertSchedule.bind(this)
        this.putSchedule    = this.putSchedule.bind(this)
        this.getSchedule    = this.getSchedule.bind(this)
        this.getSchedules   = this.getSchedules.bind(this)
        this.delSchedule    = this.delSchedule.bind(this)
        this.updateSchedule = this.updateSchedule.bind(this)
    }
    
    getNextDbKey(encodedDbStartKey) {
    
        const encodedDbEndKey = DbKeys.getNextMinuteEncodedDbKey(encodedDbStartKey)
    
        return new Promise((resolve, reject) => {
            this.getSchedules(encodedDbStartKey, encodedDbEndKey)
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

    insertSchedule(jsonSchedule) {
    
        const encodedDbStartKey = DbKeys.getEncodedDbKey(jsonSchedule.start)
    
        return new Promise((resolve, reject) => {
    
            this.getNextDbKey(encodedDbStartKey)
                .then((nextDbKey, err) => {
                    this.putSchedule(nextDbKey, jsonSchedule)
                        .then((putDbKey) => resolve(putDbKey))
                        .catch((putErr) => reject(putErr))
                })
                .catch((err) => {
                    console.log('GET NEXT KEY ERROR', err)
                    reject(err)
                })
    
        })
    
    }

    putSchedule(dbKey, jsonSchedule) {
    
        return new Promise((resolve, reject) => {
            this.db.put(dbKey.toString(), jsonSchedule, (err) => {
                if (err) {
                    console.log('PUT ERROR', err)
                    reject(err)
                }
                resolve(dbKey)
            })
        })
    
    }
    
    getSchedule(encodedDbKey) {
    
        return new Promise((resolve, reject) => {
            this.db.get(encodedDbKey.toString(), (err, value) => {
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
    
    getSchedules(encodedDbStartKey, encodedDbEndKey) {
    
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
            this.db.createReadStream(options)
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
    
    delSchedule(dbKey) {
    
        return new Promise((resolve, reject) => {
            this.db.del(dbKey.toString(), (err, value) => {
                if (err) {
                    console.log('GET ERROR', err)
                    reject(err)
                }
                resolve(dbKey)
            })
        })
    
    }
    
    updateSchedule(dbKey, jsonSchedule) {
    
        return new Promise((resolve, reject) => {
    
            delSchedule(dbKey)
                .then((deletedDbKey) => {
                    this.putSchedule(deletedDbKey, jsonSchedule)
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
    
    seedDb() {
    
        Common.forEachPromise(schedulesJson, this.insertSchedule)
            .then(() => {
                console.log('DONE');
            })
            .catch((err) => {
                console.log('ERROR', err);
            })
    }
}

module.exports = SchedulesDb