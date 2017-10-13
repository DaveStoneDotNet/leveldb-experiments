
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Consider creating a server.initialize method that accepts a 'db.json' file name.
// Then create various 'server.spec.js' files which use different 'db.json' files 
// that can test various scenarios based on various different data sets in the 
// various 'db.json' files. For example, large datasets, no datasets, broken and/or 
// invalid datasets, etc.
//
//      -- 'db.json' doesn't exist
//      -- 'db.json' exists but perhaps locked or no permissions
//      -- 'db.json' is empty
//      -- 'db.json' is malformed
//      -- scenarios where no results are returned
//      -- scenarios where multiple/duplicate results are returned
//      -- scenarios with invalid dates or other invalid data
// 
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 
// What do I do about a Schedule that SPANS MANY *DAYS*?
// Should this be a different, SPECIAL Schedule.
//
//      - For example, VACATION - 10/7/2017 - 10/14/2017
// 
//  So would this be a Recurring Schedule or multiple ALL DAY User Schedules? Perhaps, 
//
//      - Recurring
//      - Schedules
//      - All Day
// 
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DUPLICATE ENTRIES - SCHEDULES THAT OCCUR AT THE EXACT SAME DATE-TIME
// 
// Can't imagine a scenario where a schedule needs to be accurate down to the MILLISECOND.
// Consider incrementing the MILLISECOND portion for duplicate schedules. 
// 
// EXAMPLE:
// 
//      - 10/07/2017 07:00:00.0000 PM   - Meeting 1
//      - 10/07/2017 07:00:00.0001 PM   - Meeting 2
//      - 10/07/2017 07:00:00.0002 PM   - Meeting 3
// 
// Also considering using the MILLISECOND portion for indicating the schedule TYPE (see below)
// 
// EXAMPLE:
// 
//      - 10/07/2017 07:00:00.0000 PM   - Meeting 1     - .000... means it's a user
//      - 10/07/2017 07:00:00.1001 PM   - Meeting 2     - .100... means it's recurring
//      - 10/07/2017 07:00:00.1002 PM   - Meeting 3     - .100... means it's recurring
// 
// So this might allow the MILLISECOND portion to represent different schedule TYPES.
// 
// EXAMPLE:
// 
//      - .000... means it's a user
//      - .100... means it's recurring
//      - .200... means something else
//
// If so, this might mean that a schedule can only be of ONE TYPE. Could a schedule ever
// be TWO TYPES? For example, a User Schedule AND a Recurring Schedule. Difficult to say 
// since I'm not sure what future types may be necessary.
// 
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Thinking all of this may allow to use the numerical UNIX date as a UNIQUE IDENTIFIER for CRUD.
// 
// But not sure how this would work out for a recurring WHERE clause.
// 
// Also not sure about what to do with schedules that don't have a start or end date. 
// 
//      - 1360013296123 - A unix date looks like this (with milliseconds)
//      - 0000000000000 - Would this be possible... ?
//      - 0000000000000.100...  ...or this?
// 
// OR SHOULD RECURRING JUST GO INTO A SEPARATE DATABASE?
// Maybe ALL TYPES should just go into their own separate databases? This would get rid of the 
// whole annoying milliseconds idea.
// 
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// SCHEDULE TYPES:
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 
//      - One-Off User Schedules : meeting, dentist appointment
//          - Schedules with a specific date and time
//              -------------------------
//              - YES : DATE 
//              - YES : TIME 
//              - NA  : DAY OF THE WEEK 
//              -------------------------
//              .000... milliseconds means it's a user
//              -------------------------
//              getUserSchedules
//              -------------------------
//            - User Schedules MUST have a start DATE and if they don't have a TIME then the time is 
//              assumed to be the first second of the day - 00:01 AM.
//              A User Schedule could be ALL DAY defined as 00:01 AM to 11:59 PM.
//              Thinking perhaps a designated ALL DAY property is NOT necessary, i.e. ALL DAY would 
//              be designated by... ?
//              If a User Schedule does not have and END DATE then...
// 
//      - Recurring User Schedules in a date range : recurring project meeting, sporting event? (necessary?)
//          - Schedules on a certain day of the week (m-f) but only during a certain date range
//              -------------------------
//              - YES : DATE INDICATES DATE RANGE (NOT THE DATE OF THE SCHEDULE)
//              - YES : TIME 
//              - YES : DAY OF THE WEEK < < <
//              -------------------------
//              getRecurringSchedules
//              -------------------------
// 
//      - Unbounded Recurring User Schedules ONE : birthday, anniversary
//          - Schedules on a specific day of the year (NOT m-f) and potentially last forever...
//              ... or, in certain cases like birthdays and anniversary NOT show up BEFORE the 
//              schedule has actually occurred. i.e. don't show a birthday before you were born
//              -------------------------
//              - YES : DATE INDICATES THE *FIRST* EVENT - END DATE SAME AS THE START DATE
//              - OPT : TIME - OPTIONAL - EVENT IS FOR THE DAY BUT TIME MIGHT INDICATE *FIRST* EVENT TIME
//              - NA  : DAY OF THE WEEK
//              -------------------------
//              - - - - - - - - - - - - -
//              -------------------------
// 
//      - Unbounded Recurring User Schedules TWO : meeting, ???
//          - Schedules on a specific day of the week (NOT a day of the year) and potentially last forever.
//              Unlike the first scenario with birthdays and anniversaries, this occurs on a day of the 
//              week and doesn't necessarily have a start or end date
//              -------------------------
//              - YES : DATE INDICATES THE *FIRST* EVENT - END DATE SAME AS THE START DATE
//              - OPT : TIME - OPTIONAL - EVENT IS FOR THE DAY BUT TIME MIGHT INDICATE *FIRST* EVENT TIME
//              - NA  : DAY OF THE WEEK  < < <
//              -------------------------
//              - - - - - - - - - - - - -
//              -------------------------
// 
//      - System Schedules : day, work schedules that need 'special' handling
//          - Almost all schedules will be for indicating when the schedule BEGINS. Only certain
//              'special' schedules will be used for indicating the END of the schedule. For example, 
//              "Your workday will END in 3 hours 15 minutes"
//              -------------------------
//              - NO  : EMPTY - UNBOUNDED - FOREVER
//              - YES : REQUIRED
//              - NA  : DAY OF THE WEEK 
//              -------------------------
//              - - - - - - - - - - - - -
//              -------------------------
// 
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// VALIDATIONS - NOTES
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Currently, 'db.json' categorizes by 'schedules' and 'recurring' because the 'schemas' of the two 
// types are different. Recurring schedules have to be different; they may or may not have a date or 
// a time. Keep in mind that when managing these schedules, if a user switches back-and-forth between
// the two types, you will potentially have to add to one category while also deleting from the other.
//  This could complicate things if other categories are needed.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

