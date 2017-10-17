const level = require('level')
const moment = require('moment')
const bytewise = require('bytewise')
const uuid = require('uuid/v1')

const constants = require('./constants')

const DbKeys = require('./DbKeys')
const SchedulesDb = require('./SchedulesDb')
const RecurringDb = require('./RecurringDb')

const Schedules = require('./Schedules')

function main() {

    const mon =  1
    const tue =  2
    const wed =  4
    const thu =  8
    const fri = 16
    const sat = 32
    const sun = 64

    const days = wed | sun

    // Expect wed and sun...

    if (days & mon) console.log('mon')
    if (days & tue) console.log('tue')
    if (days & wed) console.log('wed')
    if (days & thu) console.log('thu')
    if (days & fri) console.log('fri')
    if (days & sat) console.log('sat')
    if (days & sun) console.log('sun')
    
    const id = uuid()
    console.log(id)
}

main()
