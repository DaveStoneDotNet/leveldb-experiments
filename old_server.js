const level = require('level')
const moment = require('moment')
const schedules = require('./schedules')
const recurring = require('./recurring')

const SCHEDULES = 'schedules'
const RECURRING = 'recurring'
const DATEFORMAT = 'MM/DD/YYYY'
const TIMEFORMAT = 'hh:mm A'
const DATETIMEFORMAT = 'MM/DD/YYYY hh:mm A'
const MILLISECONDFORMAT = 'MM/DD/YYYY hh:mm:ss:SSSS A'

const ONEMINUTE = 60000

// Unix Timestamp	            X	1360013296
// Unix Millisecond Timestamp	x	1360013296123

const dbOptions = {
    valueEncoding: 'json'
}

const schedulesDb = level('./schedules', dbOptions) // dbName, options, callback
const recurringDb = level('./recurring', dbOptions) // dbName, options, callback

const db = {
    schedules: new Map(),
    recurring: new Map()
}

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Utility Functions - Should be moved out into a common utility class of some sort.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function getStartOfDay(start) {

    let momentdate = getMoment(start)
    return momentdate.startOf('day')
}

function getStartOfNextDay(start) {
    let momentdate = getMoment(start)
    return momentdate.add(1, 'day').startOf('day')
}

function getMoment(anyDateTime) {

    let momentdate

    if (typeof anyDateTime === 'string') momentdate = moment(anyDateTime, DATETIMEFORMAT)
    if (typeof anyDateTime === 'number') momentdate = moment(anyDateTime)
    if (typeof anyDateTime === 'object') momentdate = anyDateTime

    return momentdate
}

// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function seedSchedulesDatabase() {

    const batch = []

    schedules.forEach((o) => {
        batch.push({
            type: 'put',
            key: moment(o.start, DATETIMEFORMAT).unix(),
            value: o
        })
    })

    schedulesDb.batch(batch, (err) => {
        if (err) console.log('ERROR: ', err)
        console.log('SUCCESS')
    })
}

function seedRecurringSchedulesDatabase() {

    // const batch = []

    recurring.forEach((o) => {
        getNextKey(moment(o.startdate, DATEFORMAT).valueOf())
            .then((unixkey) => {
                console.log('PUTTING: ', `${o.startdate} - ${unixkey}`)
                putSchedule(unixkey, o)
                    .then((x) => {
                        console.log('FINISHED PUT', x)
                    })
            })
    })

    //const unixkey = moment(o.startdate, DATEFORMAT).valueOf()
}

// getRecurringSchedulesBatch()
//     .then((batch, err) => {
//         recurringDb.batch(batch, (err) => {
//             if (err) console.log('ERROR: ', err)
//             console.log('WHY SUCCESS SO SOON -----------------------')
//         })
//     })
// recurringDb.batch(batch, (err) => {
//     if (err) console.log('ERROR: ', err)
//     console.log('SUCCESS')
// })
//}

function getRecurringSchedulesBatch() {

    return new Promise((resolve, reject) => {

        const batch = []
        const resolveTriggerCount = recurring.length

        let counter = 0

        recurring.forEach((o) => {
            getNextKey(moment(o.startdate, DATEFORMAT).valueOf())
                .then((unixkey) => {
                    counter = counter + 1
                    console.log('PUSHING: ', `${counter} of ${resolveTriggerCount} : ${o.startdate} - ${unixkey}`)
                    batch.push({
                        type: 'put',
                        key: unixkey,
                        value: o
                    })
                    if (counter >= resolveTriggerCount) {
                        console.log('RESOLVING BATCH................', batch.length)
                        resolve(batch)
                    }
                })
        })
    })
}



function putSchedule(unixStartDate, schedule) {
    return new Promise((resolve, reject) => {
        recurringDb.put(unixStartDate, schedule)
        resolve(unixStartDate)
    })
}



function getSchedule(startDateTime) {

    let unixStartDate

    if (typeof startDateTime === 'string') unixStartDate = moment(startDateTime, DATETIMEFORMAT).unix()
    if (typeof startDateTime === 'object') unixStartDate = startDateTime.unix()

    schedulesDb.get(unixStartDate, (err, value) => {
        if (err) {
            if (err.notFound) {
                console.log('NOT FOUND: ', err)
            } else {
                console.log('ERROR: ', err)
            }
        }
        console.log('SUCCESS', value)
    })
}

function getNextKey(unixStartDate) {

    // This is complex.
    // Talking about RECURRING - NOT USER - SO THIS ONLY APPLIES TO *DAYS* - NOT *TIMES*
    // Does a particular DAY in question - based on UNIX NUMBER - EXIST?
    // IF YES - Then you need to find ALL the schedules that exists on that DAY.
    // If there are any duplicates, they can't be the same exact UNIX NUMBER because the 
    // keys won't support that. - So the only differentiation is the MILLISECONDS.
    // AGAIN - Recurring Schedules - by key - don't have a TIME - only a DAY.
    // So we have to get ALL the recurring schedules for any one DAY, get the LAST ONE - 
    // keys are stored in sorted order - and then increment it by one millisecond.
    // So perhaps this shouldn't be called 'recurringExists' but instead 'getNextKey'
    // 
    // MAYBE ALL I CARE ABOUT IS THAT ****MINUTE**** <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    return new Promise((resolve, reject) => {

        console.log('PROCESSING', unixStartDate)
        const unixEndDate = unixStartDate + ONEMINUTE

        let nextUnixStartDate = unixStartDate
        const duplicateSchedules = new Map()

        // Find any recurring schedules which occur from the unixStartDate plus one minute...
        recurringDb.createReadStream({
                gte: unixStartDate,
                lte: unixEndDate
            })
            .on('data', (data) => {
                console.log(`MATCH: ${data.key} : ${data.value.startdate}`)
                duplicateSchedules.set(data.key, data.value)
            })
            .on('err', (err) => {
                console.log('RATS', err)
                reject(err)
            })
            .on('close', () => {
                console.log('RECURRING SCHEDULES CLOSED')
            })
            .on('end', () => {

                // If there are any recurring schedules from the unixStartDate plus one minute...
                // ... then take the LAST one and add one second. (Maps don't have an index so 
                // the 'duplicateSchedules' map has to be converted into an array to get the last one)

                if (duplicateSchedules.size > 0) {
                    nextUnixStartDate = Array.from(duplicateSchedules.keys()).pop() + 1
                }

                // Otherwise just use the one passed in and initialized at the beginning of the function...
                resolve(nextUnixStartDate)
            })
    })
}

function streamSchedules(startDateTime, endDateTime) {

    let unixStartDate
    let unixEndDate

    if (typeof startDateTime === 'string') unixStartDate = moment(startDateTime, DATETIMEFORMAT).unix()
    if (typeof startDateTime === 'object') unixStartDate = startDateTime.unix()

    if (typeof endDateTime === 'string') unixEndDate = moment(endDateTime, DATETIMEFORMAT).unix()
    if (typeof endDateTime === 'object') unixEndDate = endDateTime.unix()

    console.log(`S START: ${unixStartDate} S END: ${unixEndDate}`)

    db.schedules.clear()

    schedulesDb.createReadStream({
            gte: unixStartDate,
            lte: unixEndDate
        })
        .on('data', (data) => {
            console.log(`S: ${data.key} : ${data.value.start}`)
            db.schedules.set(data.key, data.value)
        })
        .on('err', () => {
            console.log('RATS')
        })
        .on('close', () => {
            console.log('SCHEDULES CLOSED')
        })
        .on('end', () => {
            console.log('SCHEDULES ENDED')
        })
}

function streamRecurring() {

    db.recurring.clear()

    return new Promise((resolve, reject) => {
        recurringDb.createReadStream()
            .on('data', (data) => {
                console.log(`R: ${data.key} : ${data.value.startdate}`)
                db.recurring.set(data.key, data.value)
            })
            .on('err', (err) => {
                console.log('RATS', err)
                reject(err)
            })
            .on('close', () => {
                console.log('RECURRING CLOSED')
            })
            .on('end', () => {
                console.log('RECURRING ENDED')
                resolve(db.recurring)
            })
    })

}

function getUnixKey(unixKey) {
    return unixKey < 0 ? `0${(-unixKey).toString().padStart(14, '0')}` : `1${unixKey.toString().padStart(14, '0')}`
}

function getUnixDate(unixKey) {
    return unixKey < 0 ? `0${(-unixKey).toString().padStart(14, '0')}` : `1${unixKey.toString().padStart(14, '0')}`
}

function debugIt() {

    // getSchedule('05/02/1994 02:00 AM')
    // getSchedule(moment('05/02/1994 02:00 AM', DATETIMEFORMAT))
    // getSchedule(moment('05/02/1994 02:00 AM', DATETIMEFORMAT).unix())

    // seedSchedulesDatabase()
    //seedRecurringSchedulesDatabase()

    //streamSchedules('05/02/1994 02:00 AM', '05/08/1994 09:00 AM')
    //streamRecurring()

    // getStartOfDay('05/02/1994 02:00 AM')
    // getStartOfDay(moment('05/02/1994 02:00 AM', DATETIMEFORMAT))
    // getStartOfDay(moment('05/02/1994 02:00 AM', DATETIMEFORMAT).unix())

    // ---

    // const unixStartDate = moment('10/05/2017 00:00 AM', DATETIMEFORMAT).valueOf()
    // getNextKey(unixStartDate)
    //     .then((stuff) => {
    //         console.log('NEXT GOOD', stuff)
    //     })
    //     .catch((err) => {
    //         console.log('NEXT BAD', err)
    //     })


    // streamRecurring()
    //     .then((stuff) => {
    //         console.log('STREAM RECURRING GOOD', stuff)
    //     })
    //     .catch((err) => {
    //         console.log('STREAM RECURRING BAD', err)
    //     })

    // console.log('DONE')

    const a = moment('01/01/0001', DATEFORMAT).valueOf()
    const b = moment('01/01/3000', DATEFORMAT).valueOf()
    
    const aa = []

    aa.push(getUnixKey(-123))
    aa.push(getUnixKey(123))

    aa.push(getUnixKey(-7895))
    aa.push(getUnixKey(854))

    aa.push(getUnixKey(-4458))
    aa.push(getUnixKey(951119))

    const bb = aa.sort()

    const n = '199999999999999'
    const p = '099999999999999'

    const nn = +(n.substring(1))
    const pp = +(n.substring(1))
    
    const x = n.startsWith('0') ? moment(-nn) : moment(nn)
    const y = p.startsWith('0') ? moment(-pp) : moment(pp)
    
}

debugIt()