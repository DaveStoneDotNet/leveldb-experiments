const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')

const constants = require('./Constants')
const Common = require('./Common')
const DbKeys = require('./DbKeys')

const recurringJson = require('./seed/recurring.json')

class RecurringDb {

    constructor() {

        this.db = level('./recurring', {
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

    // ------------------------------------------------------------------------------------------------

    getRecurringStartDateTimeText(jsonSchedule) {
        return Common.getDateTimeText(jsonSchedule.startdate, jsonSchedule.starttime)
    }

    getRecurringStartDateTimeMoment(jsonSchedule) {
        return moment(Common.getDateTimeText(jsonSchedule.startdate, jsonSchedule.starttime)),format(constants.DATETIMEFORMAT)
    }

    getRecurringEndDateTimeText(jsonSchedule) {
        return Common.getDateTimeText(jsonSchedule.enddate, jsonSchedule.endtime)
    }

    getRecurringEndDateTimeMoment(jsonSchedule) {
        return moment(Common.getDateTimeText(jsonSchedule.enddate, jsonSchedule.endtime)),format(constants.DATETIMEFORMAT)
    }

    // ------------------------------------------------------------------------------------------------

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
    
        const startDateTime = `${jsonSchedule.startdate} ${jsonSchedule.starttime}`
        const encodedDbStartKey = DbKeys.getEncodedDbKey(startDateTime)
    
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
            jsonSchedule.dbSource = constants.RECURRING_DB
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
    
    getMappedSchedules(encodedDbStartKey, encodedDbEndKey) {
    
        return new Promise((resolve, reject) => {
            const schedules = new Map()
            this.getSchedules(encodedDbStartKey, encodedDbEndKey)
                .then((recurringSchedules) => {
                    recurringSchedules.forEach((recurringSchedule, key) => {
                        schedules.set(key, {
                            "name": recurringSchedule.name,
                            "type": recurringSchedule.type,
                            "start": Common.getDateTimeText(recurringSchedule.startdate, recurringSchedule.starttime),
                            "end": Common.getDateTimeText(recurringSchedule.enddate, recurringSchedule.endtime),
                          })
                    })
                    resolve(schedules)
                })
                .catch((err) => reject(err))
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
    
    list() {
        this.getSchedules()
        .then((schedules) => {
            let index = 0
            console.log(`${schedules.size} RECURRING SCHEDULES`)
            schedules.forEach((s) => console.log(`${++index} | ${s.name} | ${s.type} | ${s.startdate} | ${s.enddate} | ${s.starttime} | ${s.endtime} | ${s.days} | ${s.dbSource}`))
        })
    }

    seedDb() {
    
        Common.forEachPromise(recurringJson, this.insertSchedule)
            .then(() => {
                console.log('DONE');
            })
            .catch((err) => {
                console.log('ERROR', err);
            })
    }
    
}

module.exports = RecurringDb