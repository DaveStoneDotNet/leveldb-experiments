const expect = require('chai').expect
const moment = require('moment')

const server = require('../server.js')
const constants = require('../constants')

describe('Server', function () {

    //#region Docs
    // 
    // ---------------------------------------------------------------------
    // Unix and DB Keys
    // ---------------------------------------------------------------------
    // Unix Keys are expected to be NUMBERS.
    // The Keys in LevelDB are fucking STRINGS causing sorting havoc.
    // 
    // Implementing LevelDB string keys as numerical Unix Timestamps.
    // Conversion functions need to exist to convert Unix Timestamps 
    // back-and-forth between numbers and strings. Since LevelDB sorts 
    // these string keys alphabetically, the numbers need to be padded 
    // with ZEROS to sort correctly. For example, sorting string versions 
    // of '2' and '12' in ascending order will cause the '12' to be first 
    // and the '2' to come in last....
    // 
    //      -   '12'
    //      -    '2'
    // 
    // Additionally, negative numbers need to be taken into account.
    // Minus signs (-) in a string don't sort as negative nubers. To
    // solve for this, a leading ZERO (0) is pre-pended to string key 
    // to indicate a negative value. A leading ONE (1) is pre-pended to 
    // indicate a positive value. For example...
    // 
    //      '0123' equals -123  negative
    //      '1123' equals +123  positive
    // 
    // ---------------------------------------------------------------------
    // Duplicate Schedules
    // ---------------------------------------------------------------------
    // LevelDB can't have duplicate keys. It's possible to have duplicate
    // schedules (two schedules occurring at the exact same Unix Timestamp).
    // However, it's not possible to have two schedules occur at the exact
    // same MILLISECOND. For example, there may be two schedules occurring
    // at 2:30 PM, but this only needs to be accurate down to the MINUTE.
    // This allows adding on MILLISECONDS (which can be ignored) yet still
    // provide for unique Unix Timestamps for schedules occurring at the
    // same time. Then, instead of asking for a single schedule which occurs 
    // at 2:30 PM, you would ask for any schedules occurring between 2:30 PM 
    // and 2:31 PM.
    // 
    // ---------------------------------------------------------------------
    // 
    //#endregion Docs

    it('should test getUnixKey', function () {

        // Positive string converts to a positive number
        let unixKey = server.getUnixKey('101507334400000')
        expect(unixKey).to.equal(1507334400000)

        // Positive number returns the same positive number
        unixKey = server.getUnixKey(1507334400000)
        expect(unixKey).to.equal(1507334400000)

        // Negative string converts to negative number
        unixKey = server.getUnixKey('01507334400000')
        expect(unixKey).to.equal(-1507334400000)

        // Negative number returns the same negative number
        unixKey = server.getUnixKey(-1507334400000)
        expect(unixKey).to.equal(-1507334400000)

        // Anything other than a string or a number should thrown an exception

    })

    it('should test getDbKey', function () {

        // Positive number should convert to a ZERO-padded string pre-pended with a '0'
        let dbKey = server.getDbKey(1507334400000)
        expect(dbKey).to.equal('101507334400000')

        // 'Positive' string returns the same 'positive' string
        dbKey = server.getDbKey('101507334400000')
        expect(dbKey).to.equal('101507334400000')

        // Negative number should convert to a ZERO-padded string pre-pended with a '1'
        dbKey = server.getDbKey(-1507334400000)
        expect(dbKey, 'THIS GUY?').to.equal('001507334400000')

        // 'Negative' string returns the same 'negative' string
        dbKey = server.getDbKey('001507334400000')
        expect(dbKey).to.equal('001507334400000')

    })

    it('should test duplicate key insertion', function () {

        const month = moment().month()
        const day = moment().month()
        const year = moment().year()
        const hour = moment().hour()
        const minute = moment().minute()

        const now = moment().year(year).month(month).date(day).hour(hour).minute(minute).seconds(0).milliseconds(0)
        const nowText = now.format(constants.DATETIMEFORMAT)
        const nowUnix = now.valueOf()
        const hourLater = now.add(1, 'hour')
        const hourLaterText = hourLater.format(constants.DATETIMEFORMAT)

        const dbKey = server.getDbKey(nowUnix)

        const schedule = {
            "name": "meeting 1",
            "type": "user",
            "start": nowText,
            "end": hourLaterText
        }

        // Insert three separate schedules and ensure that 'duplicate' schedules occuring at the same time
        // have the millisecond portion incremented.

        // Currently this test is flawed because it can only be successfully run once a minute. There's only 
        // a function to delete a *singular* schedule instead of many. This test would need to potentially
        // delete many schedules, not just one.

        server.delSchedule(nowUnix)
            .then((delDbKey)      => {
                                         expect(delDbKey).to.equal(dbKey)
                                         return server.insertSchedule(schedule) 
                                     })
            .then((dbKey_A)       => {
                                         expect(dbKey_A).to.equal(dbKey)
                                         return server.insertSchedule(schedule) 
                                     })
            .then((dbKey_B)       => {
                                          expect(dbKey_B).to.equal(server.getDbKey(nowUnix + 1))
                                          return server.insertSchedule(schedule) 
                                     })
            .then((dbKey_C)       => {
                                          expect(dbKey_C).to.equal(server.getDbKey(nowUnix + 2))
                                          return server.getSchedules(nowUnix, nowUnix + constants.SECOND) 
                                     })
            .then((jsonSchedules) => {
                                         expect(jsonSchedules.size).to.equal(3)
                                     })
            .catch((err) => console.log('FINAL ERROR: ', err))

    })

})