const expect = require('chai').expect
const moment = require('moment')

const constants = require('../constants')

const RecurringDb = require('../RecurringDb.js')
const DbKeys = require('../DbKeys')

describe('Recurring DB', function () {

    const INSERT_DATE        = '10/05/2017'
    const NEXT_KEY_DATE      = '10/06/2017'
    const DUPLICATE_KEY_DATE = '10/07/2017'
    const DELETE_DATE        = '10/08/2017'
    const GET_DATE           = '10/09/2017'
    const UPDATE_DATE        = '10/10/2017'
    const GET_SCHEDULES_DATE = '11/11/2017'

    const INSERT_TIME        = '05:00 PM'
    const NEXT_KEY_TIME      = '06:00 PM'
    const DUPLICATE_KEY_TIME = '07:00 PM'
    const DELETE_TIME        = '08:00 PM'
    const GET_TIME           = '09:00 PM'
    const UPDATE_TIME        = '10:00 PM'
    const GET_SCHEDULES_TIME = '11:00 PM'
    
    function getTestSchedule(db, date, time) {

        const startDateTimeMoment = db.getDateTimeMoment(date, time)
        const endDateTimeMoment   = db.getDateTimeMoment(date, time).add(1, 'hour')
        
        const startDateText = startDateTimeMoment.format(constants.DATEFORMAT)
        const startTimeText = startDateTimeMoment.format(constants.TIMEFORMAT)
        const endDateText   = endDateTimeMoment.format(constants.DATEFORMAT)
        const endTimeText   = endDateTimeMoment.format(constants.TIMEFORMAT)
    
        const dbKey = DbKeys.getEncodedDbKey(startDateTimeMoment)
        const nextMillisecondText = DbKeys.getDecodedDateText(DbKeys.getNextMillisecondEncodedDbKey(dbKey))
    
        const dbKeyText = DbKeys.getDecodedDateText(dbKey)
    
        const schedule = {
            "name": "day",
            "type": "system",
            "startdate": startDateText,
            "enddate": endDateText,
            "starttime": startTimeText,
            "endtime": endTimeText, 
            "mon": 1,
            "tue": 1,
            "wed": 1,
            "thu": 1,
            "fri": 1,
            "sat": 0,
            "sun": 0
            }

        return {
            startDateTimeMoment, 
            endDateTimeMoment, 
            startDateText, 
            startTimeText, 
            endDateText, 
            endTimeText, 
            nextMillisecondText, 
            dbKey, 
            dbKeyText, 
            schedule
        }
    }

    it('should test getNextDbKey', function () {

        const db = new RecurringDb()

        const testSchedule = getTestSchedule(db, NEXT_KEY_DATE, NEXT_KEY_TIME)
        
        const dbKey = testSchedule.dbKey

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)       => { return db.insertSchedule(testSchedule.schedule)  })
            .then((insertedKey) => { return db.getNextDbKey(insertedKey) })
            .then((nextDbKey)   => {
                                        const nextDbText = DbKeys.getDecodedDateText(nextDbKey)
                                        expect(nextDbText).to.equal(testSchedule.nextMillisecondText)
                                   })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test insertSchedule', function () {

        const db = new RecurringDb()

        const testSchedule = getTestSchedule(db, INSERT_DATE, INSERT_DATE)
        
        const dbKey = testSchedule.dbKey

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)         => { return db.insertSchedule(testSchedule.schedule) })
            .then((dbKey)         => { return db.getSchedules(dbKey)                   })
            .then((jsonSchedules) => {
                                         const insertedKey = jsonSchedules.keys().next().value
                                         const decodedInsertedKeyDateText = DbKeys.getDecodedDateText(insertedKey)
                                         expect(decodedInsertedKeyDateText).to.equal(testSchedule.startDateTimeMoment.format(constants.MILLISECONDFORMAT))
                                         expect(jsonSchedules.size).to.equal(1)
                                     })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test delSchedule', function () {

        const db = new RecurringDb()

        const testSchedule = getTestSchedule(db, DELETE_DATE, DELETE_TIME)
        
        const dbKey = testSchedule.dbKey
        
       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)    => { return db.insertSchedule(testSchedule.schedule) })
            .then((dbKey)    => { return db.delSchedule(dbKey)                    })
            .then((dbKey)    => { return db.getSchedule(dbKey)                    })
            .then((response) => {
                                    expect(response.exists).to.be.false
                                })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test getSchedule', function () {

        const db = new RecurringDb()

        const testSchedule = getTestSchedule(db, GET_DATE, GET_TIME)
        
        const dbKey = testSchedule.dbKey

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)    => { return db.insertSchedule(testSchedule.schedule) })
            .then((dbKey)    => { return db.getSchedule(dbKey)                    })
            .then((response) => {
                                    expect(response.exists).to.be.true
                                    expect(response.schedule.startdate).to.equal(testSchedule.schedule.startdate)
                                })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test getSchedules', function () {

        const db = new RecurringDb()

        const testSchedule = getTestSchedule(db, GET_SCHEDULES_DATE, GET_SCHEDULES_TIME)
        
        // Insert three separate schedules and ensure that 'duplicate' schedules occuring at the same time
        // have the millisecond portion incremented.

        const dbKey_A = testSchedule.dbKey
        const dbKey_B = DbKeys.getNextMillisecondEncodedDbKey(dbKey_A)
        const dbKey_C = DbKeys.getNextMillisecondEncodedDbKey(dbKey_B)

        const nextMinuteDbKey = DbKeys.getNextMinuteEncodedDbKey(dbKey_A)
        
        const dbKeyText_A = DbKeys.getDecodedDateText(dbKey_A)
        const dbKeyText_B = DbKeys.getDecodedDateText(dbKey_B)
        const dbKeyText_C = DbKeys.getDecodedDateText(dbKey_C)

       // Delete any previous test records first.

        db.delSchedule(dbKey_A)
            .then((dbKey)         => { return db.delSchedule(dbKey_B)     })
            .then((dbKey)         => { return db.delSchedule(dbKey_C)     })
            .then((dbKey)         => { return db.insertSchedule(testSchedule.schedule) })
            .then((insertedKey_A) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_A)).to.equal(dbKeyText_A)
                                         return db.insertSchedule(schedule) 
                                     })
            .then((insertedKey_B) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_B)).to.equal(dbKeyText_B)
                                         return db.insertSchedule(testSchedule.schedule) 
                                     })
            .then((insertedKey_C) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_C)).to.equal(dbKeyText_C)
                                         return db.getSchedules(dbKey_A, nextMinuteDbKey) 
                                     })
            .then((jsonSchedules) => {
                                         expect(jsonSchedules.size).to.equal(3)
                                     })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test updateSchedule', function () {

        const db = new RecurringDb()

        const testSchedule = getTestSchedule(db, UPDATE_DATE, UPDATE_TIME)
        
        const dbKey = testSchedule.dbKey

        const updateName = 'UPDATED SCHEDULE TEST'

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)    => { return db.insertSchedule(testSchedule.schedule) })
            .then((dbKey)    => { 
                                    schedule.name = updateName
                                    return db.updateSchedule(dbKey, testSchedule.schedule) 
                                })
            .then((schedule) => {
                                    expect(schedule.name).to.equal(updateName)
                                })
            .catch((err) => console.log('ERROR: ', err))

    })
    
    it('should test duplicate key insertion', function () {

        const db = new RecurringDb()

        const testSchedule = getTestSchedule(db, DUPLICATE_KEY_DATE, DUPLICATE_KEY_TIME)
        
        // Insert three separate schedules and ensure that 'duplicate' schedules occuring at the same time
        // have the millisecond portion incremented.

        const dbKey_A = testSchedule.dbKey
        const dbKey_B = DbKeys.getNextMillisecondEncodedDbKey(dbKey_A)
        const dbKey_C = DbKeys.getNextMillisecondEncodedDbKey(dbKey_B)

        const nextMinuteDbKey = DbKeys.getNextMinuteEncodedDbKey(dbKey_A)
        
        const dbKeyText_A = DbKeys.getDecodedDateText(dbKey_A)
        const dbKeyText_B = DbKeys.getDecodedDateText(dbKey_B)
        const dbKeyText_C = DbKeys.getDecodedDateText(dbKey_C)

       // Delete any previous test records first.

        db.delSchedule(dbKey_A)
            .then((dbKey)         => { return db.delSchedule(dbKey_B)     })
            .then((dbKey)         => { return db.delSchedule(dbKey_C)     })
            .then((dbKey)         => { return db.insertSchedule(schedule) })
            .then((insertedKey_A) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_A)).to.equal(dbKeyText_A)
                                         return db.insertSchedule(testSchedule.schedule) 
                                     })
            .then((insertedKey_B) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_B)).to.equal(dbKeyText_B)
                                         return db.insertSchedule(testSchedule.schedule) 
                                     })
            .then((insertedKey_C) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_C)).to.equal(dbKeyText_C)
                                         return db.getSchedules(dbKey_A, nextMinuteDbKey) 
                                     })
            .then((jsonSchedules) => {
                                         expect(jsonSchedules.size).to.equal(3)
                                     })
            .catch((err) => console.log('ERROR: ', err))

    })

})