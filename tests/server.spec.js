const expect = require('chai').expect
const moment = require('moment')

const server = require('../server.js')
const DbKeys = require('../dbKeys')
const constants = require('../constants')

describe('Server', function () {

    const INSERT_DATE        = '10/05/2017 05:00 PM'
    const NEXT_KEY_DATE      = '10/06/2017 06:00 PM'
    const DUPLICATE_KEY_DATE = '10/07/2017 07:00 PM'
    const DELETE_DATE        = '10/08/2017 08:00 PM'
    const GET_DATE           = '10/09/2017 09:00 PM'
    const UPDATE_DATE        = '10/10/2017 10:00 PM'
    
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

    //#region Revised Docs
    // 
    // Thinking about separate classes.
    // Perhaps one for converting dates back-and-forth between bytwise keys
    // and strings and moments, etc. Min / Max dates, date utilities, etc.
    // 
    // Thinking of separate databases.
    // 
    //      - Single Schedules
    //      - Bounded Recurring Schedules (Unbounded)
    //          - Unbounded Recurring indicated by a Min Date.
    // 
    // All 'duplicate' schedules occurring at the same time would still
    // follow the 'millisecond' rule.
    //
    // May possibly need a higher level class which combines and manages 
    // these types.
    //
    // These classes would then be wrapped in some type of data class, 
    // which would be nice if it could somehow be abstracted from 
    // whatever is happening underneath. For example, swapping out 
    // Level DB with something else. Thinking this data class should 
    // be something like a server class which accepts requests and 
    // returns responses (as opposed to individual parameters).
    //
    // All Schedules need an ID, Name, Type, and Description.
    //
    //#endregion Revised Docs

    it('should test getEncodedDbKey', function () {
        
        const dateText   = '10/06/2017 07:00 PM'
        const dateTextMs = '10/06/2017 07:00:00.000 PM'
        
        const a = DbKeys.getEncodedDbKey(dateText)
        const b = DbKeys.getEncodedDbKey(moment(dateText, constants.DATETIMEFORMAT))
        const c = DbKeys.getEncodedDbKey(moment(dateText, constants.DATETIMEFORMAT).toDate())
    
        const aa = DbKeys.getDecodedDateText(a)
        const bb = DbKeys.getDecodedDateText(b)
        const cc = DbKeys.getDecodedDateText(c)

        expect(aa).to.equal(dateTextMs)
        expect(bb).to.equal(dateTextMs)
        expect(cc).to.equal(dateTextMs)
        
    })

    it('should test getDecodedDateText', function () {
        
        const dateText   = '10/06/2017 07:00 PM'
        const dateTextMs = '10/06/2017 07:00:00.000 PM'
        
        const dbKey = DbKeys.getEncodedDbKey(dateText)
    
        const decodedDateText = DbKeys.getDecodedDateText(dbKey)

        expect(decodedDateText).to.equal(dateTextMs)
        
    })

    it('should test getDecodedMoment', function () {
        
        const dateText   = '10/06/2017 07:00 PM'
        const dateTextMs = '10/06/2017 07:00:00.000 PM'
        
        const dbKey = DbKeys.getEncodedDbKey(dateText)
    
        const decodedMoment = DbKeys.getDecodedMoment(dbKey)
        
        expect(moment.isMoment(decodedMoment)).to.be.true
        expect(decodedMoment.format(constants.MILLISECONDFORMAT)).to.equal(dateTextMs)
        
    })

    it('should test getNextMinuteEncodedDbKey', function () {
        
        const dateText   = '10/06/2017 07:00 PM'
        const nextDateText = '10/06/2017 07:01:00.000 PM'
        
        const dbKey = DbKeys.getEncodedDbKey(dateText)
        const nextDbKey = DbKeys.getNextMinuteEncodedDbKey(dbKey)
        
        const nextDbText = DbKeys.getDecodedDateText(nextDbKey)

        expect(nextDbText).to.equal(nextDateText)
        
    })

    it('should test getNextMillisecondEncodedDbKey', function () {
        
        const dateText   = '10/06/2017 07:00 PM'
        const nextDateText = '10/06/2017 07:00:00.001 PM'
        
        const dbKey = DbKeys.getEncodedDbKey(dateText)
        const nextDbKey = DbKeys.getNextMillisecondEncodedDbKey(dbKey)
        
        const nextDbText = DbKeys.getDecodedDateText(nextDbKey)

        expect(nextDbText).to.equal(nextDateText)
        
    })

    it('should test getNextDbKey', function () {

        // LevelDB keys must be unique. Unix timestamps are being 
        // used as LevelDB keys. Unix timestamps are unique down
        // to the millisecond. Schedules don't use milliseconds 
        // so the millisecond portion is just an auto-incrementing 
        // 'id' portion for schedules which occur at the same 
        // time. 'getNextDbKey' is intended to auto-increment the 
        // millisecond portion of any max Unix timestamp for any 
        // schedule which occurs at the same time as the Unix 
        // timestamp parameter provided.
        // (See 'Docs' above)

        const dbKey = DbKeys.getEncodedDbKey(NEXT_KEY_DATE)
        const nextMillisecondText = DbKeys.getDecodedDateText(DbKeys.getNextMillisecondEncodedDbKey(dbKey))

        const dbKeyText = DbKeys.getDecodedDateText(dbKey)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": NEXT_KEY_DATE,
                             "end":   moment(NEXT_KEY_DATE, constants.DATETIMEFORMAT).add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        server.delSchedule(dbKey)
            .then((dbKey)       => { return server.insertSchedule(schedule)  })
            .then((insertedKey) => { return server.getNextDbKey(insertedKey) })
            .then((nextDbKey)   => {
                                        const nextDbText = DbKeys.getDecodedDateText(nextDbKey)
                                        expect(nextDbText).to.equal(nextMillisecondText)
                                   })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test insertSchedule', function () {

        const testMoment = moment(INSERT_DATE, constants.DATETIMEFORMAT)
        const dbKey      = DbKeys.getEncodedDbKey(INSERT_DATE)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": INSERT_DATE,
                             "end":   testMoment.add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        server.delSchedule(dbKey)
            .then((dbKey)         => { return server.insertSchedule(schedule) })
            .then((dbKey)         => { return server.getSchedules(dbKey)      })
            .then((jsonSchedules) => {
                                         const insertedKey = jsonSchedules.keys().next().value
                                         const decodedInsertedKeyDateText = DbKeys.getDecodedDateText(insertedKey)
                                         expect(decodedInsertedKeyDateText).to.equal(moment(INSERT_DATE, constants.MILLISECONDFORMAT).format(constants.MILLISECONDFORMAT))
                                         expect(jsonSchedules.size).to.equal(1)
                                     })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test delSchedule', function () {

        const testMoment = moment(DELETE_DATE, constants.DATETIMEFORMAT)
        const dbKey      = DbKeys.getEncodedDbKey(DELETE_DATE)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": DELETE_DATE,
                             "end":   testMoment.add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        server.delSchedule(dbKey)
            .then((dbKey)    => { return server.insertSchedule(schedule) })
            .then((dbKey)    => { return server.delSchedule(dbKey)      })
            .then((dbKey)    => { return server.getSchedule(dbKey)      })
            .then((response) => {
                                    expect(response.exists).to.be.false
                                })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test getSchedule', function () {

        const testMoment = moment(GET_DATE, constants.DATETIMEFORMAT)
        const dbKey      = DbKeys.getEncodedDbKey(GET_DATE)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": GET_DATE,
                             "end":   testMoment.add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        server.delSchedule(dbKey)
            .then((dbKey)    => { return server.insertSchedule(schedule) })
            .then((dbKey)    => { return server.getSchedule(dbKey)       })
            .then((response) => {
                                    expect(response.exists).to.be.true
                                    expect(response.schedule.start).to.equal(GET_DATE)
                                })
            .catch((err) => console.log('ERROR: ', err))

    })

    it('should test updateSchedule', function () {

        const testMoment = moment(UPDATE_DATE, constants.DATETIMEFORMAT)
        const dbKey      = DbKeys.getEncodedDbKey(UPDATE_DATE)
        const updateName = 'UPDATED SCHEDULE TEST'

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": UPDATE_DATE,
                             "end":   testMoment.add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        server.delSchedule(dbKey)
            .then((dbKey)    => { return server.insertSchedule(schedule) })
            .then((dbKey)    => { 
                                    schedule.name = updateName
                                    return server.updateSchedule(dbKey, schedule) 
                                })
            .then((schedule) => {
                                    expect(schedule.name).to.equal(updateName)
                                })
            .catch((err) => console.log('ERROR: ', err))

    })

    
    it('should test duplicate key insertion', function () {

        // Insert three separate schedules and ensure that 'duplicate' schedules occuring at the same time
        // have the millisecond portion incremented.

        const dbKey_A = DbKeys.getEncodedDbKey(DUPLICATE_KEY_DATE)
        const dbKey_B = DbKeys.getNextMillisecondEncodedDbKey(dbKey_A)
        const dbKey_C = DbKeys.getNextMillisecondEncodedDbKey(dbKey_B)

        const nextMinuteDbKey = DbKeys.getNextMinuteEncodedDbKey(dbKey_A)
        
        const dbKeyText_A = DbKeys.getDecodedDateText(dbKey_A)
        const dbKeyText_B = DbKeys.getDecodedDateText(dbKey_B)
        const dbKeyText_C = DbKeys.getDecodedDateText(dbKey_C)

        const schedule = {
                             "name": "meeting 1",
                             "type": "user",
                             "start": DUPLICATE_KEY_DATE,
                             "end":   moment(DUPLICATE_KEY_DATE, constants.DATETIMEFORMAT).add(1, 'hour').format(constants.DATETIMEFORMAT)
                         }

       // Delete any previous test records first.

        server.delSchedule(dbKey_A)
            .then((dbKey)         => { return server.delSchedule(dbKey_B)     })
            .then((dbKey)         => { return server.delSchedule(dbKey_C)     })
            .then((dbKey)         => { return server.insertSchedule(schedule) })
            .then((insertedKey_A) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_A)).to.equal(dbKeyText_A)
                                         return server.insertSchedule(schedule) 
                                     })
            .then((insertedKey_B) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_B)).to.equal(dbKeyText_B)
                                         return server.insertSchedule(schedule) 
                                     })
            .then((insertedKey_C) => {
                                         expect(DbKeys.getDecodedDateText(insertedKey_C)).to.equal(dbKeyText_C)
                                         return server.getSchedules(dbKey_A, nextMinuteDbKey) 
                                     })
            .then((jsonSchedules) => {
                                         expect(jsonSchedules.size).to.equal(3)
                                     })
            .catch((err) => console.log('ERROR: ', err))

    })

})