const expect = require('chai').expect
const moment = require('moment')

const Constants = require('../src/Constants')

const SchedulesDb = require('../src/SchedulesDb.js')
const DbKeys = require('../src/DbKeys')

describe('Schedule DB', function () {

    const INSERT_DATE = '10/05/2017 05:00 PM'

    const db = new SchedulesDb()

    let dbCount = 0

    beforeEach(() => {
        return db.getSchedules()
            .then((schedules) => {
                dbCount = schedules.size
            })
    })

    function getTestSchedule() {

        const testMoment = moment(INSERT_DATE, Constants.DATETIMEFORMAT)
        const dbKey = DbKeys.getEncodedDbKey(INSERT_DATE)
        const nextMillisecondText = DbKeys.getDecodedDateText(DbKeys.getNextMillisecondEncodedDbKey(dbKey))
        
        const schedule = {
            "name": "meeting 1",
            "type": "user",
            "start": INSERT_DATE,
            "end": testMoment.add(1, 'hour').format(Constants.DATETIMEFORMAT)
        }

        return {
            testMoment,
            nextMillisecondText, 
            dbKey,
            schedule
        }
    }

    it('should test insertSchedule', function (done) {

        const scheduleInfo = getTestSchedule()

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => {
                return db.getSchedule(dbKey)
            })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(scheduleInfo.schedule.name)
                return db.delSchedule(scheduleInfo.dbKey)
            })
            .then((dbKey) => {
                return db.getSchedule(dbKey)
            })
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

        const scheduleInfo = getTestSchedule()

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

        const scheduleInfo = getTestSchedule()

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

        const scheduleInfo = getTestSchedule()

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

        const scheduleInfo = getTestSchedule()

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

        const scheduleInfo = getTestSchedule()

        db.insertSchedule(scheduleInfo.schedule)
            .then((dbKey) => { 
                return db.getNextDbKey(dbKey) 
            })
            .then((nextDbKey) => {
                expect(DbKeys.getDecodedDateText(nextDbKey)).to.equal(scheduleInfo.nextMillisecondText)
                return db.delSchedule(scheduleInfo.dbKey)
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


})