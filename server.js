const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')

const constants = require('./constants')

const DbKeys = require('./DbKeys')
const SchedulesDb = require('./SchedulesDb')
const RecurringDb = require('./RecurringDb')

const Schedules = require('./Schedules')

function main() {

    // const schedulesDb = new SchedulesDb()
    // const recurringDb = new RecurringDb()

    // schedulesDb.seedDb()
    // recurringDb.seedDb()

    // ----------------------------------------------------------------------------------

    // const recurringDb = new RecurringDb()

    // const startKey = DbKeys.getEncodedDbKey('10/01/2017')
    // const endKey = DbKeys.getEncodedDbKey('10/31/2017')

    // recurringDb.getSchedules(startKey, endKey)
    //     .then((combinedSchedules) => {
    //         combinedSchedules.forEach((schedule) => {
    //             console.log(`${schedule.startdate} - ${schedule.starttime} - ${schedule.name} - ${schedule.type}`)
    //         })
    
    //     })
    //     .catch((err) => console.log(err))

    // ----------------------------------------------------------------------------------

    const schedules = new Schedules()

    schedules.getSchedules('10/01/2017', '10/31/2017')
        .then((combinedSchedules) => {
            combinedSchedules.forEach((schedule) => {
                console.log(`${schedule.start} - ${schedule.isRecurring} - ${schedule.name} - ${schedule.type}`)
            })
    
        })
        .catch((err) => console.log(err))

    // ----------------------------------------------------------------------------------

    // schedules.getTodaysSchedules()
    //     .then((todaysSchedules) => {
    //         todaysSchedules.forEach((schedule) => {
    //             console.log(`${schedule.start}`)
    //         })    
    //     })
    //     .catch((err) => console.log(err))

    // schedules.includeRecurring('10/01/2017', '10/10/2017')
}

main()
