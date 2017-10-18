const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')
const uuid = require('uuid/v1')

const Constants = require('./src/Constants')

const Common = require('./src/Common')
const DbKeys = require('./src/DbKeys')

const SchedulesDb = require('./src/SchedulesDb')
const RecurringDb = require('./src/RecurringDb')
const UnboundedDb = require('./src/UnboundedDb')

const Schedules = require('./src/Schedules')

// ------------------------------------------------------------------------------------

function tester() {
    console.log('')
}

function main() {

    // tester()

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

    const schedules = new Schedules()
    schedules.list('10/01/2017', '10/31/2017')
}

main()
