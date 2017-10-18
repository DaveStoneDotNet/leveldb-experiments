const moment = require('moment')

const constants = require('./Constants')

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

    static isSameDay(dateMoment_a, dateMoment_b) {
        const month_a = dateMoment_a.month()
        const month_b = dateMoment_b.month()
        const day_a   = dateMoment_a.date()
        const day_b   = dateMoment_b.date()
        return ((month_a === month_b) && (day_a === day_b))
    }
}

module.exports = Common
