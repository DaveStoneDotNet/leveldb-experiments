const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')
const uuid = require('uuid/v1')

const constants = require('./Constants')

const DbKeys = require('./DbKeys')
const SchedulesDb = require('./SchedulesDb')
const RecurringDb = require('./RecurringDb')
const UnboundedDb = require('./UnboundedDb')

const Schedules = require('./Schedules')

function tester() {

    const INSERT_DATE        = '12/01/2017 01:00 PM'
    const DELETE_DATE        = '12/02/2017 02:00 PM'
    const GET_DATE           = '12/03/2017 03:00 PM'
    const UPDATE_DATE        = '12/04/2017 04:00 PM'
    const GET_SCHEDULES_DATE = '12/05/2017 05:00 PM'

    const db = new UnboundedDb()

    const schedule = {
                        "name": "weekday",
                        "type": "system",
                        "starttime": "05:30 AM",
                        "endtime": "09:00 PM",
                        "days": 31
                        }

    console.log('WHAT THE FUCK 0')
                        
    db.insertSchedule(schedule)
        .then((dbKey)         => { 
                                    console.log(`WHAT THE FUCK A: ${dbKey}`)
                                    return db.getSchedule(dbKey) })
        .then((jsonSchedule)  => { 
                                    console.log(`WHAT THE FUCK B: ${jsonSchedule.schedule.dbKey}`)
            
                                    db.delSchedule(jsonSchedule.schedule.dbKey)
                                        .then((dbKey) => { 
                                            console.log(`WHAT THE FUCK C: ${dbKey}`)
                                            return db.getSchedule(dbKey) 
                                        })
                                        .then((jsonSchedule)  => { 
                                            console.log(`WHAT THE FUCK D: ${jsonSchedule.name}`)
                                        })
                                    })
        .catch((err) => console.log('ERROR: ', err))
    
}

function main() {

    //tester()

    // ----------------------------------------------

    // const schedulesDb = new SchedulesDb()
    // schedulesDb.seedDb()

    // const recurringDb = new RecurringDb()
    // recurringDb.seedDb()

    // const unboundedDb = new UnboundedDb()
    // unboundedDb.seedDb()

    // ----------------------------------------------

    // const schedulesDb = new SchedulesDb()
    // schedulesDb.list()

    // const recurringDb = new RecurringDb()
    // recurringDb.list()

    // const unboundedDb = new UnboundedDb()
    // unboundedDb.list()

    // ----------------------------------------------

    // const schedules = new Schedules()
    // schedules.list('10/01/2017', '10/31/2017')
}

main()
