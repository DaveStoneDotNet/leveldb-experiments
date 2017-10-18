const moment = require('moment')

const Constants = require('./Constants')

const Common = require('./Common')
const DbKeys = require('./DbKeys')

const SchedulesDb = require('./SchedulesDb')
const RecurringDb = require('./RecurringDb')
const UnboundedDb = require('./UnboundedDb')

class Schedules {

    constructor() {
        this.SchedulesDb = new SchedulesDb()
        this.RecurringDb = new RecurringDb()
        this.UnboundedDb = new UnboundedDb()
    }

    getMappedSchedules(encodedDbStartKey, encodedDbEndKey) {

        return new Promise((resolve, reject) => {
            const mappdeSchedules = new Set()
            this.SchedulesDb.getSchedules(encodedDbStartKey, encodedDbEndKey)
                .then((schedules) => {
                    schedules.forEach((schedule, key) => {
                        mappdeSchedules.add({
                            key: schedule.key,
                            name: schedule.name,
                            type: schedule.type,
                            start: schedule.start,
                            end: schedule.end,
                            dbSource: schedule.dbSource
                        })
                    })
                    resolve(mappdeSchedules)
                })
                .catch((err) => reject(err))
        })

    }

    // ------------------------------------------------------------

    static getDaysArray(recurringSchedule) {

        const days = []

        if (recurringSchedule.days) {
            if (recurringSchedule.days & Constants.SUN) days.push(0)
            if (recurringSchedule.days & Constants.MON) days.push(1)
            if (recurringSchedule.days & Constants.TUE) days.push(2)
            if (recurringSchedule.days & Constants.WED) days.push(3)
            if (recurringSchedule.days & Constants.THU) days.push(4)
            if (recurringSchedule.days & Constants.FRI) days.push(5)
            if (recurringSchedule.days & Constants.SAT) days.push(6)
        }

        return days
    }

    static includeRecurring(start, end, recurringSchedule) {

        const includedSchedules = new Set()

        const days = Schedules.getDaysArray(recurringSchedule)

        const startMoment = moment(start, Constants.DATETIMEFORMAT)
        const endMoment = moment(end, Constants.DATETIMEFORMAT).add(1, 'day')

        const scheduleStartMoment = Common.getDateTimeMoment(recurringSchedule.startdate)
        const scheduleEndMoment = Common.getDateTimeMoment(recurringSchedule.enddate).add(1, 'day')

        for (let m = startMoment; m.isBefore(endMoment); m.add(1, 'days')) {

            const isIncluded = days.includes(m.day())

            if (isIncluded) {

                const isInRange = (m.isSame(scheduleStartMoment) || m.isAfter(scheduleStartMoment)) && m.isBefore(scheduleEndMoment)

                //console.log(`NAME: ${recurringSchedule.name} : IS IN RANGE: ${isInRange} : DATE: ${m.format(Constants.DATEFORMAT)} : START: ${scheduleStartMoment.format(Constants.DATEFORMAT)} : END: ${scheduleEndMoment.format(Constants.DATEFORMAT)} : IS BEFORE: ${m.isBefore(scheduleEndMoment)} : IS AFTER: ${m.isAfter(scheduleStartMoment)} : IS SAME: ${m.isSame(scheduleStartMoment)}`)

                if (isInRange) {
                    const schedule = {
                        key: recurringSchedule.key,
                        name: recurringSchedule.name,
                        type: recurringSchedule.type,
                        start: Common.getDateTimeText(m.format(Constants.DATEFORMAT), recurringSchedule.starttime),
                        end: Common.getDateTimeText(m.format(Constants.DATEFORMAT), recurringSchedule.endtime),
                        dbSource: recurringSchedule.dbSource
                    }
                    includedSchedules.add(schedule)
                }
            }
        }
        return includedSchedules
    }

    getMappedRecurring(encodedDbStartKey, encodedDbEndKey) {

        return new Promise((resolve, reject) => {

            const mappdeSchedules = new Set()

            this.RecurringDb.getSchedules(encodedDbStartKey, encodedDbEndKey)
                .then((recurringSchedules) => {

                    const start = encodedDbStartKey ? DbKeys.getDecodedDateText(encodedDbStartKey) : null
                    const end = encodedDbEndKey ? DbKeys.getDecodedDateText(encodedDbEndKey) : null

                    recurringSchedules.forEach((recurringSchedule, key) => {

                        const includedSchedules = Schedules.includeRecurring(start, end, recurringSchedule)
                        includedSchedules.forEach((s) => mappdeSchedules.add(s))
                    })

                    resolve(mappdeSchedules)
                })
                .catch((err) => reject(err))
        })
    }

    // ------------------------------------------------------------

    static getPartitionedSchedules(schedules) {
        const partitionedSchedules = {
            systemSchedules: new Set(),
            allDaySchedules: new Set()
        }
        schedules.forEach((s) => {
            switch (s.type) {
                case Constants.SYSTEM_SCHEDULE:
                    partitionedSchedules.systemSchedules.add(s)
                    break
                case Constants.ALLDAY_SCHEDULE:
                    partitionedSchedules.allDaySchedules.add(s)
                    break
            }
        })
        return partitionedSchedules
    }

    static getMappedSystemSchedules(start, end, systemSchedules) {

        const mappedSchedules = new Set()

        systemSchedules.forEach((systemSchedule) => {

            const days = Schedules.getDaysArray(systemSchedule)

            const startMoment = Common.getDateTimeMoment(start)
            const endMoment = Common.getDateTimeMoment(end).add(1, 'day')

            for (let m = startMoment; m.isBefore(endMoment); m.add(1, 'days')) {
                const isIncluded = days.includes(m.day())
                if (isIncluded) {

                    const startText = `${m.format(Constants.DATEFORMAT)} ${systemSchedule.starttime}`
                    const endText = `${m.format(Constants.DATEFORMAT)} ${systemSchedule.endtime}`

                    mappedSchedules.add(
                        {
                            key: systemSchedule.key,
                            name: systemSchedule.name,
                            type: systemSchedule.type,
                            start: startText,
                            end: endText, 
                            dbSource: systemSchedule.dbSource
                        }
                    )
                }
            }
        })

        return mappedSchedules
    }

    static getMappedAllDaySchedules(start, end, allDaySchedules) {

        const mappedSchedules = new Set()

        allDaySchedules.forEach((allDaySchedule) => {

            const startMoment = Common.getDateTimeMoment(start)
            const endMoment = Common.getDateTimeMoment(end).add(1, 'day')

            const eventdate = Common.getDateTimeMoment(allDaySchedule.eventdate)

            for (let m = startMoment; m.isBefore(endMoment); m.add(1, 'days')) {

                if (Common.isSameDay(m, eventdate)) {

                    const startText = `${m.format(Constants.DATEFORMAT)} 00:00:00.000 AM`
                    const endText   = `${m.format(Constants.DATEFORMAT)} 11:59:59.999 PM`

                    mappedSchedules.add(
                        {
                            key: allDaySchedule.key,
                            name: allDaySchedule.name,
                            type: allDaySchedule.type,
                            start: startText,
                            end: endText, 
                            dbSource: allDaySchedule.dbSource
                        }
                    )
                }
            }
        })

        return mappedSchedules
    }

    getMappedUnbounded(start, end) {

        return new Promise((resolve, reject) => {

            let mappdeSchedules = new Set()

            this.UnboundedDb.getSchedules()
                .then((schedules) => {

                    const partitionedSchedules = Schedules.getPartitionedSchedules(schedules)

                    const systemSchedules = Schedules.getMappedSystemSchedules(start, end, partitionedSchedules.systemSchedules)
                    const allDaySchedules = Schedules.getMappedAllDaySchedules(start, end, partitionedSchedules.allDaySchedules)

                    mappdeSchedules = new Set([...systemSchedules.values(), ...allDaySchedules.values()])

                    resolve(mappdeSchedules)
                })
                .catch((err) => reject(err))
        })

    }

    // ------------------------------------------------------------

    getSchedules(start, end) {

        const schedules = new Set()

        const dailySchedules = new Set()
        const recurringSchedules = new Set()
        const systemSchedules = new Set()
        const allDaySchedules = new Set()

        return new Promise((resolve, reject) => {

            const encodedDbStartKey = DbKeys.getEncodedDbKey(start)
            const encodedDbEndKey = DbKeys.getEncodedDbKey(end)

            const p1 = this.getMappedSchedules(encodedDbStartKey, encodedDbEndKey)
            const p2 = this.getMappedRecurring(encodedDbStartKey, encodedDbEndKey)
            const p3 = this.getMappedUnbounded(start, end)

            Promise.all([p1, p2, p3])
                .then((mappedSchedules) => {
                    const combinedSchedules = new Set([...mappedSchedules[0], ...mappedSchedules[1], ...mappedSchedules[2]])
                    resolve(combinedSchedules)
                    console.log('FINISHED')
                })
                .catch((err) =>
                    reject(err)
                )
        })
    }

    getTodaysSchedules() {

        return new Promise((resolve, reject) => {

            const start = moment().startOf('day').format(Constants.DATEFORMAT)
            const end = moment().startOf('day').add(1, 'day').format(Constants.DATEFORMAT)

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
                console.log(`index | key | name| type | start | end | dbSource`)
                schedules.forEach((s) => console.log(`${++index} | ${s.key}  | ${s.name} | ${s.type} | ${s.start} | ${s.end} | ${s.dbSource}`))
            })
    }

}

module.exports = Schedules
