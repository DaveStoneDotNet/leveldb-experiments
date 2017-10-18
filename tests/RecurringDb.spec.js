const expect = require('chai').expect
const moment = require('moment')

const Constants = require('../Constants')

const Common = require('../Common')
const RecurringDb = require('../RecurringDb.js')
const DbKeys = require('../DbKeys')

describe('Recurring DB', function () {

    const INSERT_DATE = '05/05/2005'
    const INSERT_TIME = '05:00 PM'

    const db = new RecurringDb()

    let dbCount = 0

    beforeEach(() => {
        return db.getSchedules()
            .then((schedules) => {
                dbCount = schedules.size
            })
    })

    function getTestSchedule(db, date, time) {

        const startDateTimeMoment = Common.getDateTimeMoment(date, time)
        const endDateTimeMoment = Common.getDateTimeMoment(date, time).add(1, 'hour')

        const startDateText = startDateTimeMoment.format(Constants.DATEFORMAT)
        const startTimeText = startDateTimeMoment.format(Constants.TIMEFORMAT)
        const endDateText = endDateTimeMoment.format(Constants.DATEFORMAT)
        const endTimeText = endDateTimeMoment.format(Constants.TIMEFORMAT)

        const dbKey = DbKeys.getEncodedDbKey(startDateTimeMoment)
        const nextMillisecondText = DbKeys.getDecodedDateText(DbKeys.getNextMillisecondEncodedDbKey(dbKey))

        const dbKeyText = DbKeys.getDecodedDateText(dbKey)

        schedule = {
            "name": "teste schedule",
            "type": "test",
            "startdate": startDateText,
            "enddate": endDateText,
            "starttime": startTimeText,
            "endtime": endTimeText,
            "days": 31
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

    // ------------------------------------------------------------------------------------

    it('should test insertSchedule', function (done) {

        const scheduleInfo = getTestSchedule(db, INSERT_DATE, INSERT_TIME)

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(schedule.name)
                return db.delSchedule(scheduleInfo.dbKey)
            })
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.false
                expect(jsonSchedule.schedule).to.be.undefined
                return db.delSchedule(scheduleInfo.dbKey)
            })
            .then((dbKey) => { return db.getSchedules() })
            .then((schedules) => {
                expect(schedules.size).to.equal(dbCount)
                done()
            })
            .catch((err) => {
                done()
                console.log('ERROR: ', err)
            })

    })

    it('should test updateSchedule', function (done) {

        const scheduleInfo = getTestSchedule(db, INSERT_DATE, INSERT_TIME)

        const updatedName = 'Updated Schedule'

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(scheduleInfo.schedule.name)
                jsonSchedule.schedule.name = updatedName
                return db.updateSchedule(jsonSchedule.schedule.dbKey, jsonSchedule.schedule)
            })
            .then((jsonSchedule) => {
                expect(jsonSchedule.name).to.equal(updatedName)
                return db.delSchedule(jsonSchedule.dbKey)
            })
            .then(() => { return db.getSchedules() })
            .then((schedules) => {
                expect(schedules.size).to.equal(dbCount)
                done()
            })
            .catch((err) => {
                console.log('ERROR: ', err)
                assert.fail(error)
                done()
            })

    })

    it('should test getSchedule', function (done) {

        const scheduleInfo = getTestSchedule(db, INSERT_DATE, INSERT_TIME)

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(scheduleInfo.schedule.name)
                return db.delSchedule(scheduleInfo.dbKey)
            })
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.false
                expect(jsonSchedule.schedule).to.be.undefined
                return db.delSchedule(scheduleInfo.dbKey)
            })
            .then((dbKey) => { return db.getSchedules() })
            .then((schedules) => {
                expect(schedules.size).to.equal(dbCount)
                done()
            })
            .catch((err) => {
                done()
                console.log('ERROR: ', err)
            })

    })

    it('should test getSchedules', function (done) {

        const scheduleInfo = getTestSchedule(db, INSERT_DATE, INSERT_TIME)

        let insertedKey = ''

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => {
                insertedKey = dbKey
                return db.getSchedules()
            })
            .then((jsonSchedules) => {
                expect(jsonSchedules.size).to.equal(dbCount + 1)
                return db.delSchedule(insertedKey)
            })
            .then(() => { return db.getSchedules() })
            .then((schedules) => {
                expect(schedules.size).to.equal(dbCount)
                done()
            })
            .catch((err) => {
                done()
                console.log('ERROR: ', err)
            })

    })

    it('should test delSchedule', function (done) {

        const scheduleInfo = getTestSchedule(db, INSERT_DATE, INSERT_TIME)

        let insertedKey = ''

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => {
                insertedKey = dbKey
                return db.getSchedule(dbKey)
            })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(scheduleInfo.schedule.name)
                return db.delSchedule(jsonSchedule.schedule.dbKey)
            })
            .then((dbKey) => {
                return db.getSchedule(dbKey)
            })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.false
                expect(jsonSchedule.schedule).to.be.undefined
                return db.getSchedules()
            })
            .then((schedules) => {
                expect(schedules.size).to.equal(dbCount)
                done()
            })
            .catch((err) => {
                done()
                console.log('ERROR: ', err)
            })

    })

    it('should test getNextDbKey', function (done) {

        const scheduleInfo = getTestSchedule(db, INSERT_DATE, INSERT_TIME)

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => { return db.getNextDbKey(dbKey) })
            .then((nextDbKey) => {
                expect(DbKeys.getDecodedDateText(nextDbKey)).to.equal(scheduleInfo.nextMillisecondText)
                return db.delSchedule(scheduleInfo.dbKey)
            })
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.false
                expect(jsonSchedule.schedule).to.be.undefined
                return db.delSchedule(scheduleInfo.dbKey)
            })
            .then((dbKey) => { return db.getSchedules() })
            .then((schedules) => {
                expect(schedules.size).to.equal(dbCount)
                done()
            })
            .catch((err) => {
                done()
                console.log('ERROR: ', err)
            })

    })

    it('should test getMappedSchedules', function (done) {

        const scheduleInfo = getTestSchedule(db, INSERT_DATE, INSERT_TIME)

        let insertedKey = ''

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => {
                insertedKey = dbKey
                return db.getMappedSchedules()
            })
            .then((jsonSchedules) => {
                expect(jsonSchedules.size).to.equal(dbCount + 1)
                return db.delSchedule(insertedKey)
            })
            .then(() => { return db.getSchedules() })
            .then((schedules) => {
                expect(schedules.size).to.equal(dbCount)
                done()
            })
            .catch((err) => {
                done()
                console.log('ERROR: ', err)
            })

    })

})