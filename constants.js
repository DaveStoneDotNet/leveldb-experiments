
const DATEFORMAT        = 'MM/DD/YYYY'
const TIMEFORMAT        = 'hhmm A'
const DATETIMEFORMAT    = 'MM/DD/YYYY hh:mm A'
const MILLISECONDFORMAT = 'MM/DD/YYYY hh:mm:ss.SSS A'

const MON               =  1
const TUE               =  2
const WED               =  4
const THU               =  8
const FRI               = 16
const SAT               = 32
const SUN               = 64

const WEEKDAYS          = MON | TUE | WED | THU | FRI   // 31
const WEEKENDS          = SAT | SUN                     // 96

class Constants {

    static get DATEFORMAT()        { return DATEFORMAT        }
    static get TIMEFORMAT()        { return TIMEFORMAT        }
    static get DATETIMEFORMAT()    { return DATETIMEFORMAT    }
    static get MILLISECONDFORMAT() { return MILLISECONDFORMAT }

    static get MON() { return MON }
    static get TUE() { return TUE }
    static get WED() { return WED }
    static get THU() { return THU }
    static get FRI() { return FRI }
    static get SAT() { return SAT }
    static get SUN() { return SUN }

    static get WEEKDAYS() { return WEEKDAYS }
    static get WEEKENDS() { return WEEKENDS }
}

module.exports = Constants