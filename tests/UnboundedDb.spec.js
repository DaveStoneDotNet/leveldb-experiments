const expect = require('chai').expect
const moment = require('moment')

const Constants = require('../src/Constants')

const UnboundedDb = require('../src/UnboundedDb.js')
const DbKeys = require('../src/DbKeys')

describe('Unbounded DB', () => {

    const schedule = {
        name: 'weekday',
        type: 'system',
        starttime: '05:30 AM',
        endtime: '09:00 PM',
        days: 31
    }

    const db = new UnboundedDb()

    let dbCount = 0

    beforeEach(() => {
        return db.getSchedules()
            .then((schedules) => {
                dbCount = schedules.size
            })
    })

    it('should test insertSchedule', (done) => {

        db.insertSchedule(schedule)
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(schedule.name)
                return db.delSchedule(jsonSchedule.schedule.dbKey)
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

    it('should test updateSchedule', (done) => {

        const updatedName = 'Updated Schedule'

        db.insertSchedule(schedule)
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(schedule.name)
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

    it('should test getSchedule', (done) => {

        db.insertSchedule(schedule)
            .then((dbKey) => { return db.getSchedule(dbKey) })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(schedule.name)
                return db.delSchedule(jsonSchedule.schedule.dbKey)
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

    it('should test getSchedules', (done) => {

        let insertedKey = ''

        db.insertSchedule(schedule)
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
                console.log('ERROR: ', err)
                assert.fail(error)
                done()
            })

    })

    it('should test delSchedule', (done) => {

        let insertedKey = ''

        db.insertSchedule(schedule)
            .then((dbKey) => {
                insertedKey = dbKey
                return db.getSchedule(dbKey)
            })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(schedule.name)
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
                console.log('ERROR: ', err)
                assert.fail(error)
                done()
            })

    })

})
