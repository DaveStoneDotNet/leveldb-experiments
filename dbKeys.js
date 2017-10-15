const bytewise = require('bytewise')
const moment = require('moment')
const constants = require('./constants')

class DbKeys {

    // Return a bytewise encoded binary from a string, javascript date, or moment...

    static getEncodedDbKey(dateTime) {
        if (typeof dateTime === 'string') {
            return bytewise.encode(moment(dateTime, constants.MILLISECONDFORMAT).toDate())
        } else if (moment.isMoment(dateTime)) {
            return bytewise.encode(dateTime.toDate())
        } else if (dateTime instanceof Date) {
            return bytewise.encode(dateTime)
        } else {
            throw new Error(`Provided parameter is not a Date. ${typeof dateTime}`)
        }
    }

    // Return Millisecond formatted date time text from a binary bytwise encoded key...

    static getDecodedDateText(encodedDbKey) {
        return moment(bytewise.decode(encodedDbKey)).format(constants.MILLISECONDFORMAT)
    }

    // Return a moment a binary bytwise encoded key...

    static getDecodedMoment(encodedDbKey) {
        return moment(bytewise.decode(encodedDbKey))
    }

    // Return a bytewise encoded binary from and existing key with one minute added to it...

    static getNextMinuteEncodedDbKey(encodedDbKey) {
        return DbKeys.getEncodedDbKey(DbKeys.getDecodedMoment(encodedDbKey).add(1, 'minute'))
    }

    // Return a bytewise encoded binary from and existing key with one millisecond added to it...

    static getNextMillisecondEncodedDbKey(encodedDbKey) {
        return DbKeys.getEncodedDbKey(DbKeys.getDecodedMoment(encodedDbKey).add(1, 'ms'))
    }

}

module.exports = DbKeys