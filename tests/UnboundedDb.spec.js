const expect = require('chai').expect
const moment = require('moment')

const constants = require('../constants')

const UnboundedDb = require('../UnboundedDb.js')
const DbKeys = require('../DbKeys')

describe('Unbounded DB', function () {

    const INSERT_DATE = '12/01/2017 01:00 PM'
    const DELETE_DATE = '12/02/2017 02:00 PM'
    const GET_DATE = '12/03/2017 03:00 PM'
    const UPDATE_DATE = '12/04/2017 04:00 PM'
    const GET_SCHEDULES_DATE = '12/05/2017 05:00 PM'

    const db = new UnboundedDb()

    it('should test insertSchedule', function (done) {

        const schedule = {
            "name": "weekday",
            "type": "system",
            "starttime": "05:30 AM",
            "endtime": "09:00 PM",
            "days": 31
        }

        db.insertSchedule(schedule)
            .then((dbKey) => {
                return db.getSchedule(dbKey)
            })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(schedule.name)
                db.delSchedule(jsonSchedule.schedule.dbKey)
                done()
            })
            .catch((err) => {
                console.log('ERROR: ', err)
                assert.fail(error)
                done()
            })

    })

    it('should test delSchedule', function (done) {

        const schedule = {
            "name": "weekday",
            "type": "system",
            "starttime": "05:30 AM",
            "endtime": "09:00 PM",
            "days": 31
        }

        db.insertSchedule(schedule)
            .then((dbKey) => {
                return db.getSchedule(dbKey)
            })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(schedule.name)

                db.delSchedule(jsonSchedule.schedule.dbKey)
                    .then((dbKey) => {
                        return db.getSchedule(dbKey)
                    })
                    .then((jsonSchedule) => {
                        expect(jsonSchedule.exists).to.be.false
                        done()
                    })
            })
            .catch((err) => {
                console.log('ERROR: ', err)
                assert.fail(error)
                done()
            })

    })

    it('should test getSchedule', function (done) {

        const schedule = {
            "name": "weekday",
            "type": "system",
            "starttime": "05:30 AM",
            "endtime": "09:00 PM",
            "days": 31
        }

        db.insertSchedule(schedule)
            .then((dbKey) => {
                return db.getSchedule(dbKey)
            })
            .then((jsonSchedule) => {
                expect(jsonSchedule.exists).to.be.true
                expect(jsonSchedule.schedule.name).to.equal(schedule.name)
                db.delSchedule(jsonSchedule.schedule.dbKey)
                    .then((dbKey) => {
                        return db.getSchedule(dbKey)
                    })
                    .then((jsonSchedule) => {
                        expect(jsonSchedule.exists).to.be.false
                        done()
                    })
            })
            .catch((err) => {
                console.log('ERROR: ', err)
                assert.fail(error)
                done()
            })

    })


    it('should test getSchedules', function (done) {

        const schedule = {
            "name": "weekday",
            "type": "system",
            "starttime": "05:30 AM",
            "endtime": "09:00 PM",
            "days": 31
        }

        let inserteKey = null

        db.insertSchedule(schedule)
            .then((dbKey) => {
                inserteKey = dbKey
                return db.getSchedules()
            })
            .then((jsonSchedules) => {
                expect(jsonSchedules).not.to.be.empty
                expect(jsonSchedules.size).to.be.at.least(1)

                db.delSchedule(inserteKey)
                    .then((dbKey) => {
                        return db.getSchedule(dbKey)
                    })
                    .then((jsonSchedule) => {
                        expect(jsonSchedule.exists).to.be.false
                        done()
                    })
            })
            .catch((err) => {
                console.log('ERROR: ', err)
                assert.fail(error)
                done()
            })

    })



})