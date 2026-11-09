-- SAMPLE listing-build assessment (run after migration 0018).
-- Generated from lib/assessment/sample.ts. Fictional property: have someone
-- check the answer key before sending the link to real candidates.
-- Starts CLOSED. Open it from Admin → Assessments when you're ready.
-- Safe to re-run: it skips if an assessment with this title already exists.

insert into public.assessments (title, slug, intro, case_study, config, time_limit_minutes, is_open, is_demo)
select $t$Listing build: 27 Wherry Lane (sample)$t$,
       'wherry-' || substr(md5(gen_random_uuid()::text), 1, 12),
       $intro$This is a timed listing-build exercise.

When you press **Start**, the timer begins and you'll see a property brief on the left and a listing builder on the right, like the one used on Airbnb or Booking.com. Read the brief carefully and build the listing from it.

- You have one attempt. The timer keeps running if you close the page.
- Your answers save automatically as you go.
- When the time is up, whatever you've entered is submitted automatically.
- You're marked on accuracy first, then on how quickly you finish. Accuracy matters more than speed.
- Use only the brief. Don't guess or add anything it doesn't support.$intro$,
       $cs$# 27 Wherry Lane, Ipswich IP3 9QX

*Fictional property for assessment purposes. Any resemblance to a real address or person is coincidental.*

## Before you start

Build the listing using only this brief. The brief was written at onboarding, and **some details have changed since**. The changes are listed under *Updates since this brief was written* at the bottom.

- Where two parts of the brief disagree, the one with the **latest date** is correct.
- **Amenities:** only list what is present and working. If something is broken, missing or gone, leave it off.
- **Exterior cameras**, including doorbell cameras, must be listed under *Exterior security cameras*.
- **Wi-Fi speed:** use the measured download speed, not the broadband package speed.
- **Discounts:** if there isn't one, enter 0.
- **Parking:** choose the option that is on the property itself if there is one.
- The current title and description are drafts. Write your own within the character limits.

---

## Property summary

*Onboarding brief, 28 October 2026*

- **Address:** 27 Wherry Lane, Ipswich, IP3 9QX
- **Property type:** Semi-detached house. Guests have the whole house.
- **Bedrooms:** 3
- **Bathrooms:** 1 family bathroom (bath with shower over), plus a downstairs toilet and hand basin
- **Maximum occupancy:** 7 guests (using the sofa bed)
- **Nightly rate:** £110 (owner's request, to be confirmed by the revenue team)
- **Cleaning fee:** to be confirmed by the revenue team
- **Long-stay discount:** 10% for stays of 90 nights or more
- **Cancellation policy:** Strict (14 days)
- **Minimum stay:** 2 nights. **Maximum stay:** 90 nights.
- **Booking notice:** at least 1 day before arrival, so the cleaner can turn the house round
- **Ideal for:** contractors working on the port and the A14 business parks, relocations (people moving to the area for work, sometimes with their families) and insurance placements. The owner does not want it aimed at holidaymakers, students or general business travellers.
- **Pets:** Not allowed (owner's insurance).
- **Parking:** Driveway parking for up to 2 vehicles. Free on-street parking on Wherry Lane as well.

## Sleeping arrangements

- **Bedroom 1 (front):** 1 King Bed
- **Bedroom 2 (rear):** 1 Double Bed
- **Bedroom 3 (box room):** 1 Single Bed
- **Living room:** 1 Sofa Bed (double)

---

## Current listing copy

*Draft written by the owner, 28 October 2026*

### Spacious Family Home Near Ipswich Docks with Driveway, Garden and Fast Fibre Broadband

Welcome to our 1950s semi-detached house on a quiet road in Ipswich, extended at the back in 2011 and recently redecorated throughout. It's a comfortable base for anyone working in or relocating to the area, with the port, the A14 and the town centre all a short drive away.

There's plenty of room for a work crew or a relocating family, with three bedrooms, a lounge with a sofa bed, a kitchen-diner and a private garden.

### Property features

**Bathrooms**

- Family bathroom upstairs with a bath and shower over.
- Downstairs WC under the stairs.

**Amenities**

- Wi-Fi: fibre broadband, "up to 500 Mbps" package.
- Smart TV in the lounge, logged in to Netflix.
- Gas central heating (combi boiler serviced September 2026) and plenty of hot water.
- Towels, bed linen, soap and toilet roll provided.
- Hair dryer, iron and ironing board, and hangers in every wardrobe.
- Kitchen-diner: gas hob, electric oven, fridge freezer, microwave, toaster and kettle.
- Pots, pans and utensils, plus oil, salt and pepper. Plates, bowls, glasses and cutlery for 6. Dining table with 4 chairs.
- Washing machine and tumble dryer in the utility area, plus a clothes airer.
- Desk and office chair in bedroom 3, a proper workspace.
- Enclosed rear garden with a lawn, a small patio with a table and four chairs, and a BBQ.
- Smoke alarm on each floor, carbon monoxide alarm by the boiler, fire extinguisher and fire blanket in the kitchen, first aid kit under the sink.
- No air conditioning. There's a pedestal fan in bedroom 1.

**Parking details**

- Driveway parking for 2 cars. Free on-street parking too.

### Guest access

Guests have the whole house, with their own front door. Entry is via a **keypad lock** on the front door, and the code changes for each booking. (There is also a key safe at the back, but it holds the shed key and is not for guests.)

A **video doorbell** covers the front path and driveway and records when it detects motion. There are no cameras indoors.

- Check-in: From 3:00 PM
- Check-out: By 11:00 AM

### Location highlights

- Ipswich railway station: about 1.5 miles, with trains to London in just over an hour.
- Port of Felixstowe: about 11 miles along the A14.
- Christchurch Park: about 2 miles, good for walks and runs.
- Large supermarket and retail park: about 0.4 miles, which also has the nearest public EV charger.

### House rules

- **Smoking:** No smoking or vaping anywhere on the property, including the garden.
- **Parties and events:** Not allowed. The neighbours on the attached side work early shifts.
- **Quiet hours:** 10:00 PM to 7:00 AM.
- **Children:** Welcome.
- **Pets:** Not allowed.

---

## Updates since this brief was written

### 3 November 2026: cleaner's walkthrough

- Two steps up to the front door from the drive, so there's no step-free access.
- The tumble dryer turned on but didn't heat up. The owner has been told. The washing machine and airer work fine.
- Bedroom 2 still has the double bed. The owner says he's swapping it for two singles next week.
- There's **no coffee machine** and **no dishwasher**.
- The owner's **BBQ has gone**. He took it to Felixstowe.
- No EV charger at the property.
- Speed test in the lounge: **152 Mbps download**, 31 Mbps upload.
- The bookshelf in the lounge is empty. The owner took his books.

### 5 November 2026: email from the owner

1. The **two single beds are now in bedroom 2**, and the double has gone.
2. The **tumble dryer is broken** and the engineer can't come until January, so don't list it.
3. Half of the driveway turns out to be the neighbour's right of way, so **only one car can park on the drive** now. Guests can still park on the street for free.
4. Please make **check-out 10:00 AM**, not 11:00. The cleaner can only do mornings.
5. **Maximum 5 guests.** The sofa bed stays in the lounge for flexibility, but it doesn't add to the headcount.
6. Please add to the house rules that **bins go out on Wednesday night** for Thursday collection, and that guests must **keep the side gate shut** because the neighbour's dog gets out.

### 6 November 2026: revenue team

These replace anything said earlier.

- **Nightly rate: £95.** The owner has agreed £95, down from the £110 he asked for, to win longer stays.
- **Cleaning fee: £70 per stay.** (The cleaner charges us £55 per clean. That's our cost, not the guest fee.)
- **Extra guest fee: £10 per guest, per night, after the 4th guest.**
- **No weekly or monthly discount.** The only discount is the standard 10% for stays of 90 nights or more.
- **Minimum stay: 3 nights.** Maximum stay stays at 90 nights.
- Cancellation stays at **Strict (14 days)**.
- Long-term stays are allowed.
- **Example contractor quote:** show the total for a crew of **4 people** staying **28 nights**, with any discount that applies and the cleaning fee added once.$cs$,
       $cfg${
  "fields": {
    "propertyType": {
      "weight": 1,
      "answer": "house"
    },
    "placeType": {
      "weight": 1,
      "answer": "entire"
    },
    "street": {
      "weight": 1,
      "answer": "27 Wherry Lane"
    },
    "city": {
      "weight": 1,
      "answer": "Ipswich"
    },
    "postcode": {
      "weight": 1,
      "answer": "IP3 9QX"
    },
    "targetGuests": {
      "weight": 1,
      "answer": [
        "contractors_and_work_crews",
        "relocations",
        "insurance_placements"
      ]
    },
    "title": {
      "weight": 2,
      "mustMention": [
        "3 bed|three bed|3 bedroom|three bedroom|3bed",
        "ipswich",
        "contractor|contractors|work crew|work crews|crew|crews|workers"
      ]
    },
    "description": {
      "weight": 3,
      "mustMention": [
        "3 bed|three bed|3 bedroom|three bedroom|3bed|3 bedrooms|three bedrooms",
        "sleeps 5|5 guests|five guests|up to 5|sleeps five|up to five",
        "ipswich",
        "parking|driveway|drive",
        "wifi|wi fi|broadband|internet",
        "workspace|desk|work space",
        "washing machine|washer|laundry",
        "self check in|keypad|self checkin",
        "contractor|contractors|work crew|crews|relocation|relocations|relocating"
      ]
    },
    "maxGuests": {
      "weight": 1,
      "answer": 5
    },
    "bedrooms": {
      "weight": 1,
      "answer": 3
    },
    "beds": {
      "weight": 1,
      "answer": 5
    },
    "bathrooms": {
      "weight": 1,
      "answer": 1.5
    },
    "rooms": {
      "weight": 2,
      "answer": {
        "bedrooms": [
          {
            "king": 1
          },
          {
            "single": 2
          },
          {
            "single": 1
          }
        ],
        "common": {
          "sofa": 1
        }
      }
    },
    "amenities": {
      "weight": 4,
      "answer": [
        "wi_fi",
        "tv",
        "central_heating",
        "hot_water",
        "essentials",
        "hair_dryer",
        "iron",
        "hangers",
        "kitchen",
        "fridge",
        "freezer",
        "oven",
        "hob",
        "microwave",
        "kettle",
        "toaster",
        "cooking_basics",
        "dishes_and_cutlery",
        "dining_table",
        "washing_machine",
        "clothes_drying_rack",
        "dedicated_workspace",
        "long_term_stays_allowed",
        "streaming_services",
        "private_garden",
        "patio_or_balcony",
        "outdoor_furniture",
        "smoke_alarm",
        "carbon_monoxide_alarm",
        "fire_extinguisher",
        "first_aid_kit",
        "exterior_security_cameras",
        "private_entrance"
      ]
    },
    "parking": {
      "weight": 1,
      "answer": "free_parking_on_premises"
    },
    "parkingSpaces": {
      "weight": 1,
      "answer": 1
    },
    "wifiSpeed": {
      "weight": 1,
      "answer": 152
    },
    "baseRate": {
      "weight": 1,
      "answer": 95
    },
    "cleaningFee": {
      "weight": 1,
      "answer": 70
    },
    "extraGuestFee": {
      "weight": 1,
      "answer": 10
    },
    "extraGuestFrom": {
      "weight": 1,
      "answer": 4
    },
    "weeklyDiscount": {
      "weight": 1,
      "answer": 0
    },
    "monthlyDiscount": {
      "weight": 1,
      "answer": 0
    },
    "longStayDiscount": {
      "weight": 1,
      "answer": 10
    },
    "contractorQuote": {
      "weight": 2,
      "answer": 2730,
      "tolerance": 1
    },
    "minNights": {
      "weight": 1,
      "answer": 3
    },
    "maxNights": {
      "weight": 1,
      "answer": 90
    },
    "advanceNotice": {
      "weight": 1,
      "answer": "1_day"
    },
    "checkInFrom": {
      "weight": 1,
      "answer": "15:00"
    },
    "checkInUntil": {
      "weight": 0,
      "answer": ""
    },
    "checkOut": {
      "weight": 1,
      "answer": "10:00"
    },
    "checkInMethod": {
      "weight": 1,
      "answer": "keypad"
    },
    "cancellation": {
      "weight": 1,
      "answer": "strict"
    },
    "petsAllowed": {
      "weight": 1,
      "answer": "no"
    },
    "smokingAllowed": {
      "weight": 1,
      "answer": "no"
    },
    "eventsAllowed": {
      "weight": 1,
      "answer": "no"
    },
    "childrenAllowed": {
      "weight": 1,
      "answer": "yes"
    },
    "quietFrom": {
      "weight": 1,
      "answer": "22:00"
    },
    "quietUntil": {
      "weight": 1,
      "answer": "07:00"
    },
    "additionalRules": {
      "weight": 1,
      "mustMention": [
        "bin|bins|rubbish|recycling",
        "gate"
      ]
    }
  }
}$cfg$::jsonb,
       60, false, false
where not exists (select 1 from public.assessments where title = $t$Listing build: 27 Wherry Lane (sample)$t$);
