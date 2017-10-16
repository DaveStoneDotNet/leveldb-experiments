const expect = require('chai').expect
const moment = require('moment')

const constants = require('../constants')

const SchedulesDb = require('../SchedulesDb.js')
const DbKeys = require('../DbKeys')

describe('Schedule DB', function () {

    const INSERT_DATE        = '10/05/2017 05:00 PM'
    const NEXT_KEY_DATE      = '10/06/2017 06:00 PM'
    const DUPLICATE_KEY_DATE = '10/07/2017 07:00 PM'
    const DELETE_DATE        = '10/08/2017 08:00 PM'
    const GET_DATE           = '10/09/2017 09:00 PM'
    const UPDATE_DATE        = '10/10/2017 10:00 PM'
    const GET_SCHEDULES_DATE = '11/11/2017 11:00 PM'
    
    it('should test getNextDbKey', function () {

        const db = new SchedulesDb()

        const dbKey = DbKeys.getEncodedDbKey(NEXT_KEY_DATE)
        const nextMillisecondText = DbKeys.getDecodedDateText(DbKeys.getNextMillisecondEncodedDbKey(dbKey))

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": NEXT_KEY_DATE,
                             "end":   moment(NEXT_KEY_DATE, constants.DATETIMEFORMAT).add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)       => { return db.insertSchedule(schedule)  })
            .then((insertedKey) => { return db.getNextDbKey(insertedKey) })
            .then((nextDbKey)   => {
                                        const nextDbText = DbKeys.getDecodedDateText(nextDbKey)
                                        expect(nextDbText).to.equal(nextMillisecondText)
                                   })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test insertSchedule', function () {

        const db = new SchedulesDb()

        const testMoment = moment(INSERT_DATE, constants.DATETIMEFORMAT)
        const dbKey      = DbKeys.getEncodedDbKey(INSERT_DATE)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": INSERT_DATE,
                             "end":   testMoment.add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)         => { return db.insertSchedule(schedule) })
            .then((dbKey)         => { return db.getSchedules(dbKey)      })
            .then((jsonSchedules) => {
                                         const insertedKey = jsonSchedules.keys().next().value
                                         const decodedInsertedKeyDateText = DbKeys.getDecodedDateText(insertedKey)
                                         expect(decodedInsertedKeyDateText).to.equal(moment(INSERT_DATE, constants.MILLISECONDFORMAT).format(constants.MILLISECONDFORMAT))
                                         expect(jsonSchedules.size).to.equal(1)
                                     })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test delSchedule', function () {

        const db = new SchedulesDb()

        const testMoment = moment(DELETE_DATE, constants.DATETIMEFORMAT)
        const dbKey      = DbKeys.getEncodedDbKey(DELETE_DATE)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": DELETE_DATE,
                             "end":   testMoment.add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)    => { return db.insertSchedule(schedule) })
            .then((dbKey)    => { return db.delSchedule(dbKey)      })
            .then((dbKey)    => { return db.getSchedule(dbKey)      })
            .then((response) => {
                                    expect(response.exists).to.be.false
                                })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test getSchedule', function () {

        const db = new SchedulesDb()

        const testMoment = moment(GET_DATE, constants.DATETIMEFORMAT)
        const dbKey      = DbKeys.getEncodedDbKey(GET_DATE)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": GET_DATE,
                             "end":   testMoment.add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)    => { return db.insertSchedule(schedule) })
            .then((dbKey)    => { return db.getSchedule(dbKey)       })
            .then((response) => {
                                    expect(response.exists).to.be.true
                                    expect(response.schedule.start).to.equal(GET_DATE)
                                })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test getSchedules', function () {

        const db = new SchedulesDb()

        // Insert three separate schedules and ensure that 'duplicate' schedules occuring at the same time
        // have the millisecond portion incremented.

        const dbKey_A = DbKeys.getEncodedDbKey(GET_SCHEDULES_DATE)
        const dbKey_B = DbKeys.getNextMillisecondEncodedDbKey(dbKey_A)
        const dbKey_C = DbKeys.getNextMillisecondEncodedDbKey(dbKey_B)

        const nextMinuteDbKey = DbKeys.getNextMinuteEncodedDbKey(dbKey_A)
        
        const dbKeyText_A = DbKeys.getDecodedDateText(dbKey_A)
        const dbKeyText_B = DbKeys.getDecodedDateText(dbKey_B)
        const dbKeyText_C = DbKeys.getDecodedDateText(dbKey_C)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": GET_SCHEDULES_DATE,
                             "end":   moment(GET_SCHEDULES_DATE, constants.DATETIMEFORMAT).add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        db.delSchedule(dbKey_A)
            .then((dbKey)         => { return db.delSchedule(dbKey_B)     })
            .then((dbKey)         => { return db.delSchedule(dbKey_C)     })
            .then((dbKey)         => { return db.insertSchedule(schedule) })
            .then((insertedKey_A) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_A)).to.equal(dbKeyText_A)
                                         return db.insertSchedule(schedule) 
                                     })
            .then((insertedKey_B) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_B)).to.equal(dbKeyText_B)
                                         return db.insertSchedule(schedule) 
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

        const db = new SchedulesDb()

        const testMoment = moment(UPDATE_DATE, constants.DATETIMEFORMAT)
        const dbKey      = DbKeys.getEncodedDbKey(UPDATE_DATE)
        const updateName = 'UPDATED SCHEDULE TEST'

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": UPDATE_DATE,
                             "end":   testMoment.add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        db.delSchedule(dbKey)
            .then((dbKey)    => { return db.insertSchedule(schedule) })
            .then((dbKey)    => { 
                                    schedule.name = updateName
                                    return db.updateSchedule(dbKey, schedule) 
                                })
            .then((schedule) => {
                                    expect(schedule.name).to.equal(updateName)
                                })
            .catch((err) => console.log('ERROR: ', err))

    })
    
    it('should test duplicate key insertion', function () {

        const db = new SchedulesDb()

        // Insert three separate schedules and ensure that 'duplicate' schedules occuring at the same time
        // have the millisecond portion incremented.

        const dbKey_A = DbKeys.getEncodedDbKey(DUPLICATE_KEY_DATE)
        const dbKey_B = DbKeys.getNextMillisecondEncodedDbKey(dbKey_A)
        const dbKey_C = DbKeys.getNextMillisecondEncodedDbKey(dbKey_B)

        const nextMinuteDbKey = DbKeys.getNextMinuteEncodedDbKey(dbKey_A)
        
        const dbKeyText_A = DbKeys.getDecodedDateText(dbKey_A)
        const dbKeyText_B = DbKeys.getDecodedDateText(dbKey_B)
        const dbKeyText_C = DbKeys.getDecodedDateText(dbKey_C)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": DUPLICATE_KEY_DATE,
                             "end":   moment(DUPLICATE_KEY_DATE, constants.DATETIMEFORMAT).add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        db.delSchedule(dbKey_A)
            .then((dbKey)         => { return db.delSchedule(dbKey_B)     })
            .then((dbKey)         => { return db.delSchedule(dbKey_C)     })
            .then((dbKey)         => { return db.insertSchedule(schedule) })
            .then((insertedKey_A) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_A)).to.equal(dbKeyText_A)
                                         return db.insertSchedule(schedule) 
                                     })
            .then((insertedKey_B) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_B)).to.equal(dbKeyText_B)
                                         return db.insertSchedule(schedule) 
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