const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')
const uuid = require('uuid/v1')

const constants = require('./Constants')
const Common = require('./Common')
const DbKeys = require('./DbKeys')

const unboundedJson = require('../seed/unbounded.json')

class UnboundedDb {

    constructor() {

        this.db = level('./data/unbounded', {
            valueEncoding: 'json'
        })

        this.insertSchedule = this.insertSchedule.bind(this)
        this.putSchedule    = this.putSchedule.bind(this)
    }

    insertSchedule(jsonSchedule) {
    
        const self = this

        return new Promise((resolve, reject) => {
    
            const id = uuid()
            self.putSchedule(id, jsonSchedule)
                .then((putDbKey) => resolve(putDbKey))
                .catch((putErr) => reject(putErr))
    
        })
    
    }

    putSchedule(dbKey, jsonSchedule) {
    
        return new Promise((resolve, reject) => {
            jsonSchedule.dbSource = constants.UNBOUNDED_DB
            this.db.put(dbKey, jsonSchedule, (err) => {
                if (err) {
                    console.log('PUT ERROR', err)
                    reject(err)
                }
                resolve(dbKey)
            })
        })
    
    }

    getSchedule(dbKey) {
    
        return new Promise((resolve, reject) => {
            this.db.get(dbKey, (err, value) => {
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
                } else {
                    value.dbKey = dbKey
                    resolve({
                        exists: true,
                        schedule: value
                    })
                }
            })
        })
    
    }
    
    getSchedules() {
    
        const options = {}
        
        return new Promise((resolve, reject) => {
            const schedules = new Map()
            this.db.createReadStream(options)
                .on('data', (jsonSchedule) => {
                    jsonSchedule.value.key = jsonSchedule.key
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
            this.db.del(dbKey, (err, value) => {
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
    
            this.delSchedule(dbKey)
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
            
            console.log(`${schedules.size} UNBOUNDED SCHEDULES`)

            schedules.forEach((s) => {

                const starttime = s.starttime ? s.starttime : ''
                const endtime   = s.endtime   ? s.endtime   : ''
                const days      = s.days      ? s.days      : ''
                const eventdate = s.eventdate ? s.eventdate : ''

                console.log(`${++index} | ${s.name} | ${s.type} | ${s.starttime} | ${s.endtime} | ${s.days} | ${s.eventdate} | ${s.dbSource}`)
            })
        })
    }

    seedDb() {
    
        Common.forEachPromise(unboundedJson, this.insertSchedule)
            .then(() => {
                console.log('DONE');
            })
            .catch((err) => {
                console.log('ERROR', err);
            })
    }

}

module.exports = UnboundedDb
