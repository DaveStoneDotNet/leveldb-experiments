const moment = require('moment')

const constants = require('./Constants')

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

        if (recurringSchedule.days) {
            if (recurringSchedule.days & constants.SUN) days.push(0)
            if (recurringSchedule.days & constants.MON) days.push(1)
            if (recurringSchedule.days & constants.TUE) days.push(2)
            if (recurringSchedule.days & constants.WED) days.push(3)
            if (recurringSchedule.days & constants.THU) days.push(4)
            if (recurringSchedule.days & constants.FRI) days.push(5)
            if (recurringSchedule.days & constants.SAT) days.push(6)
        }

        return days
    }

    includeRecurring(start, end, recurringSchedule) {

        const includedSchedules = new Set()

        const days = this.getDaysArray(recurringSchedule)

        const startMoment = moment(start, constants.DATETIMEFORMAT)
        const endMoment   = moment(end,   constants.DATETIMEFORMAT).add(1, 'day')

        const scheduleStartMoment = Common.getDateTimeMoment(recurringSchedule.startdate)
        const scheduleEndMoment   = Common.getDateTimeMoment(recurringSchedule.enddate).add(1, 'day')

        for (var m = moment(startMoment); m.isBefore(endMoment); m.add(1, 'days')) {

            const isIncluded = days.includes(m.day())

            if (isIncluded) {

                const isInRange = (m.isSame(scheduleStartMoment) || m.isAfter(scheduleStartMoment)) && m.isBefore(scheduleEndMoment)
                
                //console.log(`NAME: ${recurringSchedule.name} : IS IN RANGE: ${isInRange} : DATE: ${m.format(constants.DATEFORMAT)} : START: ${scheduleStartMoment.format(constants.DATEFORMAT)} : END: ${scheduleEndMoment.format(constants.DATEFORMAT)} : IS BEFORE: ${m.isBefore(scheduleEndMoment)} : IS AFTER: ${m.isAfter(scheduleStartMoment)} : IS SAME: ${m.isSame(scheduleStartMoment)}`)

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

                    const start = encodedDbStartKey ? DbKeys.getDecodedDateText(encodedDbStartKey) : null
                    const end   = encodedDbEndKey   ? DbKeys.getDecodedDateText(encodedDbEndKey)   : null

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
        
        return new Promise((resolve, reject) => {

            const encodedDbStartKey = DbKeys.getEncodedDbKey(start)
            const encodedDbEndKey   = DbKeys.getEncodedDbKey(end)

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
            const end   = moment().startOf('day').add(1, 'day').format(constants.DATEFORMAT)

            this.getSchedules(start, end)
                .then((todaysSchedules) => {
                    resolve(todaysSchedules)
                })
                .catch((err) => reject(err))
        })
    }

    list(start, end) {
        this.getSchedules(start, end)
        .then((schedules) => {
            let index = 0
            console.log(`${schedules.size} COMBINED SCHEDULES`)
            schedules.forEach((s) => console.log(`${++index} | ${s.name} | ${s.type} | ${s.start} | ${s.end} | ${s.isRecurring}`))
        })
    }

}

module.exports = Schedules