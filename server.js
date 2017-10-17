const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')
const uuid = require('uuid/v1')

const constants = require('./Constants')

const DbKeys = require('./DbKeys')
const SchedulesDb = require('./SchedulesDb')
const RecurringDb = require('./RecurringDb')

const Schedules = require('./Schedules')

function RunDbKey() {

    const dateText   = '10/06/2017 07:00 PM'
    const dateTextMs = '10/06/2017 07:00:00.000 PM'
    
    const a = DbKeys.getEncodedDbKey(dateText)
    const b = DbKeys.getEncodedDbKey(moment(dateText, constants.DATETIMEFORMAT))
    const c = DbKeys.getEncodedDbKey(moment(dateText, constants.DATETIMEFORMAT).toDate())

    const aa = DbKeys.getDecodedDateText(a)
    const bb = DbKeys.getDecodedDateText(b)
    const cc = DbKeys.getDecodedDateText(c)
}

function main() {

    //RunDbKey()

    // const schedulesDb = new SchedulesDb()
    // schedulesDb.seedDb()
    // schedulesDb.list()

    // const recurringDb = new RecurringDb()
    // recurringDb.seedDb()
    // recurringDb.list()

    // const schedules = new Schedules()
    // schedules.list('10/01/2017', '10/31/2017')
}

main()
