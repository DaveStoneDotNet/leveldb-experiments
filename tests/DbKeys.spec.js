const expect = require('chai').expect
const moment = require('moment')

const constants = require('../src/constants')

const DbKeys = require('../src/DbKeys')

describe('DB Keys', () => {

    it('should test getEncodedDbKey', () => {
        
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

    it('should test getDecodedDateText', () => {
        
        const dateText   = '10/06/2017 07:00 PM'
        const dateTextMs = '10/06/2017 07:00:00.000 PM'
        
        const dbKey = DbKeys.getEncodedDbKey(dateText)
    
        const decodedDateText = DbKeys.getDecodedDateText(dbKey)

        expect(decodedDateText).to.equal(dateTextMs)
        
    })

    it('should test getDecodedMoment', () => {
        
        const dateText   = '10/06/2017 07:00 PM'
        const dateTextMs = '10/06/2017 07:00:00.000 PM'
        
        const dbKey = DbKeys.getEncodedDbKey(dateText)
    
        const decodedMoment = DbKeys.getDecodedMoment(dbKey)
        
        expect(moment.isMoment(decodedMoment)).to.be.true
        expect(decodedMoment.format(constants.MILLISECONDFORMAT)).to.equal(dateTextMs)
        
    })

    it('should test getNextMinuteEncodedDbKey', () => {
        
        const dateText   = '10/06/2017 07:00 PM'
        const nextDateText = '10/06/2017 07:01:00.000 PM'
        
        const dbKey = DbKeys.getEncodedDbKey(dateText)
        const nextDbKey = DbKeys.getNextMinuteEncodedDbKey(dbKey)
        
        const nextDbText = DbKeys.getDecodedDateText(nextDbKey)

        expect(nextDbText).to.equal(nextDateText)
        
    })

    it('should test getNextMillisecondEncodedDbKey', () => {
        
        const dateText   = '10/06/2017 07:00 PM'
        const nextDateText = '10/06/2017 07:00:00.001 PM'
        
        const dbKey = DbKeys.getEncodedDbKey(dateText)
        const nextDbKey = DbKeys.getNextMillisecondEncodedDbKey(dbKey)
        
        const nextDbText = DbKeys.getDecodedDateText(nextDbKey)

        expect(nextDbText).to.equal(nextDateText)
        
    })

})
