const moment = require('moment')

const constants = require('./constants')

class Common {

    static forEachPromise(items, fn) {
        return items.reduce((promise, item) => {
            return promise.then(() => {
                return fn(item);
            });
        }, Promise.resolve());
    }

    static getDateTimeText(date, time) {
        return `${date} ${time}`
    }

    static getDateTimeMoment(date, time) {
        return moment(Common.getDateTimeText(date, time), constants.DATETIMEFORMAT)
    }
}

module.exports = Common