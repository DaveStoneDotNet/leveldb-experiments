const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')
const uuid = require('uuid/v1')

const Constants = require('./Constants')

const Common = require('./Common')
const DbKeys = require('./DbKeys')
const SchedulesDb = require('./SchedulesDb')
const RecurringDb = require('./RecurringDb')
const UnboundedDb = require('./UnboundedDb')

const Schedules = require('./Schedules')

// ------------------------------------------------------------------------------------

function tester() {

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

    // const schedules = new Schedules()
    // schedules.list('10/01/2017', '10/31/2017')
}

main()
