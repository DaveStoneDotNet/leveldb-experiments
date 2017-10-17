const moment = require('moment')

const constants = require('./constants')

const Common = require('./Common')
const DbKeys = require('./DbKeys')
const SchedulesDb = require('./SchedulesDb')
const RecurringDb = require('./RecurringDb')

class Schedules {

    constructor() {
        this.SchedulesDb = new SchedulesDb()
        this.RecurringDb = new RecurringDb()
    }

    getMappedSchedules(encodedDbStartKey, encodedDbEndKey) {
    
        return new Promise((resolve, reject) => {
            const mappdeSchedules = new Set()
            this.SchedulesDb.getSchedules(encodedDbStartKey, encodedDbEndKey)
                .then((schedules) => {
                    schedules.forEach((schedule, key) => {
                        mappdeSchedules.add({
                                              key:   key, 
                                              name:  schedule.name,
                                              type:  schedule.type,
                                              start: schedule.start,
                                              end:   schedule.end,
                                              isRecurring: false
                                            })
                    })
                    resolve(mappdeSchedules)
                })
                .catch((err) => reject(err))
            })
    
    }
    
    getDaysArray(recurringSchedule) {
        let days = []
        if (recurringSchedule.sun) days.push(0)
        if (recurringSchedule.mon) days.push(1)
        if (recurringSchedule.tue) days.push(2)
        if (recurringSchedule.wed) days.push(3)
        if (recurringSchedule.thu) days.push(4)
        if (recurringSchedule.fri) days.push(5)
        if (recurringSchedule.sat) days.push(6)
        return days
    }

    includeRecurring(start, end, recurringSchedule) {

        const includedSchedules = new Set()

        const startMoment = moment(start, constants.DATETIMEFORMAT)
        const endMoment = moment(end, constants.DATETIMEFORMAT)
        const days = this.getDaysArray(recurringSchedule)
        
        const scheduleStartMoment = Common.getDateTimeMoment(recurringSchedule.startdate)
        const scheduleEndMoment   = Common.getDateTimeMoment(recurringSchedule.enddate).add(1, 'day')

        for (var m = moment(startMoment); m.isBefore(endMoment); m.add(1, 'days')) {

            const isIncluded = days.includes(m.day())

            if (isIncluded) {

                const isInRange = (m.isSame(scheduleStartMoment) || m.isAfter(scheduleStartMoment)) && m.isBefore(scheduleEndMoment)
                console.log(`NAME: ${recurringSchedule.name} : IS IN RANGE: ${isInRange} : DATE: ${m.format(constants.DATEFORMAT)} : START: ${scheduleStartMoment.format(constants.DATEFORMAT)} : END: ${scheduleEndMoment.format(constants.DATEFORMAT)} : IS BEFORE: ${m.isBefore(scheduleEndMoment)} : IS AFTER: ${m.isAfter(scheduleStartMoment)} : IS SAME: ${m.isSame(scheduleStartMoment)}`)

                if (isInRange)
                {
                    const schedule = {
                        key:   key, 
                        name:  recurringSchedule.name,
                        type:  recurringSchedule.type,
                        start: Common.getDateTimeText(m.format(constants.DATEFORMAT), recurringSchedule.starttime),
                        end:   Common.getDateTimeText(m.format(constants.DATEFORMAT), recurringSchedule.endtime),
                        isRecurring: true
                    }
                    includedSchedules.add(schedule)
                }
            }            
        }
        return includedSchedules
    }

    getMappedRecurringSchedules(encodedDbStartKey, encodedDbEndKey) {
    
        return new Promise((resolve, reject) => {

            const mappdeSchedules = new Set()

            this.RecurringDb.getSchedules(encodedDbStartKey, encodedDbEndKey)
                .then((recurringSchedules) => {

                    const start = DbKeys.getDecodedDateText(encodedDbStartKey)
                    const end   = DbKeys.getDecodedDateText(encodedDbEndKey)

                    recurringSchedules.forEach((recurringSchedule, key) => {

                        const includedSchedules = this.includeRecurring(start, end, recurringSchedule)
                        includedSchedules.forEach((s) => mappdeSchedules.add(s))
                    })

                    resolve(mappdeSchedules)
                })
                .catch((err) => reject(err))
            })
    
    }
    
    getSchedules(start, end) {

        let schedules = new Set()
        
        const encodedDbStartKey = DbKeys.getEncodedDbKey(start)
        const encodedDbEndKey   = DbKeys.getEncodedDbKey(end)

        return new Promise((resolve, reject) => {
            this.getMappedSchedules(encodedDbStartKey, encodedDbEndKey)
                .then((mappedSchedules) => {
                    schedules = mappedSchedules
                    this.getMappedRecurringSchedules(encodedDbStartKey, encodedDbEndKey)
                        .then((recurringSchedules) => {
                            const combinedSchedules = new Set([...schedules, ...recurringSchedules])
                            resolve(combinedSchedules)
                        })
                        .catch((err) => reject(err))
                })
                .catch((err) => reject(err))
            })
    }

    getTodaysSchedules() {

        return new Promise((resolve, reject) => { 

            const start = moment().startOf('day').format(constants.DATEFORMAT)
            const end = moment().startOf('day').add(1, 'day').format(constants.DATEFORMAT)

            this.getSchedules(start, end)
                .then((todaysSchedules) => {
                    resolve(todaysSchedules)
                })
                .catch((err) => reject(err))
        })
    }
}

module.exports = Schedules