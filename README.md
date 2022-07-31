# firehose refactor

doing a refactor on src/firehose.ts. the ideal is to be able to compile and drop-in replace most of the functionality while having stronger types and stuff.

## development

you need **node 16** and **python 3**. run:

- `npm start` for development
- `npm build` to build, then upload the `build` folder
- `./new_scripts/update_schedule.sh` to update schedule

## notes on tooling

introduce as few dependencies as possible so future maintainers won't die.

node is version-locked to 16 for now, but should be able to upgrade to 18 when it's in lts.

- we're using create-react-app.
  - this is assuming it's familiar to people from web.lab, and so will have a lifetime of at least a few years.
  - a bit unusual to use create-react-app in a project this late, but it still works mostly well.
- we're using fullcalendar for the schedule and ag grid for the list of classes.
  - library use is unavoidable, even old firehose had it, but we try to pick libraries that will last.
  - fullcalendar, for example, was used in old firehose (back in v3) and we still use it now.
  - it's unclear how long ag grid will last, but given its popularity right now, it'll probably last decently long.
- we're using typescript, cf. firehose.tsx.
  - this is assuming it's familiar to people from 6.031, and so will have a lifetime of at least a few years.
  - much of the type shenanigans (e.g. RawClass) is bad, but fixing it will involve fixing the python scrapers themselves.
- scrapers are still largely the same.
  - they're written in python 3, which is likely to live for a few years.
- serialization is done with base2048 and msgpack-lite

## notes on script.js

all_sections
- ["6.031", "l"]
- ["18.03", "l"] etc.

classes map
- maps class no to class obj
- no: "6.031"
- n: "Software Construction"
- s: ["l", "r", "b"]
  - "a" is activity for a custom activity
  - at: activity times
  - atr: activity times raw
- units:
  - u1: 5
  - u2: 0
  - u3: 10
- rating
  - ra: rating (out of 7, can be 0)
  - h: hours (can be 0 if no evals)
  - si: avg # of students
- rp: can be repeated
- tb: true if one section is tbd
- l, r, b: class schedules
  - array of options, each entry looks like
  - [[[6, 3], [66, 3], [126, 3]], "34-101"]
  - [slotNumber, length]
- nx: not offered next year
  - (might as well make it a switch too)
- t: ["FA", "JA", "SP", "SU"] seasons
- switches
  - ha, hh, hs: hass a, hass h, hass s
  - he: hass e
  - v: virtual
  - ci, cw: cih, ciw
  - re: rest
  - la: institute lab
  - pl: partial institute lab (e.g. 5.351)
  - f: has final
  - le: U or G
- pr: prereqs
- sa: same class ass
- mw: meets with
- d: descriptoin
- u: more info link
- i: instructor in charge

locked_slots map
- "18.03,l":"0", "18.03,r":"0"

cur_classes array
- e.g. ["6.031", etc.]
- so it's just indices into classes array

gcal_slots array
- [day-1, hour:minute, end_hour:end_minute, number+" "+type, room]

class_sort(a, b)
- spaceship sort two class codes
- a is "6.802" e.g.

search_setup():
- apparently firehose search supports regex?
- dataTables scroller
- https://datatables.net/reference/api/search()

expand_type():
- l, r, b -> lec, rec, lab

add_cal(number, type, room, slot, len):
- slot encodes day, hour, minute, end_hour, and end_minute somehow (see formulas)
- renders event on fullcalendar: https://fullcalendar.io/docs/v3/renderEvent
- adds a button and sets css

select_helper(all_sections, chosen_slots, chosen_options, cur_conflicts, min_conflicts)
- minimizes number of conflicts? recursive

select_slots()
- sort classes by length
- creates options array, an array of calendar options
- Too many options? Use the "+ Manually set sections" button above the class description to lock recitation times.
- warning for class hours not shown or something
- set total units, set total hours
- adds * or + to button if there is a warning
- sets to localstorage

set_option(index)
- pull options[index], which is
- e.g. [0, 0, 0, 1], corresponding to each of the all_sections classes
- remove calendar events
- add_cal(number, type, room, slotno, len)
- set new curoptions
- set to local storage

conflict_helper(new_sections, old_slots)
- just return false/true whether conflict with things
- used for fits schedule

is_selected(number)
- hass_active etc. are true if the button is pressed
- this sets, for each class, whether or not it is selected

fill_table()
- fills the table on the right
- class, rating, hours, name

link_classes(text, type)
- takes some text, and makes links for the classes to the number
- used in linking class numbers in prereq, or same class as, or meets with

class_desc(number)
- sets class description
- all the little symbols, the rating numbers, class descrpition 
- link to class evals, HKN underground guide
- might as well link to co.mit.edu and interstellar and fireroad and etc.
- set the add/remove/edit class buttons or something

add_class(number)
- oh apparently sortable is the class that holds all the buttons #selected-div
- sets listeners for clicking and double clicking
- local storage? wheeeere

calendar_export()
- gapi.auth2.client, gapi.client
- https://www.googleapis.com/auth/calendar
- might as well do ics (ical) export too, as well as csv (outlook)
- feeds to calendar_send()

restructuring firehose:
- we take the classes object
  - for fill_table, create an array of just number + rating + hours + name
    - updating the fill_table will just be filtering over; shallow copy, keys, not too bad
  - when needed, we will wrap it around a Class constructor, pass that around
    - so cur_classes contains Class es, not strings (so we can disambiguate e.g. classes and activities with same name)
  - e.g. when making class descriptions, when adding to schedule
  - need to be able to add a class, remove a class
  - when class is added/removed, update options for schedule
